import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnapshot } from 'valtio';
import { getActiveConnector, web3State } from 'states/web3';
import { addressToScriptHash } from 'utils/convertors';
import { invokeRead, waitForTransaction } from 'utils/web3';

export interface UseNep17RawBalanceParams {
  contractHash: string;
}

export function useNep17RawBalance(params: UseNep17RawBalanceParams | null) {
  const { networkId, address } = useSnapshot(web3State);

  return useQuery(
    address != null && params
      ? {
          queryKey: ['Nep17RawBalance', { networkId, address, ...params }],
          queryFn: async () => {
            const result = await invokeRead<[{ value: string }]>({
              networkId,
              scriptHash: params.contractHash,
              operation: 'balanceOf',
              args: [{ type: 'Hash160', value: addressToScriptHash(address) }],
            });
            return result[0].value;
          },
        }
      : { enabled: false },
  );
}

export interface Nep17TransferParams {
  contractHash: string;
  from: string;
  to: string;
  rawAmount: string;
}

export function useNep17Transfer() {
  const { networkId } = useSnapshot(web3State);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractHash, from, to, rawAmount }: Nep17TransferParams) => {
      const transactionHash = await getActiveConnector().invoke({
        scriptHash: contractHash,
        operation: 'transfer',
        args: [
          { type: 'Hash160', value: addressToScriptHash(from) },
          { type: 'Hash160', value: addressToScriptHash(to) },
          { type: 'Integer', value: rawAmount },
          { type: 'Any', value: null },
        ],
        signers: [{ account: addressToScriptHash(from), scopes: 'CalledByEntry' }],
      });
      await waitForTransaction({ networkId, transactionHash });
      await queryClient.invalidateQueries({ queryKey: ['Nep17RawBalance'] });
    },
  });
}
