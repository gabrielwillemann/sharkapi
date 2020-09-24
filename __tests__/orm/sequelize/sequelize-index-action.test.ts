import { DataTypes, Sequelize } from 'sequelize';
import { SharkAPI } from '../../../src/core';
import { Hook } from '../../../src/core/hooks';
import { SequelizeEntity } from '../../../src/orm/sequelize/sequelize-entity';
import { SequelizeIndexAction } from '../../../src/orm/sequelize/sequelize-index-action';

describe('sequelize index action', () => {
  test('context with sort', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });
    let sharkAPI = new SharkAPI();

    let hooks: Array<Hook> = [
      {
        trigger: 'sort',
        match: 'createdAt',
        fn: ({ context, name, value }) => {
          context.order.push([name, value]);
        },
      },
    ];
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeIndexAction();
    action.entity = entityCar;
    action.sort = [
      { name: 'name', criteria: 'desc' },
      { name: 'createdAt', value: 'desc', hooks },
      { name: 'price', criteria: 'asc' },
    ];
    let context = action.buildContext();

    expect(context).toEqual({
      subQuery: false,
      include: [],
      where: {},
      order: [
        ['name', 'desc'],
        ['createdAt', 'desc'],
        ['price', 'asc'],
      ],
      limit: undefined,
      offset: undefined,
    });
  });

  test('context with filter', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });
    let sharkAPI = new SharkAPI();

    let hooks: Array<Hook> = [
      {
        trigger: 'filter',
        match: 'createdAt',
        fn: ({ context, name, value }) => {
          context.where[name] = value;
        },
      },
    ];
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeIndexAction();
    action.entity = entityCar;
    action.filters = [
      { name: 'createdAt', value: '2020-12-31T01:02:03Z', hooks },
      { name: 'name', value: 'Paul' },
    ];
    let context = action.buildContext();

    expect(context).toEqual({
      subQuery: false,
      include: [],
      where: { createdAt: '2020-12-31T01:02:03Z', name: 'Paul' },
      order: [],
      limit: undefined,
      offset: undefined,
    });
  });

  test('context with pagination', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });
    let sharkAPI = new SharkAPI();

    let hooks: Array<Hook> = [
      {
        trigger: 'page',
        match: 'offset',
        fn: ({ context, name, value }) => {
          context[name] = value;
        },
      },
    ];
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeIndexAction();
    action.entity = entityCar;
    action.page = { limit: 10 };
    action.pageHooks = [{ name: 'offset', value: 1, hooks }];
    let context = action.buildContext();

    expect(context).toEqual({ subQuery: false, include: [], where: {}, order: [], limit: 10, offset: 1 });
  });

  test('context with relationships', () => {
    let sharkAPI = new SharkAPI();
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING });
    let Person = sequelize.define('Person', { name: DataTypes.STRING });
    let Tyre = sequelize.define('Tyre', { serialNumber: DataTypes.STRING });
    Car.belongsTo(Person);
    Person.hasMany(Car);
    Tyre.belongsTo(Car);
    Car.hasMany(Tyre);

    let hooks: Array<Hook> = [
      {
        trigger: 'relationship',
        match: 'tyres',
        fn: ({ context, name, value }) => {
          context.include.push({ model: Tyre });
        },
      },
    ];
    let entityCar = new SequelizeEntity(sharkAPI, Car, { hooks });
    let action = new SequelizeIndexAction();
    action.entity = entityCar;
    action.relationships = [
      { name: 'Person', source: Person },
      { name: 'Tyres', hooks: hooks },
    ];
    let context = action.buildContext();

    expect(context).toEqual({
      subQuery: false,
      include: [{ model: Person, include: [] }, { model: Tyre }],
      where: {},
      order: [],
      limit: undefined,
      offset: undefined,
    });
  });

  test('context with selectedFields', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });
    let sharkAPI = new SharkAPI();
    let entityCar = new SequelizeEntity(sharkAPI, Car);
    let action = new SequelizeIndexAction();
    action.entity = entityCar;
    action.selectedFields = [{ name: 'name' }, { name: 'price' }];
    let context = action.buildContext();

    expect(context).toEqual({
      subQuery: false,
      attributes: ['name', 'price'],
      include: [],
      where: {},
      order: [],
      limit: undefined,
      offset: undefined,
    });
  });
});
