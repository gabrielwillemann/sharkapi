import { HookRequest, findHooks, callHooks } from '../../core/hooks';
import { IndexAction, Relationship, Filter, Sort, Page } from '../index';
import { SequelizeEntity } from './sequelize-entity.js';
import { factoryInclude, factoryOrder, factoryWhere, factoryPage } from './helpers.js';

export class SequelizeIndexAction implements IndexAction {
  entity: SequelizeEntity;
  sort: Array<Sort | HookRequest>;
  filters: Array<Filter | HookRequest>;
  relationships: Array<Relationship | HookRequest>;
  page: Page;
  pageHooks: Array<HookRequest>;

  constructor() {
    this.sort = [];
    this.filters = [];
    this.relationships = [];
  }

  async run(): Promise<any> {
    let query;
    let context = { subQuery: false };
    context = factoryInclude(this.relationships, context) || context;
    context = factoryWhere(this.filters, context) || context;
    context = factoryOrder(this.sort, context) || context;
    context = factoryPage(this.page, this.pageHooks, context) || context;

    context = callHooks(findHooks(this.entity.getHooks(), 'index-before'), context);
    query = await this.entity.source.findAndCountAll(context);
    query = callHooks(findHooks(this.entity.getHooks(), 'index-after'), query);

    return query;
  }
}
