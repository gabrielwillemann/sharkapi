import { HookRequest, callHooks } from '../../core/hooks';
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
    let context = this.buildContext();
    let query = await this.entity.source.findByPk(this.id, context);
    if (!query) {
      throw new Error('record-not-found', 'Invalid id');
    }
    query = callHooks(this.entity.findHooks('show-after'), query);
    return query;
  }

  buildContext(): any {
    let context = { subQuery: false };
    context = factoryAttributes(this.selectedFields, context) || context;
    context = factoryInclude(this.relationships, context) || context;
    context = callHooks(this.entity.findHooks('show-before'), context);
    return context;
  }
}
