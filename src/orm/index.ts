import { SharkApi } from '../core/index.js';

export interface EntityBase {
  core: SharkApi;
  options?: EntityOptions;
  name: string;
  properties: Array<string>;
  relationships: Array<Relationship>;
  sortableProperties: Array<string>;

  loadSource(): void;

  isSortable(property: string): boolean;
  findRelationshipSources(relationships: Array<Relationship>, source?);

  index(params);
  create();
  update();
  destroy();
}

export interface EntityOptions {
  sort?: Array<string>;
}

export interface Relationship {
  name: string;
  source?: any;
  children?: Array<Relationship>;
}

export interface IndexArguments {
  sort: Array<Array<string>>;
  relationships: Array<Relationship>;
  filters;
}

export class EntitySequelize implements EntityBase {
  source;
  core: SharkApi;
  options?: EntityOptions;
  name: string;
  properties: Array<string>;
  relationships: Array<Relationship>;
  sortableProperties: Array<string>;

  loadSource(): void {
    this.loadName();
    this.loadProperties();
    this.loadSortableProperties();
  }

  loadName(): void {
    this.name = this.source.tableName;
  }

  loadProperties(): void {
    this.properties = [];
    for (let property in this.source.tableAttributes) {
      this.properties.push(property);
    }
  }

  loadSortableProperties(): void {
    this.sortableProperties = [];
    if (this.options?.sort?.length > 0) {
      this.sortableProperties = this.options.sort;
    } else {
      this.sortableProperties = this.properties;
    }
  }

  isSortable(property: string): boolean {
    let field = this.sortableProperties.find((prop) => prop == property);
    return !!field;
  }

  findRelationshipSources(relationships: Array<Relationship>, source?) {
    source = source || this.source;
    relationships = relationships || [];
    for (let relationship of relationships) {
      for (let name in source.associations) {
        if (name.toLowerCase() == relationship.name.toLowerCase()) {
          relationship.source = source.associations[name].target;
          break;
        }
      }
      if (!relationship.source) {
        throw `relationship ${relationship.name} not found!`;
      }
      this.findRelationshipSources(relationship.children, relationship.source);
    }
  }

  factoryInclude(relationships: Array<Relationship>): Array<any> {
    relationships = relationships || [];
    return relationships.map((relationship) => ({
      model: relationship.source,
      include: this.factoryInclude(relationship.children),
    }));
  }

  factoryWhere(filters) {
    let result = {};
    for (let key in filters) {
      if (filters[key]) {
        result[key] = filters[key];
      }
    }
    return result;
  }

  async index({ sort, relationships, filters }: IndexArguments) {
    return await this.source.findAll({
      order: sort,
      include: this.factoryInclude(relationships),
      where: this.factoryWhere(filters),
    });
  }

  async create() {}
  async update() {}
  async destroy() {}
}
