import { Hook, HookTrigger } from '../../../src/core/hooks';
import { CreateAction, DeleteAction, IndexAction, Relationship, ShowAction, UpdateAction } from '../../../src/orm';
import { parseSort, parseFilter, parsePage, parseRelationship } from '../../../src/server/restapi/helpers';

describe('restapi helpers', () => {
  let action: IndexAction;

  beforeEach(() => {
    action = {
      type: 'index',
      entity: {
        core: null,
        options: null,
        name: { plural: 'Cars', singular: 'Car' },
        fields: [],
        isSortable: (property: string): boolean => true,
        isFilterable: (property: string): boolean => true,
        findRelationshipSources: (relationships: Array<Relationship>, source?): void => {},
        getRelationships: (): Array<Relationship> => [],
        findHooks: (trigger: HookTrigger, name?: string): Array<Hook> => [],
        getHooks: (): Array<Hook> => [],
        newIndexAction: (): IndexAction => null,
        newShowAction: (): ShowAction => null,
        newCreateAction: (): CreateAction => null,
        newUpdateAction: (): UpdateAction => null,
        newDeleteAction: (): DeleteAction => null,
      },
      sort: [],
      filters: [],
      relationships: [],
      page: {},
      pageHooks: [],
      selectedFields: [],
      run: (): Promise<any> => null,
    };
  });

  test('parse sort', () => {
    parseSort(action, 'name,-id,age');
    expect(action.sort).toEqual([
      { name: 'name', criteria: 'asc' },
      { name: 'id', criteria: 'desc' },
      { name: 'age', criteria: 'asc' },
    ]);
  });

  test('parse filter', () => {
    parseFilter(action, { name: 'Gabriel', age: 30 });
    expect(action.filters).toEqual(
      expect.arrayContaining([
        { name: 'name', value: 'Gabriel' },
        { name: 'age', value: 30 },
      ])
    );
  });

  test('parse page', () => {
    parsePage(action, { limit: 10, offset: 0 });
    expect(action.page).toEqual({ limit: 10, offset: 0 });
  });

  test('parse relationship', () => {
    parseRelationship(action, 'person.city.country,brand,tyres.brand');
    expect(action.relationships).toEqual([
      {
        name: 'person',
        children: [
          {
            name: 'city',
            children: [{ name: 'country', children: [] }],
          },
        ],
      },
      { name: 'brand', children: [] },
      {
        name: 'tyres',
        children: [
          {
            name: 'brand',
            children: [],
          },
        ],
      },
    ]);
  });
});
