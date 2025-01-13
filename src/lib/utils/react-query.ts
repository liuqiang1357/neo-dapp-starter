import { QueryCache, QueryClient } from '@tanstack/react-query';
import { lastErrorAtom } from '../states/errors';
import { store } from './jotai';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: error => {
      store.set(lastErrorAtom, error);
    },
  }),
});
