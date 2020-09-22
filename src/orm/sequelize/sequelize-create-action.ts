import { findHooks, callHooks } from '../../core/hooks';
import { Action, CreateAction } from '../index';
import { SequelizeEntity } from './sequelize-entity';

export class SequelizeCreateAction implements CreateAction {
  type: Action;
  entity: SequelizeEntity;
  data: any;

  constructor() {
    this.type = 'create';
  }

  async run(): Promise<any> {
    let query;
    let context = this.data;

    context = callHooks(findHooks(this.entity.getHooks(), 'create-before'), context);
    query = await this.entity.source.create(context);
    query = callHooks(findHooks(this.entity.getHooks(), 'create-after'), query);

    return query;
  }
}
