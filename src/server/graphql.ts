import { SharkApi } from '../core/index';
import { EntityBase, Field, Filter, IndexAction, Sort, SortCriteria } from '../orm';
import { ServerBase } from './index';
import { Error } from '../core/error';
import { pascalCase } from 'change-case';
import { HookRequest } from '../core/hooks';

export class ServerGraphQL implements ServerBase {
  graphql: any;
  graphqlIsoDate: any;
  core: SharkApi;
  typePageInfo: any;

  constructor(core: SharkApi, graphql: any, graphqlIsoDate: any) {
    this.core = core;
    core.server = this;
    this.graphql = graphql;
    this.graphqlIsoDate = graphqlIsoDate;
  }

  createResources(): any {
    let queryType = new this.graphql.GraphQLObjectType({
      name: 'Query',
      fields: () => {
        let result = {};

        for (let entity of this.core.entities) {
          let type = this.factoryType(entity);
          let typeInput = this.factoryTypeInput(entity);
          let typeConnection = this.factoryTypeConnection(entity, type);
          let typeSort = this.factoryTypeSort(entity);
          let typeFilter = this.factoryTypeFilter(entity);

          let args = {};
          if (typeSort) args['sort'] = { type: typeSort };
          if (typeFilter) args['filter'] = { type: typeFilter };

          result[entity.name.plural] = {
            type: typeConnection,
            args: args,
            resolve: async (source, args, context, info) => {
              console.log(args.filter);
              let action = entity.newIndexAction();
              this.parseSort(action, args.sort);
              this.parseFilter(action, args.filter);
              let rows = await action.run();
              return { nodes: rows.rows, totalCount: rows.count };
            },
          };

          result[entity.name.singular] = {
            type: type,
            args: this.factoryFields(entity, true),
            async resolve(source, args, context, info) {
              let action = entity.newShowAction();
              action.id = args.id;
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

  factoryType(entity: EntityBase): any {
    return new this.graphql.GraphQLObjectType({
      name: this.pascalCase(entity.name.singular),
      fields: {
        ...this.factoryFields(entity),
      },
    });
  }

  factoryTypeInput(entity: EntityBase): any {
    return new this.graphql.GraphQLObjectType({
      name: `${this.pascalCase(entity.name.singular)}Input`,
      fields: this.factoryFields(entity, false),
    });
  }

  factoryTypeConnection(entity: EntityBase, type: any): any {
    return new this.graphql.GraphQLObjectType({
      name: `${this.pascalCase(entity.name.singular)}Connection`,
      fields: {
        pageInfo: { type: this.getTypePageInfo() },
        nodes: { type: new this.graphql.GraphQLList(type) },
        totalCount: { type: this.graphql.GraphQLInt },
      },
    });
  }

  factoryTypeSort(entity: EntityBase): any {
    let values = {};
    this.getSortFromFields(entity, values);
    this.getSortFromHooks(entity, values);

    if (Object.keys(values).length == 0) return null;
    return new this.graphql.GraphQLList(
      new this.graphql.GraphQLEnumType({
        name: `${this.pascalCase(entity.name.singular)}Sort`,
        values,
      })
    );
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

    if (Object.keys(fields).length == 0) return null;
    return new this.graphql.GraphQLInputObjectType({
      name: `${this.pascalCase(entity.name.singular)}Filter`,
      fields,
    });
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

  getTypePageInfo() {
    this.typePageInfo =
      this.typePageInfo ||
      new this.graphql.GraphQLObjectType({
        name: 'PageInfo',
        fields: {
          hasNextPage: { type: this.graphql.GraphQLBoolean },
          hasPreviousPage: { type: this.graphql.GraphQLBoolean },
        },
      });
    return this.typePageInfo;
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
}
