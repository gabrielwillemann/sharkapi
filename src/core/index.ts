import { ServerBase, ServerRestApi } from '../server/index.js';
import { EntityBase, EntitySequelize, EntityOptions } from '../orm/index.js';

export class SharkApi {
  server: ServerBase;
  entities: Array<EntityBase>;

  constructor() {
    this.entities = [];
  }

  restApiServer(express): ServerRestApi {
    let restServer: ServerRestApi = new ServerRestApi();
    restServer.core = this;
    restServer.express = express;
    this.server = restServer;
    return restServer;
  }

  entitySequelize(entity, options?: EntityOptions): EntitySequelize {
    let ent = new EntitySequelize();
    ent.core = this;
    ent.source = entity;
    ent.options = options;
    this.entities.push(ent);
    return ent;
  }

  createResources(): void {
    this.server.createResources();
  }
}

