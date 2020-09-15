- TO-DO list

  - (OK) REST API
  - GraphQL
    - types: queries and mudations
    - Resolvers
      - Actions
      - Singular and plural names
      - Use join?
    - Sort
      - Way 1:
        - Get all fields
        - Are there hooks for each sort/field? match string or regex
        - If there are hooks with PREVENT=TRUE, don't create it
      - Way 2:
        - Get all hooks with type SORT and match type equal string
        - If there are hooks with PREVENT=TRUE, don't create it
    - Filters
      - Way 1:
        - Get all fields
        - Are there hooks for each filter/field? match string or regex
        - If there are hooks with PREVENT=TRUE, don't create it
      - Way 2:
        - Get all hooks with type FILTER and match type equal string
        - If there are hooks with PREVENT=TRUE, don't create it
    - Relationship
      - Get all relationships
      - Are there hooks for each relationship? match string or regex
      - If there are hooks with PREVENT=TRUE, don't create this relationship
      - Search type for this relationship, if it doesn't exist, create it (attention with mongodb)
    - Pagination and Connection Pattern
    - GraphQL with socket?
    - https://www.apollographql.com/blog/designing-graphql-mutations-e09de826ed97/
    - https://graphql.org/graphql-js/mutations-and-input-types/
  - (DOING) SequelizeJs
  - TypeOrm
  - Mongoose
  - Firebase

- Notes

  - Progressive framework/library for backend

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

- Convert my personal projects
  - https://www.npmjs.com/package/change-case
