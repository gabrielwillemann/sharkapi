import { SharkAPI } from '../../../src/core/index';
import { SequelizeEntity } from '../../../src/orm/sequelize/sequelize-entity';
import { Sequelize, DataTypes } from 'sequelize';

describe('sequelize', () => {
  test('load entity name and fields', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });

    let sharkAPI = new SharkAPI();
    let entity = new SequelizeEntity(sharkAPI, Car);

    expect(entity.name.plural).toEqual('Cars');
    expect(entity.name.singular).toEqual('Car');

    expect(entity.fields).toEqual([
      { name: 'id', type: 'integer', nullable: false, primaryKey: true },
      { name: 'name', type: 'string', nullable: true, primaryKey: false },
      { name: 'price', type: 'float', nullable: true, primaryKey: false },
      { name: 'createdAt', type: 'datetime', nullable: false, primaryKey: false },
      { name: 'updatedAt', type: 'datetime', nullable: false, primaryKey: false },
    ]);
  });
});
