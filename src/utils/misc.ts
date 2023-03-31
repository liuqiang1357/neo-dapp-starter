import {
  AsyncThunk,
  AsyncThunkOptions,
  AsyncThunkPayloadCreator,
  createAsyncThunk as createReduxAsyncThunk,
  SerializedError,
} from '@reduxjs/toolkit';
import { filterDeep } from 'deepdash-es/standalone';
import { theme } from '../../tailwind.config';

export { theme };

export function omitUndefined<T>(data: T): T {
  return filterDeep(data, value => (value === undefined ? false : true), {
    leavesOnly: true,
  });
}

export function createAsyncThunk<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg>,
  options?: AsyncThunkOptions<ThunkArg, Record<string, any>>,
): AsyncThunk<Returned, ThunkArg, Record<string, any>> {
  return createReduxAsyncThunk(typePrefix, payloadCreator, {
    serializeError: (error: unknown): SerializedError => error as SerializedError,
    ...options,
  });
}

export function getListTags<Type extends string, Item extends { id: string | number }>(
  type: Type,
  items: Item[] | undefined,
): { type: Type; id: string | number }[];

export function getListTags<Type extends string, Item>(
  type: Type,
  items: Item[] | undefined,
  getId: (item: Item) => string | number,
): { type: Type; id: string | number }[];

export function getListTags<Type extends string, Item extends { id: string | number }>(
  type: Type,
  items: Item[] | undefined,
  getId?: (item: Item) => string | number,
): { type: Type; id: string | number }[] {
  return items
    ? [{ type, id: 'LIST' }, ...items.map(item => ({ type, id: getId ? getId(item) : item.id }))]
    : [{ type, id: 'LIST' }];
}
