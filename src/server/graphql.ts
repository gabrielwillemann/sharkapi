import { SharkApi } from '../core/index';
import { ServerBase } from './index';

export class ServerGraphQl implements ServerBase {
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
    let queryTypes = [];
    for (let entity of this.core.entities) {
      queryTypes.push(
        new this.graphql.GraphQLObjectType({
          name: entity.name.plural,
          fields: {
            id: { type: this.graphql.GraphQLID },
          },
        })
      );
    }

    let queryType = new this.graphql.GraphQLObjectType({
      name: 'Query',
      fields: () => {
        let fields = {};
        for (let type of queryTypes) {
          fields[type.name] = { type: type };
        }
        return fields;
      },
    });

    return new this.graphql.GraphQLSchema({ query: queryType });
  }
}
