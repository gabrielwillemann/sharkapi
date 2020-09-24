import { callHooks } from '../../core/hooks';
import { Error } from '../../core/error';
import { Action, DeleteAction } from '../index';
import { SequelizeEntity } from './sequelize-entity';

export class SequelizeDeleteAction implements DeleteAction {
  type: Action;
  entity: SequelizeEntity;
  id: number | string;

  constructor() {
    this.type = 'delete';
  }

  async run(): Promise<any> {
    let context = this.buildContext();
    let query = await this.entity.source.findByPk(this.id);
    if (!query) {
      throw new Error('record-not-found', 'Invalid id');
    }
    query = await query.destroy(context);
    query = callHooks(this.entity.findHooks('delete-after'), query);
    return query;
  }

  buildContext(): any {
    let context = {};
    context = callHooks(this.entity.findHooks('delete-before'), context);
    return context;
  }
}
