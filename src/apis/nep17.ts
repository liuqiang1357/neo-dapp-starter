import { ensureWalletReady } from 'states/web3';
import { addressToScriptHash } from 'utils/convertors';
import { NetworkId } from 'utils/models';
import { invokeRead } from 'utils/web3';

export interface GetNep17RawBalanceParams {
  networkId: NetworkId;
  address: string;
  contractHash: string;
}

export async function getNep17RawBalance(params: GetNep17RawBalanceParams): Promise<string> {
  const result = await invokeRead<[{ value: string }]>({
    networkId: params.networkId,
    scriptHash: params.contractHash,
    operation: 'balanceOf',
    args: [{ type: 'Hash160', value: addressToScriptHash(params.address) }],
  });
  return result[0].value;
}

export interface TransferNep17Params {
  networkId: NetworkId;
  address: string;
  contractHash: string;
  to: string;
  rawAmount: string;
}

export async function transferNep17(params: TransferNep17Params): Promise<string> {
  const { connector } = await ensureWalletReady({ address: params.address });
  const transactionHash = await connector.invoke({
    scriptHash: params.contractHash,
    operation: 'transfer',
    args: [
      { type: 'Hash160', value: addressToScriptHash(params.address) },
      { type: 'Hash160', value: addressToScriptHash(params.to) },
      { type: 'Integer', value: params.rawAmount },
      { type: 'Any', value: null },
    ],
    signers: [{ account: addressToScriptHash(params.address), scopes: 'CalledByEntry' }],
  });
  return transactionHash;
}
