import { HookRequest, findHooks, callHooks } from '../../core/hooks';
import { IndexAction, Relationship, Filter, Sort, Page, Action, Field } from '../index';
import { SequelizeEntity } from './sequelize-entity.js';
import { factoryInclude, factoryOrder, factoryWhere, factoryPage, factoryAttributes } from './helpers.js';

export class SequelizeIndexAction implements IndexAction {
  type: Action;
  entity: SequelizeEntity;
  sort: Array<Sort | HookRequest>;
  filters: Array<Filter | HookRequest>;
  relationships: Array<Relationship | HookRequest>;
  page: Page;
  pageHooks: Array<HookRequest>;
  selectedFields: Array<Field>;

  constructor() {
    this.type = 'index';
    this.sort = [];
    this.filters = [];
    this.relationships = [];
    this.page = {};
    this.pageHooks = [];
    this.selectedFields = [];
  }

  async run(): Promise<any> {
    let query;
    let context = { subQuery: false };
    context = factoryAttributes(this.selectedFields, context) || context;
    context = factoryInclude(this.relationships, context) || context;
    context = factoryWhere(this.filters, context) || context;
    context = factoryOrder(this.sort, context) || context;
    context = factoryPage(this.page, this.pageHooks, context) || context;

    context = callHooks(findHooks(this.entity.getHooks(), 'index-before'), context);
    let count = await this.entity.source.count(context);
    query = await this.entity.source.findAll(context);
    query = callHooks(findHooks(this.entity.getHooks(), 'index-after'), query);

    return { count, data: query };
  }
}
