import { QueryCache, QueryClient } from '@tanstack/react-query';
import stringify from 'safe-stable-stringify';
import { publishError } from 'states/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: queryKey => stringify(queryKey),
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: error => {
      publishError(error);
    },
  }),
  logger: {
    log: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  },
});
