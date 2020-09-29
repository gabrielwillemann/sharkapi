# SharkAPI

SharkAPI is a library that will help you to create APIs (REST or GraphQL) faster and easier.

## Introduction

I came from Ruby on Rails environment, but I also love JavaScript and NodeJs. Everyone knows that Ruby on Rails is very productive and NodeJs is very flexible. I think that is possible to merge this.

I realy like the principle "Don't repeat yourself". But there are many cases that we need to repeat a lot of data in software development.

For example, if you define data structure in ORM layer, why do you need to repeat the same fields and relationships at the controller layer?

Other example, why do you need to repeat rules of filters, sorts and paginations in every controller?

The main idea of SharkAPI is import the data structure (metadata) from ORM and generate API automatically with stantard rules.

For edge cases the SharkAPI provide hooks for customize some features. You are also free for add custom routes (for REST API) or types (for GraphQL).

Goals of SharkAPI:

- Create API without repeat data structure (metadata).
- Add standart rules about filters, sorts and paginations.
- Allow hooks for customize.
- Allow custom routes or types for edge cases.
- Standardize without losing flexibility.

## Basic Concept / Architecture

SharkAPI isn't a framework. SharkAPI is a library that will integrate with others frameworks and libraries.

There are three layers in SharkAPI: Server, ORM and Core.

