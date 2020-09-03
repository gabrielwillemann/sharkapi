import { SharkApi } from '../core/index';
import { Hook, HookTrigger, HookRequest } from '../core/hooks';

export interface EntityBase {
  core: SharkApi;
  options?: EntityOptions;
  name: string;
  properties: Array<string>;

  loadSource(): void;

  isSortable(property: string): boolean;
  isFilterable(property: string): boolean;
  findRelationshipSources(relationships: Array<Relationship>, source?);
  findHooks(trigger: HookTrigger, match: string | RegExp): Array<Hook>;
  getHooks(): Array<Hook>;

  newIndexRequest(): IndexRequest;
}

export interface IndexRequest {
  entity: EntityBase;
  sort: Array<Sort | HookRequest>;
  filters: Array<Filter | HookRequest>;
  relationships: Array<Relationship | HookRequest>;
  page: Page;
  pageHooks: Array<HookRequest>;

  run();
}

export interface EntityOptions {
  hooks?: Array<Hook>;
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
