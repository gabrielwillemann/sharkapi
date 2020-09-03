import { SharkApi } from '../core/index';
import { Hook, HookTrigger, HookRequest, hookMatch } from '../core/hooks';
import { EntityBase, EntityOptions, IndexRequest, Relationship, Filter, Sort } from './index';

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
    this.options = this.options || {};
    this.options.hooks = this.options.hooks || [];
    return this.options.hooks;
  }

  findHooks(trigger: HookTrigger, name: string): Array<Hook> {
    return this.getHooks().filter((hook) => hookMatch(hook, trigger, name));
  }

  newIndexRequest(): SequelizeIndexRequest {
    let req = new SequelizeIndexRequest();
    req.entity = this;
    return req;
  }
}

export class SequelizeIndexRequest implements IndexRequest {
  entity: SequelizeEntity;
  sort: Array<Sort | HookRequest>;
  filters: Array<Filter | HookRequest>;
  relationships: Array<Relationship | HookRequest>;

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

  callHookRequested(hookReq, context: any): any {
    for (let hook of hookReq.hooks) {
      context = hook.fn({ context, name: hookReq.name, value: hookReq.value }) || context;
    }
    return context;
  }

  callHook(trigger: HookTrigger, context: any): any {
    for (let hook of this.entity.getHooks()) {
      if (hook.trigger == trigger) {
        context = hook.fn({ context }) || context;
      }
    }
    return context;
  }

  async run() {
    let query;
    let context = {};
    context = this.factoryInclude(context) || context;
    context = this.factoryWhere(context) || context;
    context = this.factoryOrder(context) || context;

    context = this.callHook('index-before', context);
    query = await this.entity.source.findAll(context);
    query = this.callHook('index-after', query);
    return query;
  }
}
