import { HookRequest, findHooks, callHooks } from '../../core/hooks';
import { Error } from '../../core/error';
import { ShowAction, Relationship } from '../index';
import { SequelizeEntity } from './sequelize-entity.js';
import { factoryInclude } from './helpers.js';

export class SequelizeShowAction implements ShowAction {
  entity: SequelizeEntity;
  relationships: Array<Relationship | HookRequest>;
  id: number | string;

  constructor() {
    this.relationships = [];
  }

  async run(): Promise<any> {
    let query;
    let context = { subQuery: false };
    context = factoryInclude(this.relationships, context) || context;

    context = callHooks(findHooks(this.entity.getHooks(), 'show-before'), context);
    query = await this.entity.source.findByPk(this.id, context);
    if (!query) throw new Error('record-not-found', 'Invalid id');
    query = callHooks(findHooks(this.entity.getHooks(), 'show-after'), query);

    return query;
  }
}
