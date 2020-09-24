import { DataTypes, Sequelize } from 'sequelize';
import { SharkAPI } from '../../../src/core';
import { Hook } from '../../../src/core/hooks';
import { SequelizeEntity } from '../../../src/orm/sequelize/sequelize-entity';
import { SequelizeShowAction } from '../../../src/orm/sequelize/sequelize-show-action';

describe('sequelize show action', () => {
  test('with relationships', () => {
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
    let action = new SequelizeShowAction();
    action.entity = entityCar;
    action.relationships = [
      { name: 'Person', source: Person },
      { name: 'Tyres', hooks: hooks },
    ];
    let context = action.buildContext();

    expect(context).toEqual({
      subQuery: false,
      include: [{ model: Person, include: [] }, { model: Tyre }],
    });
  });

  test('with selectedFields', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });
    let sharkAPI = new SharkAPI();
    let entityCar = new SequelizeEntity(sharkAPI, Car);
    let action = new SequelizeShowAction();
    action.entity = entityCar;
    action.selectedFields = [{ name: 'name' }, { name: 'price' }];
    let context = action.buildContext();

    expect(context).toEqual({
      subQuery: false,
      attributes: ['name', 'price'],
      include: [],
    });
  });
});
