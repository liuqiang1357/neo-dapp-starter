import { createApi } from '@reduxjs/toolkit/query/react';
import { addressToScriptHash } from 'utils/convertors';
import { invokeReadBaseQuery } from 'utils/queries';

export const invokeReadApi = createApi({
  reducerPath: 'invokeReadApi',
  tagTypes: ['Nep17Balance'],
  baseQuery: invokeReadBaseQuery(),
  endpoints: builder => ({
    getNep17RawBalance: builder.query<string, { contractHash: string; address: string }>({
      query: ({ contractHash, address }) => ({
        scriptHash: contractHash,
        operation: 'balanceOf',
        args: [{ type: 'Hash160', value: addressToScriptHash(address) }],
      }),
      transformResponse: (result: any) => result[0].value,
      providesTags: ['Nep17Balance'],
    }),
  }),
});

export const { useGetNep17RawBalanceQuery } = invokeReadApi;
