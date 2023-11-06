import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import invariant from 'tiny-invariant';
import { useSnapshot } from 'valtio';
import {
  getNep17RawBalance,
  GetNep17RawBalanceParams,
  transferNep17,
  TransferNep17Params,
} from 'apis/nep17';
import { web3State } from 'states/web3';
import { waitForTransaction } from 'utils/web3';

export function useNep17RawBalance(params: Omit<GetNep17RawBalanceParams, 'networkId'> | null) {
  const { networkId } = useSnapshot(web3State);

  return useQuery({
    queryKey: ['Nep17RawBalance', { networkId, ...params }],
    queryFn: async () => {
      invariant(params != null);
      return await getNep17RawBalance({ networkId, ...params });
    },
    enabled: params != null,
  });
}

export function useTransferNep17() {
  const { networkId } = useSnapshot(web3State);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Omit<TransferNep17Params, 'networkId'>) => {
      const transactionHash = await transferNep17({ networkId, ...params });
      await waitForTransaction({ networkId, transactionHash });
      await queryClient.invalidateQueries({
        queryKey: ['Nep17RawBalance', { networkId, address: params.address }],
      });
    },
  });
}
