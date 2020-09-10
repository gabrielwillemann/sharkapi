import { ServerBase } from '../server/index';
import { EntityBase } from '../orm/index';
import { Hook } from './hooks';

export class SharkApi {
  server: ServerBase;
  entities: Array<EntityBase>;
  options: CoreOptions;

  constructor(options?: CoreOptions) {
    this.entities = [];
    this.options = this.options || {};
  }

  getHooks(): Array<Hook> {
    this.options = this.options || {};
    this.options.hooks = this.options.hooks || [];
    return this.options.hooks;
  }
}

export interface CoreOptions {
  hooks?: Array<Hook>;
}
