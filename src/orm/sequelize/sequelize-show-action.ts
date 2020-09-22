import { HookRequest, findHooks, callHooks } from '../../core/hooks';
import { Error } from '../../core/error';
import { ShowAction, Relationship, Action, Field } from '../index';
import { SequelizeEntity } from './sequelize-entity';
import { factoryInclude, factoryAttributes } from './helpers';

export class SequelizeShowAction implements ShowAction {
  type: Action;
  entity: SequelizeEntity;
  relationships: Array<Relationship | HookRequest>;
  id: number | string;
  selectedFields: Array<Field>;

  constructor() {
    this.type = 'show';
    this.relationships = [];
    this.selectedFields = [];
  }

  async run(): Promise<any> {
    let query;
    let context = { subQuery: false };
    context = factoryAttributes(this.selectedFields, context) || context;
    context = factoryInclude(this.relationships, context) || context;

    context = callHooks(findHooks(this.entity.getHooks(), 'show-before'), context);
    query = await this.entity.source.findByPk(this.id, context);
    if (!query) throw new Error('record-not-found', 'Invalid id');
    query = callHooks(findHooks(this.entity.getHooks(), 'show-after'), query);

    return query;
  }
}
