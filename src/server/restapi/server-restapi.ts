import { SharkAPI } from '../../core/index';
import { ServerBase } from '../index';
import { Error } from '../../core/error';
import { EntityBase } from '../../orm/index';
import { parseFilter, parsePage, parseSort, parseRelationship } from './helpers';

export class ServerRestAPI implements ServerBase {
  express: any;
  core: SharkAPI;

  constructor(core: SharkAPI, { express }: RestAPIOptions) {
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
        parseRelationship(action, req.query.include);
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
        parseRelationship(action, req.query.include);
        parseSort(action, req.query.sort);
        parseFilter(action, req.query.filter);
        parsePage(action, req.query.page);
        let rows = await action.run();
        res.send(rows);
      } catch (error) {
        this.catchError(error, res);
      }
    });
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

export interface RestAPIOptions {
  express: any;
}
