import { SharkApi } from '../../core/index';
import { Error } from '../../core/error';
import { Hook, HookTrigger, hookMatch } from '../../core/hooks';
import { EntityBase, EntityOptions, EntityName, Field, FieldType, Relationship } from '../index';
import { SequelizeIndexAction } from './sequelize-index-action';
import { SequelizeShowAction } from './sequelize-show-action';
import { SequelizeCreateAction } from './sequelize-create-action';
import { SequelizeUpdateAction } from './sequelize-update-action';
import { SequelizeDeleteAction } from './sequelize-delete-action';
import { plural, singular } from 'pluralize';

export class SequelizeEntity implements EntityBase {
  source: any;
  core: SharkApi;
  options?: EntityOptions;
  name: EntityName;
  fields: Array<Field>;

  constructor(core: SharkApi, source: any, options?: EntityOptions) {
    this.core = core;
    core.entities.push(this);
    this.source = source;
    this.options = options;
    this.loadSource();
  }

  loadSource(): void {
    this.loadName();
    this.loadFields();
  }

  loadName(): void {
    if (this.options?.name) {
      this.name = this.options?.name;
    } else {
      this.name = {
        plural: plural(this.source.tableName),
        singular: singular(this.source.tableName),
      };
    }
  }

  loadFields(): void {
    this.fields = [];
    let primaryKey = this.source.primaryKeyField;
    for (let fieldName in this.source.tableAttributes) {
      let field = this.source.tableAttributes[fieldName];
      this.fields.push({
        name: fieldName,
        type: this.getFieldType(field.type.constructor.name),
        nullable: typeof field.allowNull == 'boolean' ? field.allowNull : true,
        primaryKey: fieldName == primaryKey,
      });
    }
  }

  getFieldType(type: string): FieldType {
    let result = {
      BIGINT: 'integer',
      INTEGER: 'integer',
      SMALLINT: 'integer',
      BOOLEAN: 'boolean',
      CHAR: 'string',
      STRING: 'string',
      TEXT: 'string',
      DATE: 'datetime',
      DATEONLY: 'date',
      TIME: 'time',
      DECIMAL: 'float',
      DOUBLE: 'float',
      FLOAT: 'float',
      NUMBER: 'float',
      REAL: 'float',
    };
    return result[type];
  }

  isSortable(fieldName: string): boolean {
    return !!this.fields.find((f) => f.name == fieldName);
  }

  isFilterable(fieldName: string): boolean {
    return !!this.fields.find((f) => f.name == fieldName);
  }

  findRelationshipSources(relationships: Array<Relationship>, source?): void {
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
        throw new Error('invalid-relationship', `relationship ${relationship.name} not found!`);
      }
      this.findRelationshipSources(relationship.children, relationship.source);
    }
  }

  getHooks(): Array<Hook> {
    let hooks = this.options?.hooks || [];
    return [...this.core.getHooks(), ...hooks];
  }

  findHooks(trigger: HookTrigger, name: string): Array<Hook> {
    return this.getHooks().filter((hook) => hookMatch(hook, trigger, name));
  }

  newIndexAction(): SequelizeIndexAction {
    let action = new SequelizeIndexAction();
    action.entity = this;
    return action;
  }

  newShowAction(): SequelizeShowAction {
    let action = new SequelizeShowAction();
    action.entity = this;
    return action;
  }

  newCreateAction(): SequelizeCreateAction {
    let action = new SequelizeCreateAction();
    action.entity = this;
    return action;
  }

  newUpdateAction(): SequelizeUpdateAction {
    let action = new SequelizeUpdateAction();
    action.entity = this;
    return action;
  }

  newDeleteAction(): SequelizeDeleteAction {
    let action = new SequelizeDeleteAction();
    action.entity = this;
    return action;
  }
}
