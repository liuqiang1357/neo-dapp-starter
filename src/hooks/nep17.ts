import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import invariant from 'tiny-invariant';
import {
  getNep17RawBalance,
  GetNep17RawBalanceParams,
  transferNep17,
  TransferNep17Params,
} from 'apis/nep17';
import { waitForTransaction } from 'utils/web3';

export function useNep17RawBalance(params: GetNep17RawBalanceParams | null) {
  return useQuery({
    queryKey: ['Nep17RawBalance', params],
    queryFn: async () => {
      invariant(params != null);
      return await getNep17RawBalance(params);
    },
    enabled: params != null,
  });
}

export function useTransferNep17() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransferNep17Params) => {
      const transactionHash = await transferNep17(params);
      await waitForTransaction({ networkId: params.networkId, transactionHash });
      await queryClient.invalidateQueries({
        queryKey: ['Nep17RawBalance', { networkId: params.networkId, address: params.address }],
      });
    },
  });
}
