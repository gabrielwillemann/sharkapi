import { SharkApi } from '../core/index';
import { Hook, HookTrigger, HookRequest, hookMatch } from '../core/hooks';
import { EntityBase, EntityOptions, IndexAction, ShowAction, Relationship, Filter, Sort, Page } from './index';

export class SequelizeEntity implements EntityBase {
  source;
  core: SharkApi;
  options?: EntityOptions;
  name: string;
  properties: Array<string>;

  loadSource(): void {
    this.loadName();
    this.loadProperties();
  }

  loadName(): void {
    this.name = this.source.tableName;
  }

  loadProperties(): void {
    this.properties = [];
    for (let property in this.source.tableAttributes) {
      this.properties.push(property);
    }
  }

  isSortable(property: string): boolean {
    let field = this.properties.find((prop) => prop == property);
    return !!field;
  }

  isFilterable(property: string): boolean {
    let field = this.properties.find((prop) => prop == property);
    return !!field;
  }

  findRelationshipSources(relationships: Array<Relationship>, source?): void {
    source = source || this.source;
    relationships = relationships || [];
    for (let relationship of relationships) {
      for (let name in source.associations) {
        if (name.toLowerCase() == relationship.name.toLowerCase()) {
          relationship.source = source.associations[name].target;
          break;
        }
      }
      if (!relationship.source) {
        throw `relationship ${relationship.name} not found!`;
      }
      this.findRelationshipSources(relationship.children, relationship.source);
    }
  }

  getHooks(): Array<Hook> {
    let hooks = this.options?.hooks || [];
    return [...this.core.getHooks(), ...hooks];
  }

  findHooks(trigger: HookTrigger, name: string): Array<Hook> {
    return this.getHooks().filter((hook) => hookMatch(hook, trigger, name));
  }

  newIndexAction(): SequelizeIndexAction {
    let req = new SequelizeIndexAction();
    req.entity = this;
    return req;
  }

  newShowAction(): ShowAction {
    let req = new SequelizeShowAction();
    req.entity = this;
    return req;
  }
}

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

  factoryOrder(context: any): any {
    if (!this.sort) return undefined;
    context.order = context.order || [];
    for (let obj of this.sort) {
      if (obj['hooks']) {
        let h = obj as HookRequest;
        context = this.callHookRequested(h, context) || context;
      } else {
        let s = obj as Sort;
        context.order.push([s.name, s.criteria]);
      }
    }
    return context;
  }

  factoryInclude(context: any): any {
    context.include = context.include || [];
    for (let obj of this.relationships) {
      if (obj['hooks']) {
        let h = obj as HookRequest;
        context = this.callHookRequested(h, context) || context;
      } else {
        let r = obj as Relationship;
        context.include = [...context.include, ...this.factoryRelationship([r])];
      }
    }
    return context;
  }

  factoryRelationship(relationships: Array<Relationship>): Array<any> {
    relationships = relationships || [];
    return relationships.map((relationship) => ({
      model: relationship.source,
      include: this.factoryRelationship(relationship.children),
    }));
  }

  factoryWhere(context: any): any {
    if (!this.filters) return undefined;
    context.where = context.where || {};
    for (let obj of this.filters) {
      if (obj['hooks']) {
        let h = obj as HookRequest;
        context = this.callHookRequested(h, context) || context;
      } else {
        let filter = obj as Filter;
        console.log(filter);
        context.where[filter.name] = filter.value;
      }
    }
    return context;
  }

  factoryPage(context: any): any {
    if (this.page) {
      context.limit = this.page.limit;
      context.offset = this.page.offset;
    }
    this.pageHooks = this.pageHooks || [];
    for (let h of this.pageHooks) {
      context = this.callHookRequested(h, context) || context;
    }
    return context;
  }

  callHookRequested(hookReq, context: any): any {
    for (let hook of hookReq.hooks) {
      if (hook.fn && typeof hook.fn == 'function') {
        context = hook.fn({ context, name: hookReq.name, value: hookReq.value }) || context;
      }
    }
    return context;
  }

  callHook(trigger: HookTrigger, context: any): any {
    for (let hook of this.entity.getHooks()) {
      if (hook.trigger == trigger) {
        if (hook.fn && typeof hook.fn == 'function') {
          context = hook.fn({ context }) || context;
        }
      }
    }
    return context;
  }

  async run(): Promise<any> {
    let query;
    let context = { subQuery: false };
    context = this.factoryInclude(context) || context;
    context = this.factoryWhere(context) || context;
    context = this.factoryOrder(context) || context;
    context = this.factoryPage(context) || context;

    context = this.callHook('index-before', context);
    query = await this.entity.source.findAndCountAll(context);
    query = this.callHook('index-after', query);
    return query;
  }
}

export class SequelizeShowAction implements ShowAction {
  entity: EntityBase;
  relationships: Array<Relationship | HookRequest>;
  run(): any {}
}
