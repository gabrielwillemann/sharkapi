- Structure / Basic Concepts

  - Core
    - Load configurations
    - Start server configured
    - Intercept comunication between Server and ORM Adapters
  - Server
    - Parse requests and responses
    - Request data to ORM Adapters
      - This communication will intercepted by core, because the each library have own configurations
    - REST API Server
    - GraphQL Server
  - ORM Adapters
    - Is a layer that get metadata of ORM
    - Create a adapter for each ORM: Sequelize, TypeORM and MongoDB
    - All adapters will implement the same API/Interface
    - Implement all default actions (index, show, create, update and destroy) used by actions
  - Goal: Progressive framework/library for backend

- Configuration In development

  - (Required) Choice request parsed: REST API or GraphQL
  - (Required) Choice ORM: Sequelize, TypeORM, MongoDB or Firebase
  - Choice routes (index, show, create, update, delete)
  - Hooks?
    - Purposes:
      - Set custom filters
      - Set custom sorters
      - Set custom relationships
      - Set default pagination
      - Can change anything in query
      - Local or global hooks
      - For permissions, or tenant architecture

- TO-DO list

  - (OK) REST API
  - (OK) GraphQL
  - (OK) SequelizeJs
  - Tests
  - Documentation
  - TypeOrm
  - Mongoose
  - Firebase

