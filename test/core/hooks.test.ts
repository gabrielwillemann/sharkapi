import { Hook, callHooks, findHooks } from '../../src/core/hooks';

describe('hooks', () => {
  test('call hooks', () => {
    let hook: Hook = {
      trigger: 'filter',
      match: 'name',
      fn({ context, name, value }) {
        context[name] = true;
        context.value = value;
        return context;
      },
    };

    let context = callHooks([hook], {}, { name: 'name', value: 'john' });
    expect(context).toEqual({ name: true, value: 'john' });

    hook.prevent = true;
    context = callHooks([hook], {}, { name: 'name', value: 'john' });
    expect(context).toEqual({});
  });

  test('find hook', () => {
    let hooks: Array<Hook> = [
      { trigger: 'filter', match: 'name' },
      { trigger: 'relationship', match: /^person/ },
      { trigger: 'index-before' },
    ];

    let hooksFound = findHooks(hooks, 'index-before');
    expect(hooksFound).toEqual([{ trigger: 'index-before' }]);

    hooksFound = findHooks(hooks, 'filter', 'name');
    expect(hooksFound).toEqual([{ trigger: 'filter', match: 'name' }]);

    hooksFound = findHooks(hooks, 'filter', 'age');
    expect(hooksFound).toEqual([]);

    hooksFound = findHooks(hooks, 'relationship', 'person.cars');
    expect(hooksFound).toEqual([{ trigger: 'relationship', match: /^person/ }]);

    hooksFound = findHooks(hooks, 'relationship', 'cars.person');
    expect(hooksFound).toEqual([]);
  });
});
