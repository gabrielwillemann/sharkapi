import { Hook, HookTrigger } from '../../../src/core/hooks';
import { CreateAction, DeleteAction, IndexAction, Relationship, ShowAction, UpdateAction } from '../../../src/orm';
import { parseSort, parseFilter, parsePage, parseRelationships } from '../../../src/server/graphql/helpers';

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
    parseSort(action, ['name-asc', 'id-desc', 'age-asc']);
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
    parsePage(action, 10, 0);
    expect(action.page).toEqual({ limit: 10, offset: 0 });
  });

  test('parse relationship', () => {
    parseRelationships(action, {
      kind: 'Field',
      name: { kind: 'Name', value: 'cars', loc: { start: 4, end: 8 } },
      arguments: [],
      directives: [],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'nodes', loc: { start: 15, end: 20 } },
            arguments: [],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'id', loc: { start: 29, end: 31 } },
                  arguments: [],
                  directives: [],
                  loc: { start: 29, end: 31 },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'name', loc: { start: 38, end: 42 } },
                  arguments: [],
                  directives: [],
                  loc: { start: 38, end: 42 },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'Person', loc: { start: 49, end: 55 } },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'name', loc: { start: 66, end: 70 } },
                        arguments: [],
                        directives: [],
                        loc: { start: 66, end: 70 },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'City', loc: { start: 79, end: 83 } },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name', loc: { start: 96, end: 100 } },
                              arguments: [],
                              directives: [],
                              loc: { start: 96, end: 100 },
                            },
                          ],
                          loc: { start: 84, end: 110 },
                        },
                        loc: { start: 79, end: 110 },
                      },
                    ],
                    loc: { start: 56, end: 118 },
                  },
                  loc: { start: 49, end: 118 },
                },
              ],
              loc: { start: 21, end: 124 },
            },
            loc: { start: 15, end: 124 },
          },
        ],
        loc: { start: 9, end: 128 },
      },
      loc: { start: 4, end: 128 },
    });

    expect(action.relationships).toEqual([
      {
        name: 'Person',
        fields: [{ name: 'name' }],
        children: [
          {
            name: 'City',
            fields: [{ name: 'name' }],
            children: [],
          },
        ],
      },
    ]);
  });
});
