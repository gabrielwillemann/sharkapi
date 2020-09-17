import { pascalCase } from 'change-case';
import { singular } from 'pluralize';

import { SharkApi } from '../../core/index';
import { EntityBase, Field, Relationship } from '../../orm';
import { ServerBase } from '../index';

import { GraphQLIndexAction, GraphQLShowAction } from './actions';

export class ServerGraphQL implements ServerBase {
  graphql: any;
  graphqlIsoDate: any;
  core: SharkApi;
  types: Array<any>;

  constructor(core: SharkApi, { graphql, graphqlIsoDate }: GraphQLOptions) {
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
          let actions = entity.options?.actions || ['index', 'show', 'create', 'update', 'delete'];
          let type = this.factoryType(entity);
          let typeInput = this.factoryTypeInput(entity);

          if (actions.includes('index')) {
            Object.assign(result, this.actionIndex(entity, { type, typePageInfo }));
          }
          if (actions.includes('show')) {
            Object.assign(result, this.actionShow(entity, { type }));
          }
        }
        return result;
      },
    });

    return new this.graphql.GraphQLSchema({ query: queryType });
  }

  actionIndex(entity: EntityBase, { type, typePageInfo }): any {
    let typeConnection = this.factoryTypeConnection(entity, type, typePageInfo);
    let typeSort = this.factoryTypeSort(entity);
    let typeFilter = this.factoryTypeFilter(entity);
    let typePage = this.factoryTypePage();

    let args = { ...typePage };
    if (typeSort) args['sort'] = { type: typeSort };
    if (typeFilter) args['filter'] = { type: typeFilter };

    return {
      [entity.name.plural]: {
        type: typeConnection,
        args: args,
        resolve: GraphQLIndexAction.bind(null, entity),
      },
    };
  }

  actionShow(entity: EntityBase, { type }): any {
    return {
      [entity.name.singular]: {
        type: type,
        args: this.factoryFields(entity, true),
        resolve: GraphQLShowAction.bind(null, entity),
      },
    };
  }

  factoryType(entity: EntityBase): any {
    let relationships = entity.getRelationships();
    let type = new this.graphql.GraphQLObjectType({
      name: pascalCase(entity.name.singular),
      fields: () => ({
        ...this.factoryFields(entity),
        ...this.factoryFieldsByRelationships(entity, relationships),
      }),
    });
    this.types.push(type);
    return type;
  }

  factoryTypeInput(entity: EntityBase): any {
    let type = new this.graphql.GraphQLObjectType({
      name: `${pascalCase(entity.name.singular)}Input`,
      fields: this.factoryFields(entity, false),
    });
    this.types.push(type);
    return type;
  }

  factoryTypeConnection(entity: EntityBase, type: any, typePageInfo: any): any {
    let typeConnection = new this.graphql.GraphQLObjectType({
      name: `${pascalCase(entity.name.singular)}Connection`,
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
        name: `${pascalCase(entity.name.singular)}Sort`,
        values,
      })
    );
    this.types.push(type);
    return type;
  }

  factoryTypeFilter(entity: EntityBase): any {
    let fields = {};
    this.getFilterFromFields(entity, fields);
    this.getFilterFromHooks(entity, fields);

    if (Object.keys(fields).length == 0) {
      return null;
    }

    let type = new this.graphql.GraphQLInputObjectType({
      name: `${pascalCase(entity.name.singular)}Filter`,
      fields,
    });
    this.types.push(type);
    return type;
  }

  factoryTypePage(): any {
    return {
      first: { type: this.graphql.GraphQLInt },
      offset: { type: this.graphql.GraphQLInt },
    };
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

  factoryFieldsByRelationships(entity: EntityBase, relationships: Array<Relationship>) {
    let result = {};
    for (let relationship of relationships) {
      let hooks = entity.findHooks('relationship', relationship.name.toLowerCase());
      let prevent = hooks.filter((h) => h.prevent).length > 0;
      if (!prevent) {
        let typeRelationship = this.getTypeByName(pascalCase(singular(relationship.name)));
        if (typeRelationship) {
          if (relationship.type == 'has-many') {
            typeRelationship = new this.graphql.GraphQLList(typeRelationship);
          }
          result[relationship.name] = { type: typeRelationship };
        }
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

  getTypeByName(name: string): any {
    return this.types.find((type) => type.name == name);
  }
}

export interface GraphQLOptions {
  graphql: any;
  graphqlIsoDate: any;
}