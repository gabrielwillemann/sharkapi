import { findHooks, callHooks } from '../../core/hooks';
import { Error } from '../../core/error';
import { DeleteAction } from '../index';
import { SequelizeEntity } from './sequelize-entity.js';

export class SequelizeDeleteAction implements DeleteAction {
  entity: SequelizeEntity;
  id: number | string;

  async run(): Promise<any> {
    let query;
    let context = {};
    context = callHooks(findHooks(this.entity.getHooks(), 'delete-before'), context);
    query = await this.entity.source.findByPk(this.id);
    if (!query) throw new Error('record-not-found', 'Invalid id');
    query = await query.destroy(context);
    query = callHooks(findHooks(this.entity.getHooks(), 'delete-after'), query);

    return query;
  }
}