import { SharkApi } from '../core/index';
import { Hook, HookTrigger, HookRequest } from '../core/hooks';

export type Action = 'index' | 'show' | 'create' | 'update' | 'delete';

export interface EntityBase {
  core: SharkApi;
  options?: EntityOptions;
  name: EntityName;
  fields: Array<Field>;

  isSortable(property: string): boolean;
  isFilterable(property: string): boolean;
  findRelationshipSources(relationships: Array<Relationship>, source?);
  findHooks(trigger: HookTrigger, match: string | RegExp): Array<Hook>;
  getHooks(): Array<Hook>;

  newIndexAction(): IndexAction;
  newShowAction(): ShowAction;
  newCreateAction(): CreateAction;
  newUpdateAction(): UpdateAction;
  newDeleteAction(): DeleteAction;
}

export interface EntityOptions {
  name?: EntityName;
  hooks?: Array<Hook>;
  actions?: Array<Action>;
}

export interface EntityName {
  plural: string;
  singular: string;
}

export interface Field {
  name: string;
  type: FieldType;
  nullable: boolean;
  primaryKey: boolean;
}

export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime';

export interface IndexAction {
  entity: EntityBase;
  sort: Array<Sort | HookRequest>;
  filters: Array<Filter | HookRequest>;
  relationships: Array<Relationship | HookRequest>;
  page: Page;
  pageHooks: Array<HookRequest>;

  run(): Promise<any>;
}

export interface ShowAction {
  entity: EntityBase;
  relationships: Array<Relationship | HookRequest>;
  id: number | string;
  run(): Promise<any>;
}

export interface CreateAction {
  entity: EntityBase;
  data: any;
  run(): Promise<any>;
}

export interface UpdateAction {
  entity: EntityBase;
  data: any;
  id: number | string;
  run(): Promise<any>;
}

export interface DeleteAction {
  entity: EntityBase;
  id: number | string;
  run(): Promise<any>;
}

export interface Relationship {
  name: string;
  source?: any;
  children?: Array<Relationship>;
}

export interface Filter {
  name: string;
  value: any;
}

export interface Sort {
  name: string;
  criteria: 'asc' | 'desc';
}

export interface Page {
  limit?: number;
  offset?: number;
}
