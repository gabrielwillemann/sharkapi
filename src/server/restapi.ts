import { SharkApi } from '../core/index';
import { ServerBase } from './index';
import { Error } from '../core/error';
import { EntityBase, Relationship, Sort, IndexAction, Filter, ShowAction } from '../orm/index';

export class ServerRestApi implements ServerBase {
  express: any;
  core: SharkApi;

  constructor(core: SharkApi, express: any) {
    this.core = core;
    core.server = this;
    this.express = express;
  }

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
    this.express.get(`/${entity.name.plural}/:id`, async (req, res) => {
      try {
        let action = entity.newShowAction();
        this.parseRelationship(action, req.query.include);
        action.id = req.params.id;
        let rows = await action.run();
        res.send(rows);
      } catch (error) {
        this.catchError(error, res);
      }
    });
  }

  actionCreate(entity: EntityBase): void {
    this.express.post(`/${entity.name.plural}`, async (req, res) => {
      try {
        let action = entity.newCreateAction();
        action.data = req.body;
        let row = await action.run();
        res.send(row);
      } catch (error) {
        this.catchError(error, res);
      }
    });
  }

  actionUpdate(entity: EntityBase): void {
    let fn = async (req, res) => {
      try {
        let action = entity.newUpdateAction();
        action.id = req.params.id;
        action.data = req.body;
        let row = await action.run();
        res.send(row);
      } catch (error) {
        this.catchError(error, res);
      }
    };
    this.express.patch(`/${entity.name.plural}/:id`, fn);
    this.express.put(`/${entity.name.plural}/:id`, fn);
  }

  actionDelete(entity: EntityBase): void {
    this.express.delete(`/${entity.name.plural}/:id`, async (req, res) => {
      try {
        let action = entity.newDeleteAction();
        action.id = req.params.id;
        let row = await action.run();
        res.send(row);
      } catch (error) {
        this.catchError(error, res);
      }
    });
  }

  actionIndex(entity: EntityBase): void {
    this.express.get(`/${entity.name.plural}`, async (req, res) => {
      try {
        let action = entity.newIndexAction();
        this.parseRelationship(action, req.query.include);
        this.parseSort(action, req.query.sort);
        this.parseFilter(action, req.query.filter);
        this.parsePage(action, req.query.page);
        let rows = await action.run();
        res.send(rows);
      } catch (error) {
        this.catchError(error, res);
      }
    });
  }

  parseSort(action: IndexAction, query: string): void {
    if (!query) return;
    if (typeof query != 'string') return;

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
          throw new Error('invalid-sort', `property '${sort.name}' isn't sortable!`);
        }
      }
    }
  }

  parseFilter(action: IndexAction, query: any): void {
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

  parseRelationship(action: IndexAction | ShowAction, query: string): void {
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
    let includesObj = this.summarizeQueryInclude(includesArray);
    let relationships = this.createRelationships(includesObj);
    action.entity.findRelationshipSources(relationships);
    action.relationships = [...relationships, ...hooksRequested];
  }

  parsePage(action: IndexAction, query: any): void {
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

  catchError(error: any, res: any): void {
    if (error instanceof Error) {
      if (error.type == 'record-not-found') {
        res.status(404).send(error);
      } else {
        res.status(500).send(error);
      }
    }
    res.status(500).send({ error: error.message || error });
  }
}
