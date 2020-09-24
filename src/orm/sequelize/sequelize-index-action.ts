import { HookRequest, callHooks } from '../../core/hooks';
import { IndexAction, Relationship, Filter, Sort, Page, Action, Field } from '../index';
import { SequelizeEntity } from './sequelize-entity';
import { factoryInclude, factoryOrder, factoryWhere, factoryPage, factoryAttributes } from './helpers';

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
    let context = this.buildContext();
    let totalCount = await this.entity.source.count(context);
    let query = await this.entity.source.findAll(context);
    query = callHooks(this.entity.findHooks('index-after'), query);
    return { totalCount, data: query };
  }

  buildContext(): any {
    let context = { subQuery: false };
    context = factoryAttributes(this.selectedFields, context) || context;
    context = factoryInclude(this.relationships, context) || context;
    context = factoryWhere(this.filters, context) || context;
    context = factoryOrder(this.sort, context) || context;
    context = factoryPage(this.page, this.pageHooks, context) || context;
    context = callHooks(this.entity.findHooks('index-before'), context);
    return context;
  }
}
