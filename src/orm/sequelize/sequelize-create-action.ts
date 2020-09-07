import { findHooks, callHooks } from '../../core/hooks';
import { CreateAction } from '../index';
import { SequelizeEntity } from './sequelize-entity.js';

export class SequelizeCreateAction implements CreateAction {
  entity: SequelizeEntity;
  data: any;

  async run(): Promise<any> {
    let query;
    let context = this.data;

    context = callHooks(findHooks(this.entity.getHooks(), 'create-before'), context);
    query = await this.entity.source.create(context);
    query = callHooks(findHooks(this.entity.getHooks(), 'create-after'), query);

    return query;
  }
}
