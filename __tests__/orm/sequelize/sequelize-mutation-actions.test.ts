import { DataTypes, Sequelize } from 'sequelize';
import { SharkAPI } from '../../../src/core';
import { SequelizeEntity } from '../../../src/orm/sequelize/sequelize-entity';
import { SequelizeCreateAction } from '../../../src/orm/sequelize/sequelize-create-action';
import { SequelizeUpdateAction } from '../../../src/orm/sequelize/sequelize-update-action';
import { SequelizeDeleteAction } from '../../../src/orm/sequelize/sequelize-delete-action';
import { Hook } from '../../../src/core/hooks';

describe('sequelize mutation actions', () => {
  test('context create', () => {
    let hooks: Array<Hook> = [
      {
        trigger: 'create-before',
        fn({ context }) {
          context.testing = true;
        },
      },
    ];

    let sharkAPI = new SharkAPI();
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING });
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeCreateAction();
    action.entity = entityCar;
    action.data = { name: 'BMW' };
    let context = action.buildContext();

    expect(context).toEqual({ name: 'BMW', testing: true });
  });

  test('context update', () => {
    let hooks: Array<Hook> = [
      {
        trigger: 'update-before',
        fn({ context }) {
          context.testing = true;
        },
      },
    ];
    let sharkAPI = new SharkAPI();
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING });
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeUpdateAction();
    action.entity = entityCar;
    action.data = { name: 'BMW' };
    let context = action.buildContext();

    expect(context).toEqual({ name: 'BMW', testing: true });
  });

  test('context delete', () => {
    let hooks: Array<Hook> = [
      {
        trigger: 'delete-before',
        fn({ context }) {
          context.testing = true;
        },
      },
    ];
    let sharkAPI = new SharkAPI();
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING });
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeDeleteAction();
    action.entity = entityCar;
    let context = action.buildContext();
    expect(context).toEqual({ testing: true });
  });
});
