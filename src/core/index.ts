interface Server {
  core: Sharkapi;
  start: () => void;
}

interface Model {
  core: Sharkapi;
  getEntityName: () => string;
  getProperties: () => Array<string>;
  getRelationships: () => Array<string>;

  index: () => Array<any>;
  create: () => any;
  update: () => any;
  destroy: () => any;
}

class Sharkapi {
  server: Server;
  models: Array<Model>;
}
