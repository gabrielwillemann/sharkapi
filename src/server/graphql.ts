import { SharkApi } from '../core/index';
import { EntityBase, Field, IndexAction } from '../orm';
import { ServerBase } from './index';
import { Error } from '../core/error';
import { pascalCase } from 'change-case';

export class ServerGraphQL implements ServerBase {
  graphql: any;
  graphqlIsoDate: any;
  core: SharkApi;

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
        let typePageInfo = this.typePageInfo();
        let typeSort = this.typeSort();

        for (let entity of this.core.entities) {
          let fields = this.factoryFields(entity);
          let pk = this.factoryPrimaryKey(entity);

          let type = new this.graphql.GraphQLObjectType({
            name: this.pascalCase(entity.name.singular),
            fields: {
              ...pk,
              ...fields,
            },
          });

          let typeInput = new this.graphql.GraphQLObjectType({
            name: `${this.pascalCase(entity.name.singular)}Input`,
            fields: fields,
          });

          let typeConnection = new this.graphql.GraphQLObjectType({
            name: `${this.pascalCase(entity.name.singular)}Connection`,
            fields: {
              pageInfo: { type: typePageInfo },
              nodes: { type: new this.graphql.GraphQLList(type) },
              totalCount: { type: this.graphql.GraphQLInt },
            },
          });

          result[entity.name.plural] = {
            type: typeConnection,
            args: {
              sort: { type: typeSort },
            },
            resolve: async (source, args, context, info) => {
              let action = entity.newIndexAction();
              this.parseSort(action, args.sort);
              let rows = await action.run();
              return { nodes: rows.rows, totalCount: rows.count };
            },
          };
          result[entity.name.singular] = {
            type: type,
            args: this.factoryPrimaryKey(entity),
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

  factoryFields(entity: EntityBase): any {
    let result = {};
    for (let field of entity.fields) {
      if (!field.primaryKey) {
        result[field.name] = { type: this.getGraphQLType(field) };
      }
    }
    return result;
  }

  factoryPrimaryKey(entity: EntityBase): any {
    let result = {};
    for (let field of entity.fields) {
      if (field.primaryKey) {
        result[field.name] = { type: this.getGraphQLType(field) };
      }
    }
    return result;
  }

  getGraphQLType(field: Field): any {
    if (field.primaryKey) {
      return new this.graphql.GraphQLNonNull(this.graphql.GraphQLID);
    }

    let type;
    if (field.type == 'string') type = this.graphql.GraphQLString;
    if (field.type == 'integer') type = this.graphql.GraphQLInt;
    if (field.type == 'float') type = this.graphql.GraphQLFloat;
    if (field.type == 'boolean') type = this.graphql.GraphQLBoolean;
    if (field.type == 'datetime') type = this.graphqlIsoDate.GraphQLDateTime;
    if (field.type == 'date') type = this.graphqlIsoDate.GraphQLDate;
    if (field.type == 'time') type = this.graphqlIsoDate.GraphQLTime;

    if (!field.nullable) {
      new this.graphql.GraphQLNonNull(type);
    }
    return type;
  }

  typePageInfo() {
    return new this.graphql.GraphQLObjectType({
      name: 'PageInfo',
      fields: {
        hasNextPage: { type: this.graphql.GraphQLBoolean },
        hasPreviousPage: { type: this.graphql.GraphQLBoolean },
      },
    });
  }

  typeSort() {
    return new this.graphql.GraphQLList(
      new this.graphql.GraphQLInputObjectType({
        name: 'Sort',
        fields: {
          field: {
            type: new this.graphql.GraphQLNonNull(this.graphql.GraphQLString),
          },
          criteria: {
            type: new this.graphql.GraphQLEnumType({
              name: 'SortCriteria',
              values: { ASC: { value: 'asc' }, DESC: { value: 'desc' } },
            }),
          },
        },
      })
    );
  }

  parseSort(action: IndexAction, configs: Array<any>): void {
    if (!configs) return;

    for (let config of configs) {
      let hooks = action.entity.findHooks('sort', config.field);
      if (hooks.length > 0) {
        action.sort.push({ name: config.field, value: config.criteria || 'asc', hooks });
      } else if (action.entity.isSortable(config.field)) {
        action.sort.push({ name: config.field, criteria: config.criteria || 'asc' });
      } else {
        throw new Error('invalid-sort', `property '${config.field}' isn't sortable!`);
      }
    }
  }

  pascalCase(s: string): string {
    return pascalCase(s);
  }
}
