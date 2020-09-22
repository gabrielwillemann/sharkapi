export { SharkAPI, CoreOptions } from './core/index';
export { ServerRestAPI, RestAPIOptions } from './server/restapi/index';
export { ServerGraphQL, GraphQLOptions } from './server/graphql/index';
export { SequelizeEntity } from './orm/sequelize/index';

export * as server from './server/index';
export * as restAPI from './server/restapi/index';
export * as graphQL from './server/graphql/index';

export * as orm from './orm/index';
export * as sequelize from './orm/sequelize/index';

export * as error from './core/error';
export * as hooks from './core/hooks';
