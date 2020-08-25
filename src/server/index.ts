import { SharkApi } from '../core/index.js';

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
      this.express.get(`/${entity.name()}`, async (req, res) => {
        try {
          let sort = this.parseSort(entity, req.query.sort);
          let include = this.parseInclude(entity, req.query.include);
          let rows = await entity.index({ sort, relationships: include });
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

  parseInclude(entity, query: string): Array<string> {
    let result: Array<string> = [];
    let relations = query?.split(',') || [];
    for (let relation of relations) {
      if (relation.length > 0) {
        if (entity.isRelationship(relation)) {
          result.push(relation);
        } else {
          throw `'${relation}' is invalid relationship!`;
        }
      }
    }
    return result;
  }
}

// class ServerGraphQl extends ServerBase {}
