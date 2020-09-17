import { SharkApi } from '../core/index';
import { EntityBase, Field, Filter, IndexAction, Relationship, ShowAction, Sort, SortCriteria } from '../orm';
import { ServerBase } from './index';
import { Error } from '../core/error';
import { pascalCase } from 'change-case';
import { HookRequest } from '../core/hooks';
import { singular } from 'pluralize';

export class ServerGraphQL implements ServerBase {
  graphql: any;
  graphqlIsoDate: any;
  core: SharkApi;
  types: Array<any>;

  constructor(core: SharkApi, graphql: any, graphqlIsoDate: any) {
    this.core = core;
    core.server = this;
    this.graphql = graphql;
    this.graphqlIsoDate = graphqlIsoDate;
    this.types = [];
  }

  createResources(): any {
    let queryType = new this.graphql.GraphQLObjectType({
      name: 'Query',
      fields: () => {
        let result = {};

        let typePageInfo = this.factoryTypePageInfo();
        for (let entity of this.core.entities) {
          let relationships = entity.getRelationships();
          let type = this.factoryType(entity, relationships);
          let typeInput = this.factoryTypeInput(entity);
          let typeConnection = this.factoryTypeConnection(entity, type, typePageInfo);
          let typeSort = this.factoryTypeSort(entity);
          let typeFilter = this.factoryTypeFilter(entity);

          let args = {};
          if (typeSort) args['sort'] = { type: typeSort };
          if (typeFilter) args['filter'] = { type: typeFilter };

          result[entity.name.plural] = {
            type: typeConnection,
            args: args,
            resolve: async (source, args, context, info) => {
              let action = entity.newIndexAction();
              this.parseSort(action, args.sort);
              this.parseFilter(action, args.filter);
              // this.parseFields(action, info);
              this.parseRelationships(action, info, true);
              let rows = await action.run();
              return { nodes: rows.rows, totalCount: rows.count };
            },
          };

          result[entity.name.singular] = {
            type: type,
            args: this.factoryFields(entity, true),
            resolve: async (source, args, context, info) => {
              let action = entity.newShowAction();
              action.id = args.id;
              this.parseRelationships(action, info, false);
              let rows = await action.run();
              return rows;
            },
          };
        }
        return result;
      },
    });

    return new this.graphql.GraphQLSchema({ query: queryType });
  }

  factoryType(entity: EntityBase, relationships: Array<Relationship>): any {
    let type = new this.graphql.GraphQLObjectType({
      name: this.pascalCase(entity.name.singular),
      fields: () => ({
        ...this.factoryFields(entity),
        ...this.factoryFieldsByRelationships(relationships),
      }),
    });
    this.types.push(type);
    return type;
  }

  factoryTypeInput(entity: EntityBase): any {
    let type = new this.graphql.GraphQLObjectType({
      name: `${this.pascalCase(entity.name.singular)}Input`,
      fields: this.factoryFields(entity, false),
    });
    this.types.push(type);
    return type;
  }

  factoryTypeConnection(entity: EntityBase, type: any, typePageInfo: any): any {
    let typeConnection = new this.graphql.GraphQLObjectType({
      name: `${this.pascalCase(entity.name.singular)}Connection`,
      fields: {
        pageInfo: { type: typePageInfo },
        nodes: { type: new this.graphql.GraphQLList(type) },
        totalCount: { type: this.graphql.GraphQLInt },
      },
    });
    this.types.push(typeConnection);
    return typeConnection;
  }

  factoryTypeSort(entity: EntityBase): any {
    let values = {};
    this.getSortFromFields(entity, values);
    this.getSortFromHooks(entity, values);

    if (Object.keys(values).length == 0) {
      return null;
    }

    let type = new this.graphql.GraphQLList(
      new this.graphql.GraphQLEnumType({
        name: `${this.pascalCase(entity.name.singular)}Sort`,
        values,
      })
    );
    this.types.push(type);
    return type;
  }

  getSortFromFields(entity: EntityBase, result: any): void {
    for (let field of entity.fields) {
      let hooks = entity.findHooks('sort', field.name);
      let prevent = hooks.filter((h) => h.prevent).length > 0;

      if (!prevent) {
        result[field.name] = { value: `${field.name}-asc` };
        result[`${field.name}_desc`] = { value: `${field.name}-desc` };
      }
    }
  }

  getSortFromHooks(entity: EntityBase, result: any): void {
    let sortHooks = entity.getHooks().filter((h) => h.trigger == 'sort' && typeof h.match == 'string');
    for (let h of sortHooks) {
      if (!h.prevent) {
        result[`${h.match}`] = { value: `${h.match}-asc` };
        result[`${h.match}_desc`] = { value: `${h.match}-desc` };
      }
    }
  }

  factoryTypeFilter(entity: EntityBase): any {
    let fields = {};
    this.getFilterFromFields(entity, fields);
    this.getFilterFromHooks(entity, fields);

    if (Object.keys(fields).length == 0) {
      return null;
    }

    let type = new this.graphql.GraphQLInputObjectType({
      name: `${this.pascalCase(entity.name.singular)}Filter`,
      fields,
    });
    this.types.push(type);
    return type;
  }

  getFilterFromFields(entity: EntityBase, result: any) {
    for (let field of entity.fields) {
      let hooks = entity.findHooks('filter', field.name);
      let prevent = hooks.filter((h) => h.prevent).length > 0;
      if (!prevent) {
        result[field.name] = { type: this.getGraphQLType(field) };
      }
    }
  }

