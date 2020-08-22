abstract class ServerBase {
  express;
  core: SharkApi;

  constructor(core: SharkApi) {
    this.core = core;
  }

  createResources(): void {}
  createIndex() {}
}

class ServerRestApi extends ServerBase {
  createResources() {
    this.createIndex();
  }

  createIndex() {
    for (let entity of this.core.entities) {

      this.express.get(`/${entity.name()}`, async (req, res) => {
        let rows = await entity.index();
        res.send(rows);
      });
    }
  }
}

class ServerGraphQl extends ServerBase {}

abstract class EntityBase {
  core: SharkApi;
  source;

  constructor(core: SharkApi) {
    this.core = core;
  }

  name(): string {
    return null;
  }
  properties(): Array<string> {
    return null;
  }
  relationships(): Array<string> {
    return null;
  }
  async index() {
    return null;
  }
  async create() {
    return null;
  }
  async update() {
    return null;
  }
  async destroy() {
    return null;
  }
}

class EntitySequelize extends EntityBase {
  name(): string {
    return this.source.tableName;
  }
  async index() {
    return await this.source.findAll();
  }
}

export class SharkApi {
  server: ServerBase;
  entities: Array<EntityBase>;

  constructor() {
    this.entities = [];
  }

  restApiServer(express): ServerRestApi {
    this.server = new ServerRestApi(this);
    this.server.express = express;
    return this.server;
  }

  entitySequelize(entity: object): EntitySequelize {
    let ent = new EntitySequelize(this);
    ent.source = entity;
    this.entities.push(ent);
    return ent;
  }
  createResources(): void {
    this.server.createResources();
  }
}
