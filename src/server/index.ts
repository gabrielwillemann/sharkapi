import { SharkApi } from '../core/index';

export interface ServerBase {
  core: SharkApi;
  createResources(): any;
}
