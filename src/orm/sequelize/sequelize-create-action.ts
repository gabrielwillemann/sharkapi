import { callHooks } from '../../core/hooks';
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
    let context = this.buildContext();
    let query = await this.entity.source.create(context);
    query = callHooks(this.entity.findHooks('create-after'), query);
    return query;
  }

  buildContext(): any {
    let context = this.data;
    context = callHooks(this.entity.findHooks('create-before'), context);
    return context;
  }
}