  getFilterFromHooks(entity: EntityBase, result: any) {
    let sortHooks = entity.getHooks().filter((h) => h.trigger == 'filter' && typeof h.match == 'string');
    for (let h of sortHooks) {
      if (!h.prevent) {
        result[`${h.match}`] = { type: this.graphql.GraphQLString };
      }
    }
  }

  factoryFields(entity: EntityBase, primaryKey?: boolean): any {
    let result = {};
    for (let field of entity.fields) {
      let insert: boolean = primaryKey == undefined || field.primaryKey == primaryKey;
      if (insert) {
        let type = this.getGraphQLType(field);
        if (!field.nullable) {
          type = new this.graphql.GraphQLNonNull(type);
        }
        result[field.name] = { type };
      }
    }
    return result;
  }

  factoryFieldsByRelationships(relationships: Array<Relationship>) {
    let result = {};
    for (let relationship of relationships) {
      let typeRelationship = this.getTypeByName(this.pascalCase(singular(relationship.name)));
      if (typeRelationship) {
        if (relationship.type == 'has-many') {
          typeRelationship = new this.graphql.GraphQLList(typeRelationship);
        }
        result[relationship.name] = { type: typeRelationship };
      }
    }
    return result;
  }

  getGraphQLType(field: Field): any {
    if (field.primaryKey) return this.graphql.GraphQLID;
    if (field.type == 'string') return this.graphql.GraphQLString;
    if (field.type == 'integer') return this.graphql.GraphQLInt;
    if (field.type == 'float') return this.graphql.GraphQLFloat;
    if (field.type == 'boolean') return this.graphql.GraphQLBoolean;
    if (field.type == 'datetime') return this.graphqlIsoDate.GraphQLDateTime;
    if (field.type == 'date') return this.graphqlIsoDate.GraphQLDate;
    if (field.type == 'time') return this.graphqlIsoDate.GraphQLTime;
  }

  factoryTypePageInfo() {
    let type = new this.graphql.GraphQLObjectType({
      name: 'PageInfo',
      fields: {
        hasNextPage: { type: this.graphql.GraphQLBoolean },
        hasPreviousPage: { type: this.graphql.GraphQLBoolean },
      },
    });
    this.types.push(type);
    return type;
  }

  parseSort(action: IndexAction, configs: Array<string>): void {
    if (!configs) return;

    for (let config of configs) {
      let [field, criteria] = config.split('-');
      let hooks = action.entity.findHooks('sort', field);
      if (hooks.length > 0) {
        let hooksReq: HookRequest = { name: field, value: criteria, hooks };
        action.sort.push(hooksReq);
      } else if (action.entity.isSortable(field)) {
        let sort: Sort = { name: field, criteria: criteria as SortCriteria };
        action.sort.push(sort);
      } else {
        throw new Error('invalid-sort', `property '${field}' isn't sortable!`);
      }
    }
  }

  parseFilter(action: IndexAction, configs: any): void {
    if (!configs) return;

    for (let config in configs) {
      let [field, value] = [config, configs[config]];
      let hooks = action.entity.findHooks('filter', field);
      if (hooks.length > 0) {
        let hooksReq: HookRequest = { name: field, value, hooks };
        action.filters.push(hooksReq);
      } else if (action.entity.isFilterable(field)) {
        let filter: Filter = { name: field, value };
        action.filters.push(filter);
      } else {
        throw new Error('invalid-filter', `property '${config}' isn't filterable!`);
      }
    }
  }

  pascalCase(s: string): string {
    return pascalCase(s);
  }

  getTypeByName(name: string): any {
    return this.types.find((type) => type.name == name);
  }

  parseRelationships(action: IndexAction | ShowAction, info: any, isConnection: boolean): void {
    let [query] = info.fieldNodes;
    let fieldNodes = this.summarizeFieldNodes(query.selectionSet.selections);
    if (isConnection) {
      fieldNodes = fieldNodes.nodes;
    }
    if (fieldNodes) {
      let relationships = this.createRelationships(fieldNodes);
      action.entity.findRelationshipSources(relationships);
      this.findRelationshipHooks(action, relationships);
      action.relationships = relationships;
    }
  }

  findRelationshipHooks(action: IndexAction | ShowAction, relationships: Array<Relationship>): void {
    for (let i = 0; i < relationships.length; i++) {
      let relationshipsPath = this.factoryRelationshipsPath(relationships[i]);
      for (let path of relationshipsPath) {
        let hooks = action.entity.findHooks('relationship', path);
        if (hooks.length > 0) {
          let hooksReq: HookRequest = { name: path, hooks };
          relationships[i] = hooksReq;
        }
      }
    }
    return null;
  }

  factoryRelationshipsPath(relationship: Relationship): Array<string> {
    let result: Array<string> = [];
    for (let child of relationship.children || []) {
      result.push(`${relationship.name.toLowerCase()}.${this.factoryRelationshipsPath(child)}`);
    }
    if (result.length == 0) {
      result.push(`${relationship.name.toLowerCase()}`);
    }
    return result;
  }

  createRelationships(fieldNodes: any): Array<Relationship> {
    let relationships: Array<Relationship> = [];
    for (let key in fieldNodes) {
      if (fieldNodes[key]) {
        relationships.push({
          name: key,
          children: this.createRelationships(fieldNodes[key]),
        });
      }
    }
    return relationships;
  }

  summarizeFieldNodes(fieldNodes: any): any {
    let result = {};
    for (let fieldNode of fieldNodes) {
      let name = fieldNode.name?.value;
      result[name] = null;
      if (fieldNode.selectionSet) {
        result[name] = this.summarizeFieldNodes(fieldNode.selectionSet.selections);
      }
    }
    return result;
  }
}
