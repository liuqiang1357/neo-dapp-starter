import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveConnector } from 'states/web3';
import { addressToScriptHash } from 'utils/convertors';
import { invokeRead, waitForTransaction } from 'utils/web3';
import { useWeb3State } from './web3';

export function useNep17RawBalance(contractHash: string | null) {
  const { networkId, address } = useWeb3State();

  return useQuery(
    contractHash != null && address != null
      ? {
          queryKey: ['Nep17RawBalance', { networkId, contractHash, address }],
          queryFn: async () => {
            const result = await invokeRead({
              networkId,
              scriptHash: contractHash,
              operation: 'balanceOf',
              args: [{ type: 'Hash160', value: addressToScriptHash(address) }],
            });
            return result[0].value as string;
          },
        }
      : { enabled: false },
  );
}

export function useNep17Transfer() {
  const { networkId } = useWeb3State();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractHash,
      from,
      to,
      rawAmount,
    }: {
      contractHash: string;
      from: string;
      to: string;
      rawAmount: string;
    }) => {
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
