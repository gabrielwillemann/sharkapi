import { EntityBase } from '../../orm';

import { parseSort, parseFilter, parseRelationships, parsePage, parseRootFields } from './helpers';

export async function GraphQLIndexAction(entity: EntityBase, source, args, context, info): Promise<any> {
  try {
    let action = entity.newIndexAction();
    parseSort(action, args.sort);
    parseFilter(action, args.filter);
    parsePage(action, args.first, args.offset);
    parseRelationships(action, info);
    parseRootFields(action, info);
    let rows = await action.run();
    return { nodes: rows.data, totalCount: rows.count };
  } catch (error) {
    throw new this.graphql.GraphQLError(error.message || error);
  }
}

export async function GraphQLShowAction(entity: EntityBase, source, args, context, info): Promise<any> {
  try {
    let action = entity.newShowAction();
    action.id = args.id;
    parseRelationships(action, info);
    parseRootFields(action, info);
    let row = await action.run();
    return row;
  } catch (error) {
    throw new this.graphql.GraphQLError(error.message || error);
  }
}

export async function GraphQLCreateAction(entity: EntityBase, source, args, context, info): Promise<any> {
  try {
    let action = entity.newCreateAction();
    action.data = args.input;
    let row = await action.run();
    return await GraphQLShowAction.call(this, entity, source, { id: args.id }, context, info);
  } catch (error) {
    throw new this.graphql.GraphQLError(error.message || error);
  }
}

export async function GraphQLUpdateAction(entity: EntityBase, source, args, context, info): Promise<any> {
  try {
    let action = entity.newUpdateAction();
    action.id = args.id;
    action.data = args.input;
    let row = await action.run();
    return await GraphQLShowAction.call(this, entity, source, { id: args.id }, context, info);
  } catch (error) {
    throw new this.graphql.GraphQLError(error.message || error);
  }
}

export async function GraphQLDeleteAction(entity: EntityBase, source, args, context, info): Promise<any> {
  try {
    let row = await GraphQLShowAction.call(this, entity, source, { id: args.id }, context, info);
    let action = entity.newDeleteAction();
    action.id = args.id;
    await action.run();
    return row;
  } catch (error) {
    throw new this.graphql.GraphQLError(error.message || error);
  }
}
