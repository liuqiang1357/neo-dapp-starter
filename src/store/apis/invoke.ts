import { createApi } from '@reduxjs/toolkit/query/react';
import { addressToScriptHash } from 'utils/convertors';
import { invokeBaseQuery } from 'utils/queries';
import { invokeReadApi } from './invokeRead';

export const invokeApi = createApi({
  reducerPath: 'invokeApi',
  baseQuery: invokeBaseQuery(),
  endpoints: builder => ({
    nep17Transfer: builder.mutation<
      void,
      { contractHash: string; from: string; to: string; rawAmount: string }
    >({
      query: ({ contractHash, from, to, rawAmount }) => ({
        scriptHash: contractHash,
        operation: 'transfer',
        args: [
          { type: 'Hash160', value: addressToScriptHash(from) },
          { type: 'Hash160', value: addressToScriptHash(to) },
          { type: 'Integer', value: rawAmount },
          { type: 'Any', value: null },
        ],
        signers: [{ account: addressToScriptHash(from), scopes: 'CalledByEntry' }],
        waitConfirmed: true,
      }),
      onQueryStarted: async (arg, { queryFulfilled, dispatch }) => {
        await queryFulfilled;
        dispatch(invokeReadApi.util.invalidateTags(['Nep17Balance']));
      },
    }),
  }),
});

export const { useNep17TransferMutation } = invokeApi;
