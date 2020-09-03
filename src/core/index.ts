import { ServerBase, ServerRestApi } from '../server/index';
import { EntityBase, EntityOptions } from '../orm/index';
import { SequelizeEntity } from '../orm/sequelize';
import { Hook } from './hooks';

export class SharkApi {
  server: ServerBase;
  entities: Array<EntityBase>;
  hooks: Array<Hook>;

  constructor() {
    this.entities = [];
    this.hooks = [];
  }

  restApiServer(express): ServerRestApi {
    let restServer: ServerRestApi = new ServerRestApi();
    restServer.core = this;
    restServer.express = express;
    this.server = restServer;
    return restServer;
  }

  entitySequelize(entity, options?: EntityOptions): SequelizeEntity {
    let ent = new SequelizeEntity();
    ent.core = this;
    ent.source = entity;
    ent.options = options;
    ent.loadSource();
    this.entities.push(ent);
    return ent;
  }

  createResources(): void {
    this.server.createResources();
  }
}
