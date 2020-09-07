import { SharkApi } from '../../core/index';
import { Error } from '../../core/error';
import { Hook, HookTrigger, hookMatch } from '../../core/hooks';
import { EntityBase, EntityOptions, Relationship } from '../index';
import { SequelizeIndexAction } from './sequelize-index-action';
import { SequelizeShowAction } from './sequelize-show-action';
import { SequelizeCreateAction } from './sequelize-create-action';
import { SequelizeUpdateAction } from './sequelize-update-action';
import { SequelizeDeleteAction } from './sequelize-delete-action';

export class SequelizeEntity implements EntityBase {
  source;
  core: SharkApi;
  options?: EntityOptions;
  name: string;
  properties: Array<string>;

  loadSource(): void {
    this.loadName();
    this.loadProperties();
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

  isSortable(property: string): boolean {
    let field = this.properties.find((prop) => prop == property);
    return !!field;
  }

  isFilterable(property: string): boolean {
    let field = this.properties.find((prop) => prop == property);
    return !!field;
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
