import { SharkAPI } from '../../../src/core/index';
import { SequelizeEntity } from '../../../src/orm/sequelize/sequelize-entity';

describe('sequelize', () => {
  test('', () => {
    let personModel = {};

    let sharkAPI = new SharkAPI();
    new SequelizeEntity(sharkAPI, personModel);
  });
});
