import { HookRequest, callHooks } from '../../core/hooks';
import { Relationship, Sort, Filter, Page, Field } from '../index';

export function factoryInclude(relationships, context: any): any {
  context.include = context.include || [];
  for (let obj of relationships) {
    if (obj['hooks']) {
      let h = obj as HookRequest;
      context = callHooks(h.hooks, context, { name: h.name, value: h.value });
    } else {
      let r = obj as Relationship;
      context.include = [...context.include, ...factoryRelationship([r])];
    }
  }
  return context;
}

export function factoryRelationship(relationships: Array<Relationship>): Array<any> {
  relationships = relationships || [];
  return relationships.map((relationship) => {
    let result = {
      model: relationship.source,
      include: factoryRelationship(relationship.children),
    };
    if (relationship.fields && relationship.fields.length > 0) {
      result['attributes'] = relationship.fields.map((f) => f.name);
    }
    return result;
  });
}

export function factoryOrder(sort: Array<Sort | HookRequest>, context: any): any {
  if (!sort) return undefined;

  context.order = context.order || [];
  for (let obj of sort) {
    if (obj['hooks']) {
      let h = obj as HookRequest;
      context = callHooks(h.hooks, context, { name: h.name, value: h.value });
    } else {
      let s = obj as Sort;
      context.order.push([s.name, s.criteria]);
    }
  }
  return context;
}

export function factoryWhere(filters: Array<Filter | HookRequest>, context: any): any {
  if (!filters) return undefined;

  context.where = context.where || {};
  for (let obj of filters) {
    if (obj['hooks']) {
      let h = obj as HookRequest;
      context = callHooks(h.hooks, context, { name: h.name, value: h.value });
    } else {
      let filter = obj as Filter;
      context.where[filter.name] = filter.value;
    }
  }
  return context;
}

export function factoryPage(page: Page, pageHooks: Array<HookRequest>, context: any): any {
  if (page) {
    context.limit = page.limit;
    context.offset = page.offset;
  }
  pageHooks = pageHooks || [];
  for (let h of pageHooks) {
    context = callHooks(h.hooks, context, { name: h.name, value: h.value });
  }
  return context;
}

export function factoryAttributes(selectedFields: Array<Field>, context: any): any {
  if (selectedFields && selectedFields.length > 0) {
    context.attributes = context.attributes || [];
    for (let field of selectedFields) {
      context.attributes.push(field.name);
    }
  }
  return context;
}
