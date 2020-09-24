import { Sequelize, DataTypes } from 'sequelize';
import { SharkAPI } from '../../../src/core/index';
import { Relationship } from '../../../src/orm';
import { SequelizeEntity } from '../../../src/orm/sequelize/sequelize-entity';

describe('sequelize entity', () => {
  test('load entity name and fields', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING, price: DataTypes.FLOAT });

    let sharkAPI = new SharkAPI();
    let entity = new SequelizeEntity(sharkAPI, Car);

    expect(entity.name.plural).toBe('Cars');
    expect(entity.name.singular).toBe('Car');

    expect(entity.fields).toHaveLength(5);
    expect(entity.fields).toEqual(
      expect.arrayContaining([
        { name: 'id', type: 'integer', nullable: false, primaryKey: true },
        { name: 'name', type: 'string', nullable: true, primaryKey: false },
        { name: 'price', type: 'float', nullable: true, primaryKey: false },
        { name: 'createdAt', type: 'datetime', nullable: false, primaryKey: false },
        { name: 'updatedAt', type: 'datetime', nullable: false, primaryKey: false },
      ])
    );

    expect(entity.isFilterable('name')).toBe(true);
    expect(entity.isFilterable('category')).toBe(false);

    expect(entity.isSortable('price')).toBe(true);
    expect(entity.isSortable('price-to-sell')).toBe(false);
  });

  test('load and get hooks', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let Car = sequelize.define('Car', { name: DataTypes.STRING });

    let sharkAPI = new SharkAPI({
      hooks: [{ trigger: 'index-before' }, { trigger: 'filter', match: /^name/ }],
    });
    let entity = new SequelizeEntity(sharkAPI, Car, {
      hooks: [{ trigger: 'index-before' }, { trigger: 'index-after' }, { trigger: 'sort', match: 'name' }],
    });

    expect(entity.getHooks()).toHaveLength(5);
    expect(entity.getHooks()).toEqual(
      expect.arrayContaining([
        { trigger: 'index-before' },
        { trigger: 'index-before' },
        { trigger: 'index-after' },
        { trigger: 'filter', match: /^name/ },
        { trigger: 'sort', match: 'name' },
      ])
    );
    expect(entity.findHooks('index-before')).toHaveLength(2);
    expect(entity.findHooks('index-after')).toHaveLength(1);
    expect(entity.findHooks('show-after')).toHaveLength(0);
    expect(entity.findHooks('filter', 'name')).toHaveLength(1);
    expect(entity.findHooks('filter', 'name_person')).toHaveLength(1);
    expect(entity.findHooks('filter', 'person_name')).toHaveLength(0);
    expect(entity.findHooks('sort', 'name')).toHaveLength(1);
    expect(entity.findHooks('sort', 'person_name')).toHaveLength(0);
  });

  test('get relationships', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let City = sequelize.define('City', { name: DataTypes.STRING });
    let Person = sequelize.define('Person', { name: DataTypes.STRING });
    let Car = sequelize.define('Car', { name: DataTypes.STRING });

    Person.belongsTo(City);
    City.hasMany(Person);
    Car.belongsTo(Person);
    Person.hasMany(Car);

    let sharkAPI = new SharkAPI();
    let entityCity = new SequelizeEntity(sharkAPI, City);
    let entityPerson = new SequelizeEntity(sharkAPI, Person);
    let entityCar = new SequelizeEntity(sharkAPI, Car);

    expect(entityCity.getRelationships()).toEqual([{ name: 'People', source: Person, type: 'has-many' }]);
    expect(entityCar.getRelationships()).toEqual([{ name: 'Person', source: Person, type: 'belongs-to' }]);

    let relationships = entityPerson.getRelationships();
    expect(relationships).toHaveLength(2);
    expect(relationships).toEqual(
      expect.arrayContaining([
        { name: 'City', source: City, type: 'belongs-to' },
        { name: 'Cars', source: Car, type: 'has-many' },
      ])
    );
  });

  test('find relationships', () => {
    let sequelize = new Sequelize('sqlite::memory:');
    let City = sequelize.define('City', { name: DataTypes.STRING });
    let Person = sequelize.define('Person', { name: DataTypes.STRING });
    let Car = sequelize.define('Car', { name: DataTypes.STRING });
    let Tyre = sequelize.define('Tyre', { serialNumber: DataTypes.STRING });

    Person.belongsTo(City);
    City.hasMany(Person);
    Car.belongsTo(Person);
    Person.hasMany(Car);
    Tyre.belongsTo(Car);
    Car.hasMany(Tyre);

    let sharkAPI = new SharkAPI();
    let entityCity = new SequelizeEntity(sharkAPI, City);
    let entityPerson = new SequelizeEntity(sharkAPI, Person);
    let entityCar = new SequelizeEntity(sharkAPI, Car);
    let entityTyre = new SequelizeEntity(sharkAPI, Tyre);

    let relationship: Relationship = {
      name: 'people',
      children: [{ name: 'cars', children: [{ name: 'tyres' }] }],
    };
    entityCity.findRelationshipSources([relationship]);

    expect(relationship.source).toBeTruthy();
    expect(relationship.children[0].source).toBeTruthy();
    expect(relationship.children[0].children[0].source).toBeTruthy();
  });
});
