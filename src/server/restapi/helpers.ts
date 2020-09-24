import { Error } from '../../core/error';
import { HookRequest } from '../../core/hooks';
import { Filter, IndexAction, ShowAction, Sort, SortCriteria, Relationship } from '../../orm';

export function parseSort(action: IndexAction, query: string): void {
  if (!query) return;
  if (typeof query != 'string') return;

  let fields = query?.split(',');
  for (let field of fields) {
    if (field.length > 0) {
      let [name, criteria] = field[0] == '-' ? [field.slice(1), 'desc'] : [field, 'asc'];

      let hooks = action.entity.findHooks('sort', name);
      if (hooks.length > 0) {
        let hooksReq: HookRequest = { name: name, value: criteria, hooks };
        action.sort.push(hooksReq);
      } else if (action.entity.isSortable(name)) {
        let sort: Sort = { name, criteria: criteria as SortCriteria };
        action.sort.push(sort);
      } else {
        throw new Error('invalid-sort', `property '${name}' isn't sortable!`);
      }
    }
  }
}

export function parseFilter(action: IndexAction, query: any): void {
  if (query instanceof Array) return;
  if (typeof query != 'object') return;

  for (let key in query) {
    let filter: Filter = { name: key, value: query[key] };
    let hooks = action.entity.findHooks('filter', filter.name);
    if (hooks.length > 0) {
      action.filters.push({ name: filter.name, value: filter.value, hooks });
    } else if (action.entity.isFilterable(filter.name)) {
      action.filters.push(filter);
    } else {
      throw new Error('invalid-filter', `property '${key}' isn't filterable!`);
    }
  }
}

export function parsePage(action: IndexAction, query: any): void {
  if (query instanceof Array) return;
  if (typeof query != 'object') return;

  for (let key in query) {
    let hooks = action.entity.findHooks('page', key);
    if (hooks.length > 0) {
      action.pageHooks.push({ name: key, value: query[key], hooks });
    } else if (key == 'limit') {
      action.page.limit = parseInt(query[key]);
    } else if (key == 'offset') {
      action.page.offset = parseInt(query[key]);
    } else {
      throw new Error('invalid-pagination', `property '${key}' is invalid for pagination!`);
    }
  }
}

export function parseRelationships(action: IndexAction | ShowAction, query: string): void {
  if (!query) return;
  if (typeof query != 'string') return;
  let includes = query.split(',');

  let hooksRequested = [];
  for (let i = 0; i < includes.length; i++) {
    let hooks = action.entity.findHooks('relationship', includes[i]);
    if (hooks.length > 0) {
      hooksRequested.push({ name: includes[i], hooks });
      includes[i] = '';
    }
  }

  let includesArray = includes.map((i) => i.split('.'));
  let includesObj = summarizeQueryInclude(includesArray);
  let relationships = createRelationships(includesObj);
  action.entity.findRelationshipSources(relationships);
  action.relationships = [...relationships, ...hooksRequested];
}

function createRelationships(query: any): Array<Relationship> {
  let result = [];
  for (let key in query) {
    result.push({ name: key, children: createRelationships(query[key]) });
  }
  return result;
}

function summarizeQueryInclude(include: Array<Array<string>>): any {
  let result = {};
  for (let entities of include) {
    let current = result;
    for (let entity of entities) {
      if (entity) {
        current[entity] = current[entity] || {};
        current = current[entity];
      }
    }
  }
  return result;
}
