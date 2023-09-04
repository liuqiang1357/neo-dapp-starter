import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import invariant from 'tiny-invariant';
import { useSnapshot } from 'valtio';
import { ensureWalletReady, web3State } from 'states/web3';
import { addressToScriptHash } from 'utils/convertors';
import { invokeRead, waitForTransaction } from 'utils/web3';

interface UseNep17RawBalanceParams {
  contractHash: string;
}

export function useNep17RawBalance(params: UseNep17RawBalanceParams | null) {
  const { networkId, address } = useSnapshot(web3State);

  return useQuery({
    queryKey: ['Nep17RawBalance', { networkId, address, ...params }],
    queryFn: async () => {
      invariant(address != null && params != null);

      const result = await invokeRead<[{ value: string }]>({
        networkId,
        scriptHash: params.contractHash,
        operation: 'balanceOf',
        args: [{ type: 'Hash160', value: addressToScriptHash(address) }],
      });
      return result[0].value;
    },
    enabled: address != null && params != null,
  });
}

interface Nep17TransferParams {
  contractHash: string;
  to: string;
  rawAmount: string;
}

export function useNep17Transfer() {
  const { networkId } = useSnapshot(web3State);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractHash, to, rawAmount }: Nep17TransferParams) => {
      const { connector, address } = await ensureWalletReady();
      const transactionHash = await connector.invoke({
        scriptHash: contractHash,
        operation: 'transfer',
        args: [
          { type: 'Hash160', value: addressToScriptHash(address) },
          { type: 'Hash160', value: addressToScriptHash(to) },
          { type: 'Integer', value: rawAmount },
          { type: 'Any', value: null },
        ],
        signers: [{ account: addressToScriptHash(address), scopes: 'CalledByEntry' }],
      });
      await waitForTransaction({ networkId, transactionHash });
      await queryClient.invalidateQueries({
        queryKey: ['Nep17RawBalance', { networkId, address }],
      });
    },
  });
}
