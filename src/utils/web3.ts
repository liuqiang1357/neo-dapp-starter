import { Buffer } from 'buffer';
import { ContractParam, createScript } from '@cityofzion/neon-core/lib/sc';
import { BaseJsonRpcTransport, RequestArguments, StandardErrorCodes } from '@neongd/json-rpc';
import axios from 'axios';
import delay from 'delay';
import pMemoize from 'p-memoize';
import { NetworkId, WalletId } from 'utils/models';
import { NETWORK_CONFIGS } from './configs';
import { Connector, InvokeMultipleParams, InvokeParams } from './connectors/types';
import { serializeSigner } from './convertors';
import { BackendError } from './errors';

export const CONNECTORS: Record<WalletId, () => Promise<Connector>> = {
  [WalletId.OneGate]: pMemoize(async () => {
    const { OneGateConnector } = await import('./connectors/onegate');
    return new OneGateConnector();
  }),
  [WalletId.NeoLine]: pMemoize(async () => {
    const { NeoLineConnector } = await import('./connectors/neoline');
    return new NeoLineConnector();
  }),
  [WalletId.O3]: pMemoize(async () => {
    const { O3Connector } = await import('./connectors/o3');
    return new O3Connector();
  }),
  [WalletId.Neon]: pMemoize(async () => {
    const { NeonConnector } = await import('./connectors/neon');
    return new NeonConnector({
      signClientOptions: {
        projectId: '6fc6f515daaa4b001616766bc028bffa', // TODO
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
          name: 'React App', // TODO
          description: 'Web site created using create-react-app', // TODO
          url: 'http://localhost:3000', // TODO
          icons: ['http://localhost:3000/favicon.ico'], // TODO
        },
      },
    });
  }),
};

export interface NodeRequestParams extends RequestArguments {
  networkId: NetworkId;
}

export async function nodeRequest<T = unknown>({
  networkId,
  ...rest
}: NodeRequestParams): Promise<T> {
  try {
    const url = NETWORK_CONFIGS[networkId].nodeUrl;
    const transport = new BaseJsonRpcTransport(url);
    return await transport.request(rest);
  } catch (error: any) {
    let code = BackendError.Codes.UnknownError;
    if (error.code === StandardErrorCodes.NetworkError) {
      code = BackendError.Codes.NetworkError;
    } else if (error.code === -100) {
      code = BackendError.Codes.NotFound;
    }
    throw new BackendError(error.message, { cause: error, code, data: error.data });
  }
}

export interface FuraRequestParams extends RequestArguments {
  networkId: NetworkId;
}

export async function furaRequest<T = unknown>({
  networkId,
  ...rest
}: FuraRequestParams): Promise<T> {
  try {
    const url = NETWORK_CONFIGS[networkId].furaUrl;
    const instance = axios.create({ baseURL: url });
    const response = await instance.post('/', rest);
    if (response.data.error == null) {
      return response.data.result;
    }
    let finalError;
    if (typeof response.data.error === 'string') {
      let code = BackendError.Codes.UnknownError;
      if (response.data.error === 'not found') {
        code = BackendError.Codes.NotFound;
      }
      finalError = new BackendError(response.data.error, {
        cause: response.data.error,
        code,
      });
    } else {
      let code = BackendError.Codes.UnknownError;
      if (response.data.error.code === -100) {
        code = BackendError.Codes.NotFound;
      }
      finalError = new BackendError(response.data.error.message, {
        cause: response.data.error,
        code,
        data: response.data.error.data,
      });
    }
    throw finalError;
  } catch (error: any) {
    const finalError = new BackendError(error.message, {
      cause: error,
      code: BackendError.Codes.NetworkError,
    });
    throw finalError;
  }
}

export interface InvokeReadParams extends InvokeParams {
  networkId: NetworkId;
}

export async function invokeRead<T = unknown>(params: InvokeReadParams): Promise<T> {
  const result = await nodeRequest<T>({
    method: 'invokefunction',
    params: [
      params.scriptHash,
      params.operation,
      params.args ?? [],
      (params.signers ?? []).map(signer => ({
        account: signer.account,
        scopes: signer.scopes,
        allowedcontracts: signer.allowedContracts,
        allowedgroups: signer.allowedGroups,
        rules: signer.rules,
      })),
    ],
    networkId: params.networkId,
  });
  if ((result as any).exception == null) {
    return (result as any).stack;
  }
  const finalError = new BackendError((result as any).exception, {
    cause: result,
    code: BackendError.Codes.BadRequest,
  });
  throw finalError;
}

export interface InvokeReadMultipleParams extends InvokeMultipleParams {
  networkId: NetworkId;
}

export async function invokeReadMultiple<T = unknown>(
  params: InvokeReadMultipleParams,
): Promise<T> {
  const script = createScript(
    ...params.invocations.map(invocation => ({
      ...invocation,
      args: invocation.args?.map(arg => ContractParam.fromJson(arg)),
    })),
  );
  const base64Script = Buffer.from(script, 'hex').toString('base64');
  const result = await nodeRequest<T>({
    method: 'invokescript',
    params: [base64Script, (params.signers ?? []).map(serializeSigner)],
    networkId: params.networkId,
  });
  if ((result as any).exception == null) {
    return (result as any).stack;
  }
  const finalError = new BackendError((result as any).exception, {
    cause: result,
    code: BackendError.Codes.BadRequest,
  });
  throw finalError;
}

export interface WaitForTransactionParams {
  networkId: NetworkId;
  transactionHash: string;
}

export async function waitForTransaction(params: WaitForTransactionParams): Promise<number> {
  let retryCount = 0;
  for (;;) {
    try {
      const result = await nodeRequest<number>({
        method: 'gettransactionheight',
        params: [params.transactionHash],
        networkId: params.networkId,
      });
      return result;
    } catch (error) {
      if (error instanceof BackendError && error.code === BackendError.Codes.NotFound) {
        error.expose = false;
        await delay(5000 * 1.2 ** retryCount);
        retryCount += 1;
        continue;
      }
      throw error;
    }
  }
}