In Server layer you can choice between REST API or GraphQL. REST API Server have [Express.js](https://expressjs.com) as dependency. GraphQL Server have a [GraphQL.js](https://graphql.org/graphql-js) as dependency.

In ORM layer, at moment SharkAPI support only [Sequelize.js](https://sequelize.org), but there are a plans for support [TypeORM](https://typeorm.io) and [Mongoose](https://mongoosejs.com/). This layer is responsable for read metadata (structure) and run queries.

Core is a layer that have a server and many entities of ORM. When server need to know some metadata, core layer will intercept this communication for get the choose ORM.

## Dependencies and versions

| tool             | version |
| ---------------- | ------- |
| Node.js          | >= v12  |
| sequelize        | >= v6   |
| express          | >= v4   |
| body-parser      | >= v1   |
| graphql          | >= v15  |
| graphql-iso-date | >= v3   |

## Usage: REST API with Sequelize

Instalation:

```sh
npm install sharkapi --save

npm install express --save
npm install body-parser --save
npm install sequelize --save
npm install sqlite3 --save
```

Example:

```js
let express = require('express');
let bodyParser = require('body-parser');
let { Sequelize, DataTypes } = require('sequelize');

let { SharkAPI, ServerRestAPI, SequelizeEntity } = require('sharkapi');

let expressApp;
let sequelize;

(async () => {
  await startSequelize();
  startExpress();
  startSharkAPI();
})();

async function startSequelize() {
  sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite' });
  await sequelize.authenticate();

  let City = sequelize.define('City', { name: DataTypes.STRING });
  let Person = sequelize.define('Person', { name: DataTypes.STRING });
  let Car = sequelize.define('Car', { name: DataTypes.STRING });

  Person.belongsTo(City);
  City.hasMany(Person);
  Car.belongsTo(Person);
  Person.hasMany(Car);
}

function startExpress() {
  expressApp = express();
  expressApp.use(bodyParser.json());

  let port = process.argv[2] || 3000;
  expressApp.listen(port, () => {
    console.log(`Example expressApp listening on port ${port}!`);
  });
}

function startSharkAPI() {
  let sharkAPI = new SharkAPI();
  let server = new ServerRestAPI(sharkAPI, { express: expressApp });
  new SequelizeEntity(sharkAPI, sequelize.models.City);
  new SequelizeEntity(sharkAPI, sequelize.models.Person);
  new SequelizeEntity(sharkAPI, sequelize.models.Car);

  server.createResources();
}
```

The above example, will generate the following endpoints:

- City entity
  - `GET /cities`
  - `GET /cities/:id`
  - `POST /cities`
  - `PATCH /cities/:id`
  - `PUT /cities/:id`
  - `DELETE /cities/:id`
- Person entity
  - `GET /people`
  - `GET /people/:id`
  - `POST /people`
  - `PATCH /people/:id`
  - `PUT /people/:id`
  - `DELETE /people/:id`
- Car entity
  - `GET /cars`
  - `GET /cars/:id`
  - `POST /cars`
  - `PATCH /cars/:id`
  - `PUT /cars/:id`
  - `DELETE /cars/:id`

Examples for parameters:

```sh
GET /cities?sort=name               # Sort ascending by name
GET /cities?filter[name]=london     # Filter by name
GET /cities?include=people          # Relationship with People
GET /cities?include=people.cars     # Relationship with Cars through People (with DOT)
GET /people?sort=-name              # Sort descending by name
GET /people?include=cars,city       # Relationship with Cars and City (with COMMA)
```

## Usage: GraphQL with Sequelize

Instalation:

```sh
npm install sharkapi --save

npm install express --save
npm install body-parser --save
npm install sequelize --save
npm install sqlite3 --save

npm install express-graphql --save
npm install graphql --save
npm install graphql-iso-date --save
```

Example:

```js
let express = require('express');
let bodyParser = require('body-parser');
let { graphqlHTTP } = require('express-graphql');
let graphql = require('graphql');
let graphqlIsoDate = require('graphql-iso-date');
let { Sequelize, DataTypes, Op } = require('sequelize');

let { SharkAPI, ServerGraphQL, SequelizeEntity } = require('sharkapi');

let expressApp;
let sequelize;

(async () => {
  await startSequelize();
  startExpress();
  startSharkAPI();
})();

async function startSequelize() {
  sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite' });
  await sequelize.authenticate();

  let City = sequelize.define('City', { name: DataTypes.STRING });
  let Person = sequelize.define('Person', { name: DataTypes.STRING });
  let Car = sequelize.define('Car', { name: DataTypes.STRING });

  Person.belongsTo(City);
  City.hasMany(Person);
  Car.belongsTo(Person);
  Person.hasMany(Car);
}

function startExpress() {
  expressApp = express();
  expressApp.use(bodyParser.json());

  let port = process.argv[2] || 3000;
  expressApp.listen(port, () => {
    console.log(`Example expressApp listening on port ${port}!`);
  });
}

function startSharkAPI() {
  let sharkAPI = new SharkAPI();
  let server = new ServerGraphQL(sharkAPI, { graphql, graphqlIsoDate });
  new SequelizeEntity(sharkAPI, sequelize.models.City);
  new SequelizeEntity(sharkAPI, sequelize.models.Person);
  new SequelizeEntity(sharkAPI, sequelize.models.Car);

  let schema = server.createResources();

  expressApp.use('/graphql', graphqlHTTP({ schema: schema, graphiql: true }));
}
```

The above example, will generate the following types:

```sh
# Queries
Cities(first: Int, offset: Int, sort: [CitySort], filter: CityFilter): CityConnection
City(id: ID): City

People(first: Int, offset: Int, sort: [PersonSort], filter: PersonFilter): PersonConnection
Person(id: ID): Person

Cars(first: Int, offset: Int, sort: [CarSort], filter: CarFilter): CarConnection
Car(id: ID): Car

# Mutations
createCity(input: CityInput!): City
updateCity(id: ID!, input: CityInput!): City
deleteCity(id: ID!): City

createPerson(input: PersonInput!): Person
updatePerson(id: ID!, input: PersonInput!): Person
deletePerson(id: ID!): Person

createCar(input: CarInput!): Car
updateCar(id: ID!, input: CarInput!): Car
deleteCar(id: ID!): Car
```

## Hooks

Hooks are functions that you pass to SharkAPI that will intercept some behavior. For example, if you need to create some custom filter you must to create a hook.

For default, SharkAPI only generate filter with `equal` operator, but you can create a hook to use a filter with `like` operator.

```js
new SequelizeEntity(sharkAPI, Person, {
  hooks: [
    {
      trigger: 'filter',
      match: 'name_like',
      fn({ context, name, value }) {
        context.where.name = { [Op.like]: `%${value}%` };
      },
    },
  ],
});
```

Property `trigger` is type of hook and can have the following values:

- index-before
- index-after
- show-before
- show-after
- create-before
- create-after
- update-before
- update-after
- delete-before
- delete-after
- filter
- relationship
- sort
- page

Property `match` can be a `string` or `regex`. If you have `match: /./` in the previous example will intercept all filters.

Argument `context` is query object, in this case sequelize obeject. You can change this object as you wish.

Argument `name` have the content that was match with `match` property.

Argument `value` have the content passed as value.

Here are others examples:

```js
new SequelizeEntity(sharkAPI, Person, {
  hooks: [
    {
      trigger: 'sort',
      match: 'city_name',
      fn({ context, name, value }) {
        context.include.push({ model: City });
        context.order.push([[City, 'name', value]]);
      },
    },
    {
      trigger: 'relationship',
      match: 'cars',
      fn({ context, name, value }) {
        context.include.push({ model: Cars });
      },
    },
  ],
});
```

## Demo App

[Click here to see source of demo app](https://github.com/gabrielwillemann/sharkapi-demo)

## TO-DO List

- Refactor some parts for reduce coupling to become unit tests more readable
- Support TypeOrm
- Support Mongoose
- Support Firebase
