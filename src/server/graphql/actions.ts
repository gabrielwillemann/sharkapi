import { EntityBase } from '../../orm';

import { parseSort, parseFilter, parseRelationships, parsePage, parseRootFields } from './helpers';

export async function GraphQLIndexAction(entity: EntityBase, source, args, context, info): Promise<any> {
  let action = entity.newIndexAction();
  parseSort(action, args.sort);
  parseFilter(action, args.filter);
  parsePage(action, args.first, args.offset);
  parseRelationships(action, info);
  parseRootFields(action, info);
  let rows = await action.run();
  return { nodes: rows.rows, totalCount: rows.count };
}

export async function GraphQLShowAction(entity: EntityBase, source, args, context, info): Promise<any> {
  let action = entity.newShowAction();
  action.id = args.id;
  parseRelationships(action, info);
  parseRootFields(action, info);
  let rows = await action.run();
  return rows;
}
