import { SharkApi } from '../core/index';
import { Relationship, Sort, IndexRequest } from '../orm/index';

export interface ServerBase {
  core: SharkApi;
  createResources(): void;
}

export class ServerRestApi implements ServerBase {
  express;
  core: SharkApi;

  createResources() {
    this.createIndex();
  }

  createIndex() {
    for (let entity of this.core.entities) {
      this.express.get(`/${entity.name}`, async (req, res) => {
        try {
          let indexReq = entity.newIndexRequest();
          this.parseRelationship(indexReq, req.query.include);
          this.parseSort(indexReq, req.query.sort);
          this.parseFilter(indexReq, req.query.filter);
          let rows = await indexReq.run();
          res.send(rows);
        } catch (error) {
          res.status(500).send({ error: error.message || error });
        }
      });
    }
  }

  parseSort(indexReq: IndexRequest, query: string): void {
    let fields = query?.split(',') || [];
    for (let field of fields) {
      if (field.length > 0) {
        let sort: Sort;
        if (field[0] == '-') {
          sort = { name: field.slice(1), criteria: 'desc' };
        } else {
          sort = { name: field, criteria: 'asc' };
        }

        let hooks = indexReq.entity.findHooks('sort', sort.name);
        if (hooks.length > 0) {
          indexReq.sort.push({ name: sort.name, value: sort.criteria, hooks });
        } else if (indexReq.entity.isSortable(sort.name)) {
          indexReq.sort.push(sort);
        } else {
          throw `property '${sort.name}' isn't sortable!`;
        }
      }
    }
  }

  parseFilter(indexReq: IndexRequest, query: any): void {
    if (query instanceof Array) return;
    if (typeof query != 'object') return;

    for (let key in query) {
      let filter = { name: key, value: query[key] };
      let hooks = indexReq.entity.findHooks('filter', filter.name);
      if (hooks.length > 0) {
        indexReq.filters.push({ name: filter.name, value: filter.value, hooks });
      } else if (indexReq.entity.isFilterable(filter.name)) {
        indexReq.filters.push(filter);
      } else {
        throw `property '${key}' isn't sortable!`;
      }
    }
  }

  parseRelationship(indexReq: IndexRequest, query: string): void {
    if (!query) return null;
    let includes = query.split(',');

    let hooksRequested = [];
    for (let i = 0; i < includes.length; i++) {
      let hooks = indexReq.entity.findHooks('relationship', includes[i]);
      if (hooks.length > 0) {
        hooksRequested.push({ name: includes[i], hooks });
        includes[i] = '';
      }
    }

    let includesArray = includes.map((i) => i.split('.'));
    let includesObj = this.summarizeQueryInclude(includesArray);
    let relationships = this.createRelationships(includesObj);
    indexReq.entity.findRelationshipSources(relationships);
    indexReq.relationships = [...relationships, ...hooksRequested];
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
