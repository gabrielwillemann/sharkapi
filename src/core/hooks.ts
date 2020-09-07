export type HookTrigger =
  | 'index-before'
  | 'index-after'
  | 'show-before'
  | 'show-after'
  | 'create-before'
  | 'create-after'
  | 'update-before'
  | 'update-after'
  | 'delete-before'
  | 'delete-after'
  | 'filter'
  | 'relationship'
  | 'sort'
  | 'page';

export interface Hook {
  trigger: HookTrigger;
  match?: string | RegExp;
  fn: (params?: any) => any;
}

export interface HookRequest {
  name: string;
  value?: any;
  hooks: Array<Hook>;
}

export function hookMatch(hook: Hook, trigger: HookTrigger, name?: string): boolean {
  if (typeof hook.match == 'string') {
    return hook.trigger == trigger && hook.match == name;
  }
  if (hook.match instanceof RegExp) {
    return hook.trigger == trigger && hook.match.test(name);
  }
  if (hook.match == undefined) {
    return hook.trigger == trigger;
  }
  return false;
}

export function findHooks(list: Array<Hook>, trigger: HookTrigger, name?: string): Array<Hook> {
  return list.filter((hook) => hookMatch(hook, trigger, name));
}

export function callHooks(hooks: Array<Hook>, context: any, params?: any): any {
  for (let hook of hooks) {
    if (hook.fn && typeof hook.fn == 'function') {
      context = hook.fn({ context, ...params }) || context;
    }
  }
  return context;
}
