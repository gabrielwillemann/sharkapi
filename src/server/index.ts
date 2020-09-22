import { SharkAPI } from '../core/index';

export interface ServerBase {
  core: SharkAPI;
  createResources(): any;
}
