import { SharkAPI } from '../core/index';
import { Hook, HookTrigger, HookRequest } from '../core/hooks';

export type Action = 'index' | 'show' | 'create' | 'update' | 'delete';

export interface EntityBase {
  core: SharkAPI;
  options?: EntityOptions;
  name: EntityName;
  fields: Array<Field>;

  isSortable(property: string): boolean;
  isFilterable(property: string): boolean;
  findRelationshipSources(relationships: Array<Relationship>, source?): void;
  getRelationships(): Array<Relationship>;

  findHooks(trigger: HookTrigger, name?: string): Array<Hook>;
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
  type?: FieldType;
  nullable?: boolean;
  primaryKey?: boolean;
}

export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'date' | 'time';

export interface IndexAction {
  type: Action;
  entity: EntityBase;
  sort: Array<Sort | HookRequest>;
  filters: Array<Filter | HookRequest>;
  relationships: Array<Relationship | HookRequest>;
  page: Page;
  pageHooks: Array<HookRequest>;
  selectedFields: Array<Field>;

  run(): Promise<any>;
}

export interface ShowAction {
  type: Action;
  entity: EntityBase;
  relationships: Array<Relationship | HookRequest>;
  selectedFields: Array<Field>;
  id: number | string;
  run(): Promise<any>;
}

export interface CreateAction {
  type: Action;
  entity: EntityBase;
  data: any;
  run(): Promise<any>;
}

export interface UpdateAction {
  type: Action;
  entity: EntityBase;
  data: any;
  id: number | string;
  run(): Promise<any>;
}

export interface DeleteAction {
  type: Action;
  entity: EntityBase;
  id: number | string;
  run(): Promise<any>;
}

export interface Relationship {
  name: string;
  source?: any;
  children?: Array<Relationship>;
  type?: RelationshipType;
  fields?: Array<Field>;
}

export type RelationshipType = 'has-one' | 'belongs-to' | 'has-many';

export interface Filter {
  name: string;
  value: any;
}

export interface Sort {
  name: string;
  criteria: SortCriteria;
}

export type SortCriteria = 'asc' | 'desc';

export interface Page {
  limit?: number;
  offset?: number;
}
