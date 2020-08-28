import { SharkApi } from '../core/index.js';
import { Relationship } from '../orm/index.js';

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
          let relationships = this.parseRelationship(entity, req.query.include);
          let sort = this.parseSort(entity, req.query.sort);
          let filters = req.query.filter;
          let rows = await entity.index({ sort, relationships, filters });
          res.send(rows);
        } catch (error) {
          res.status(500).send({ error: error.message || error });
        }
      });
    }
  }

  parseSort(entity, query: string): Array<Array<string>> {
    let result: Array<Array<string>> = [];
    let fields = query?.split(',') || [];
    for (let field of fields) {
      if (field.length > 0) {
        let sort = field[0] == '-' ? [field.slice(1), 'DESC'] : [field, 'ASC'];
        if (entity.isSortable(sort[0])) {
          result.push(sort);
        } else {
          throw `property '${sort[0]}' isn't sortable!`;
        }
      }
    }
    return result;
  }

  parseRelationship(entity, query: string): Array<Relationship> {
    if (!query) return null;
    let queryArray = query.split(',').map((i) => i.split('.'));
    let queryObj = this.summarizeQueryInclude(queryArray);
    let relationships = this.createRelationships(queryObj);
    entity.findRelationshipSources(relationships);
    return relationships;
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
