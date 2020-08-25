import { SharkApi } from '../core/index.js';

export interface EntityBase {
  core: SharkApi;
  options?: EntityOptions;
  name(): string;
  properties(): Array<string>;
  isSortable(property: string): boolean;
  relationships(): Array<Relation>;
  isRelationship(relationship: string): boolean;
  index(params);
  create();
  update();
  destroy();
}

export interface EntityOptions {
  sort?: Array<string>;
}

export interface Relation {
  name: string;
  source: any;
}

export class EntitySequelize implements EntityBase {
  source;
  core: SharkApi;
  options?: EntityOptions;

  name(): string {
    return this.source.tableName;
  }

  properties(): Array<string> {
    let result: Array<string> = [];
    for (let property in this.source.tableAttributes) {
      result.push(property);
    }
    return result;
  }

  sortableProperties(): Array<string> {
    if (this.options?.sort?.length > 0) {
      return this.options.sort;
    }
    return this.properties();
  }

  isSortable(property: string): boolean {
    let field = this.sortableProperties().find((prop) => prop == property);
    return !!field;
  }

  relationships(): Array<Relation> {
    let result: Array<Relation> = [];
    for (let key in this.source.associations) {
      let relation = { name: key, source: this.source.associations[key].target };
      result.push(relation);
    }
    return result;
  }

  isRelationship(relationship: string): boolean {
    let r = this.relationships().find((r) => r.name == relationship);
    return !!r;
  }

  factoryInclude(relationships) {
    if (relationships) {
      return relationships.map((r) => ({ model: r.source }));
    } else {
      return [];
    }
  }

  async index({ sort, relationships }) {
    return await this.source.findAll({
      order: sort,
      include: this.factoryInclude(relationships),
    });
  }

  async create() {}
  async update() {}
  async destroy() {}
}
