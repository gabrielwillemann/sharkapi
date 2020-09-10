import { findHooks, callHooks } from '../../core/hooks';
import { Error } from '../../core/error';
import { UpdateAction } from '../index';
import { SequelizeEntity } from './sequelize-entity.js';

export class SequelizeUpdateAction implements UpdateAction {
  entity: SequelizeEntity;
  id: number | string;
  data: any;

  async run(): Promise<any> {
    let query;
    let context = this.data;

    context = callHooks(findHooks(this.entity.getHooks(), 'update-before'), context);
    query = await this.entity.source.findByPk(this.id);
    if (!query) throw new Error('record-not-found', 'Invalid id');
    query.set(context);
    query = await query.save();
    query = callHooks(findHooks(this.entity.getHooks(), 'update-after'), query);

    return query;
  }
}