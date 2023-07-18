import { BaseJsonRpcTransport, RequestArguments, StandardErrorCodes } from '@neongd/json-rpc';
import axios from 'axios';
import delay from 'delay';
import { NetworkId, WalletId } from 'utils/models';
import { NETWORK_CONFIGS } from './configs';
import { NeoLineConnector } from './connectors/neoline';
import { NeonConnector } from './connectors/neon';
import { O3Connector } from './connectors/o3';
import { OneGateConnector } from './connectors/onegate';
import { Connector, InvokeParams } from './connectors/types';
import { BackendError } from './errors';

export const CONNECTORS: Record<WalletId, Connector> = {
  [WalletId.OneGate]: new OneGateConnector(),
  [WalletId.NeoLine]: new NeoLineConnector(),
  [WalletId.O3]: new O3Connector(),
  [WalletId.Neon]: new NeonConnector({
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
  }),
};

export interface NodeRequestParams extends RequestArguments {
  networkId: NetworkId;
}

export async function nodeRequest<T = any>(params: NodeRequestParams): Promise<T> {
  try {
    const url = NETWORK_CONFIGS[params.networkId].nodeUrl;
    const transport = new BaseJsonRpcTransport(url);
    return transport.request(params);
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

export async function furaRequest<T = any>(params: FuraRequestParams): Promise<T> {
  try {
    const url = NETWORK_CONFIGS[params.networkId].furaUrl;
    const instance = axios.create({ baseURL: url });
    const response = await instance.post('/', params);
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

export async function invokeRead<T = any>(params: InvokeReadParams): Promise<T> {
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

export interface WaitForTransactionParams {
  networkId: NetworkId;
  transactionHash: string;
}

export async function waitForTransaction(params: WaitForTransactionParams): Promise<void> {
  let retryCount = 0;
  for (;;) {
    try {
      await nodeRequest({
        method: 'getapplicationlog',
        params: [params.transactionHash],
        networkId: params.networkId,
      });
      break;
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
