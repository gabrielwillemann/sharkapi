import { SharkApi } from '../core/index';
import { EntityBase, Relationship, Sort, IndexAction, Page, ShowAction } from '../orm/index';

export interface ServerBase {
  core: SharkApi;
  createResources(): void;
}

export class ServerRestApi implements ServerBase {
  express;
  core: SharkApi;

  createResources() {
    for (let entity of this.core.entities) {
      let actions = entity.options?.actions || ['index', 'show', 'create', 'update', 'delete'];
      if (actions.includes('index')) this.actionIndex(entity);
      if (actions.includes('show')) this.actionShow(entity);
      if (actions.includes('create')) this.actionCreate(entity);
      if (actions.includes('update')) this.actionUpdate(entity);
      if (actions.includes('delete')) this.actionDelete(entity);
    }
  }

  actionShow(entity: EntityBase): void {
    this.express.get(`/${entity.name}/:id`, async (req, res) => {
      try {
        let action = entity.newShowAction();
        this.parseRelationship(action, req.query.include);
        // this.parseParamId(action, req.params.id);
        let rows = await action.run();
        res.send(rows);
      } catch (error) {
        res.status(500).send({ error: error.message || error });
      }
    });
  }

  actionCreate(entity: EntityBase): void {}
  actionUpdate(entity: EntityBase): void {}
  actionDelete(entity: EntityBase): void {}

  actionIndex(entity: EntityBase): void {
    this.express.get(`/${entity.name}`, async (req, res) => {
      try {
        let action = entity.newIndexAction();
        this.parseRelationship(action, req.query.include);
        this.parseSort(action, req.query.sort);
        this.parseFilter(action, req.query.filter);
        this.parsePage(action, req.query.page);
        let rows = await action.run();
        res.send(rows);
      } catch (error) {
        res.status(500).send({ error: error.message || error });
      }
    });
  }

  parseSort(action: IndexAction, query: string): void {
    if (!query) return null;
    if (typeof query != 'string') throw 'Invalid sort!';

    let fields = query?.split(',');
    for (let field of fields) {
      if (field.length > 0) {
        let sort: Sort;
        if (field[0] == '-') {
          sort = { name: field.slice(1), criteria: 'desc' };
        } else {
          sort = { name: field, criteria: 'asc' };
        }

        let hooks = action.entity.findHooks('sort', sort.name);
        if (hooks.length > 0) {
          action.sort.push({ name: sort.name, value: sort.criteria, hooks });
        } else if (action.entity.isSortable(sort.name)) {
          action.sort.push(sort);
        } else {
          throw `property '${sort.name}' isn't sortable!`;
        }
      }
    }
  }

  parseFilter(action: IndexAction, query: any): void {
    if (query instanceof Array) return;
    if (typeof query != 'object') return;

    for (let key in query) {
      let filter = { name: key, value: query[key] };
      let hooks = action.entity.findHooks('filter', filter.name);
      if (hooks.length > 0) {
        action.filters.push({ name: filter.name, value: filter.value, hooks });
      } else if (action.entity.isFilterable(filter.name)) {
        action.filters.push(filter);
      } else {
        throw `property '${key}' isn't filterable!`;
      }
    }
  }

  parseRelationship(action: IndexAction | ShowAction, query: string): void {
    if (!query) return null;
    if (typeof query != 'string') throw 'Invalid include!';
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
    let includesObj = this.summarizeQueryInclude(includesArray);
    let relationships = this.createRelationships(includesObj);
    action.entity.findRelationshipSources(relationships);
    action.relationships = [...relationships, ...hooksRequested];
  }

  parsePage(action: IndexAction, query: any): void {
    if (query instanceof Array) return;
    if (typeof query != 'object') return;

    action.page = action.page || {};
    action.pageHooks = action.pageHooks || [];
    for (let key in query) {
      let hooks = action.entity.findHooks('page', key);
      if (hooks.length > 0) {
        action.pageHooks.push({ name: key, value: query[key], hooks });
      } else if (key == 'limit') {
        action.page.limit = parseInt(query[key]);
      } else if (key == 'offset') {
        action.page.offset = parseInt(query[key]);
      } else {
        throw `property '${key}' is invalid for pagination!`;
      }
    }
  }

  createRelationships(query: any): Array<Relationship> {
    let result = [];
    for (let key in query) {
      result.push({ name: key, children: this.createRelationships(query[key]) });
    }
    return result;
  }

  summarizeQueryInclude(include: Array<Array<string>>): any {
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
}

// class ServerGraphQl implements ServerBase { }
