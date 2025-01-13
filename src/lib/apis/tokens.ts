import { addressToScriptHash } from '@neongd/neo-dapi';
import { ChainId } from '@/configs/chains';
import { amountToRawAmount, rawAmountToAmount } from '../utils/misc';
import { invoke, invokeRead, switchChain } from '../utils/neo/actions';

export type GetDecimalsParams = {
  chainId: ChainId;
  scriptHash: string;
};

export async function getDecimals(params: GetDecimalsParams): Promise<number> {
  const result = await invokeRead<[{ value: string }]>({
    chainId: params.chainId,
    scriptHash: params.scriptHash,
    operation: 'decimals',
  });
  return Number(result[0].value);
}

export type GetSymbolParams = {
  chainId: ChainId;
  scriptHash: string;
};

export async function getSymbol(params: GetDecimalsParams): Promise<string> {
  const result = await invokeRead<[{ value: string }]>({
    chainId: params.chainId,
    scriptHash: params.scriptHash,
    operation: 'symbol',
  });
  return Buffer.from(result[0].value, 'base64').toString();
}

export type GetBalanceParams = {
  chainId: ChainId;
  scriptHash: string;
  account: string;
  decimals: number;
};

export async function getBalance(params: GetBalanceParams): Promise<string> {
  const result = await invokeRead<[{ value: string }]>({
    chainId: params.chainId,
    scriptHash: params.scriptHash,
    operation: 'balanceOf',
    args: [{ type: 'Hash160', value: addressToScriptHash(params.account) }],
  });
  return rawAmountToAmount(BigInt(result[0].value), params.decimals);
}

export type TransferParams = {
  chainId: ChainId;
  scriptHash: string;
  account: string;
  decimals: number;
  to: string;
  amount: string;
};

export async function transfer(params: TransferParams): Promise<string> {
  await switchChain({ chainId: params.chainId });

  const result = await invoke({
    chainId: params.chainId,
    account: params.account,
    scriptHash: params.scriptHash,
    operation: 'transfer',
    args: [
      { type: 'Hash160', value: addressToScriptHash(params.account) },
      { type: 'Hash160', value: addressToScriptHash(params.to) },
      { type: 'Integer', value: amountToRawAmount(params.amount, params.decimals).toString() },
      { type: 'Any', value: null },
    ],
    signers: [{ account: addressToScriptHash(params.account), scopes: 'CalledByEntry' }],
  });
  return result.transactionHash;
}
