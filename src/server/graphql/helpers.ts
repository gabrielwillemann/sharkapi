import { Error } from '../../core/error';
import { HookRequest } from '../../core/hooks';
import { Field, Filter, IndexAction, Relationship, ShowAction, Sort, SortCriteria } from '../../orm';

export function parseSort(action: IndexAction, configs: Array<string>): void {
  if (!configs) return;

  for (let config of configs) {
    let [field, criteria] = config.split('-');
    let hooks = action.entity.findHooks('sort', field);
    if (hooks.length > 0) {
      let hooksReq: HookRequest = { name: field, value: criteria, hooks };
      action.sort.push(hooksReq);
    } else if (action.entity.isSortable(field)) {
      let sort: Sort = { name: field, criteria: criteria as SortCriteria };
      action.sort.push(sort);
    } else {
      throw new Error('invalid-sort', `property '${field}' isn't sortable!`);
    }
  }
}

export function parseFilter(action: IndexAction, configs: any): void {
  if (!configs) return;

  for (let config in configs) {
    let [field, value] = [config, configs[config]];
    let hooks = action.entity.findHooks('filter', field);
    if (hooks.length > 0) {
      let hooksReq: HookRequest = { name: field, value, hooks };
      action.filters.push(hooksReq);
    } else if (action.entity.isFilterable(field)) {
      let filter: Filter = { name: field, value };
      action.filters.push(filter);
    } else {
      throw new Error('invalid-filter', `property '${config}' isn't filterable!`);
    }
  }
}

export function parsePage(action: IndexAction, first: number, offset: number): void {
  let options = { limit: first, offset: offset };
  for (let key in options) {
    let hooks = action.entity.findHooks('page', key);
    if (hooks.length > 0) {
      action.pageHooks.push({ name: key, value: options[key], hooks });
    } else if (key == 'limit') {
      action.page.limit = options[key];
    } else if (key == 'offset') {
      action.page.offset = options[key];
    } else {
      throw new Error('invalid-pagination', `property '${key}' is invalid for pagination!`);
    }
  }
}

export function parseRootFields(action: IndexAction | ShowAction, info: any): void {
  let [query] = info.fieldNodes;
  let fieldNodes = summarizeFieldNodes(query.selectionSet.selections);
  if (action.type == 'index') {
    fieldNodes = fieldNodes.nodes;
  }
  action.selectedFields = parseFieldByFieldNode(fieldNodes);
}

export function parseRelationships(action: IndexAction | ShowAction, info: any): void {
  let fieldNodes = summarizeFieldNodes(info.selectionSet.selections);
  if (action.type == 'index') {
    fieldNodes = fieldNodes.nodes;
  }
  if (fieldNodes) {
    let relationships = createRelationships(fieldNodes);
    action.entity.findRelationshipSources(relationships);
    findRelationshipHooks(action, relationships);
    action.relationships = relationships;
  }
}

function findRelationshipHooks(action: IndexAction | ShowAction, relationships: Array<Relationship>): void {
  for (let i = 0; i < relationships.length; i++) {
    let relationshipsPath = factoryRelationshipsPath(relationships[i]);
    for (let path of relationshipsPath) {
      let hooks = action.entity.findHooks('relationship', path);
      if (hooks.length > 0) {
        let hooksReq: HookRequest = { name: path, hooks };
        relationships[i] = hooksReq;
      }
    }
  }
  return null;
}

function factoryRelationshipsPath(relationship: Relationship): Array<string> {
  let result: Array<string> = [];
  for (let child of relationship.children || []) {
    result.push(`${relationship.name.toLowerCase()}.${factoryRelationshipsPath(child)}`);
  }
  if (result.length == 0) {
    result.push(`${relationship.name.toLowerCase()}`);
  }
  return result;
}

function createRelationships(fieldNodes: any): Array<Relationship> {
  let relationships: Array<Relationship> = [];
  for (let key in fieldNodes) {
    if (fieldNodes[key]) {
      relationships.push({
        name: key,
        fields: parseFieldByFieldNode(fieldNodes[key]),
        children: createRelationships(fieldNodes[key]),
      });
    }
  }
  return relationships;
}

function parseFieldByFieldNode(fieldNodes: any): Array<Field> {
  let result: Array<Field> = [];
  for (let key in fieldNodes) {
    if (!fieldNodes[key]) {
      result.push({ name: key });
    }
  }
  return result;
}

function summarizeFieldNodes(fieldNodes: any): any {
  let result = {};
  for (let fieldNode of fieldNodes) {
    let name = fieldNode.name?.value;
    result[name] = null;
    if (fieldNode.selectionSet) {
      result[name] = summarizeFieldNodes(fieldNode.selectionSet.selections);
    }
  }
  return result;
}
