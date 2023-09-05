import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import invariant from 'tiny-invariant';
import { useSnapshot } from 'valtio';
import { ensureWalletReady, web3State } from 'states/web3';
import { addressToScriptHash } from 'utils/convertors';
import { invokeRead, waitForTransaction } from 'utils/web3';

interface UseNep17RawBalanceParams {
  address: string;
  contractHash: string;
}

export function useNep17RawBalance(params: UseNep17RawBalanceParams | null) {
  const { networkId } = useSnapshot(web3State);

  return useQuery({
    queryKey: ['Nep17RawBalance', { networkId, ...params }],
    queryFn: async () => {
      invariant(params != null);

      const result = await invokeRead<[{ value: string }]>({
        networkId,
        scriptHash: params.contractHash,
        operation: 'balanceOf',
        args: [{ type: 'Hash160', value: addressToScriptHash(params.address) }],
      });
      return result[0].value;
    },
    enabled: params != null,
  });
}

interface Nep17TransferParams {
  address: string;
  contractHash: string;
  to: string;
  rawAmount: string;
}

export function useNep17Transfer() {
  const { networkId } = useSnapshot(web3State);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, contractHash, to, rawAmount }: Nep17TransferParams) => {
      const { connector } = await ensureWalletReady({ address });
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
