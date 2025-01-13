import { ApplicationLogJson } from '@cityofzion/neon-core/lib/rpc';
import { ContractParam, createScript } from '@cityofzion/neon-core/lib/sc';
import {
  BaseTransport,
  JsonRpcError,
  RequestArguments,
  StandardErrorCodes,
} from '@neongd/json-rpc';
import { signerJsonToSigner } from '@neongd/neo-dapi';
import { compareVersions } from 'compare-versions';
import delay from 'delay';
import {
  ChainId,
  ConnectorId,
  connectorMinimumVersions,
  furaUrls,
  rpcUrls,
} from '@/configs/chains';
import {
  ConnectorAccountMismatchError,
  ConnectorAccountNotFoundError,
  ConnectorChainMismatchError,
  ConnectorNotConnectedError,
  ConnectorVersionIncompatibleError,
  ContractInvocationError,
} from '@/lib/errors/neo';
import { HttpRequestError, RpcRequestError } from '@/lib/errors/request';
import {
  chainIdAtom,
  connectedConnectorDataAtom,
  connectorDatasAtom,
  lastConnectedConnectorIdAtom,
  storageChainIdAtom,
} from '@/lib/states/neo';
import { store } from '../jotai';
import { httpRequest } from '../ky';
import { connectors } from './connectors';
import {
  Connector,
  InvokeMultipleParams as ConnectorInvokeMultipleParams,
  InvokeParams as ConnectorInvokeParams,
  InvokeMultipleResult,
  InvokeResult,
  SwitchChainParams,
} from './connectors/types';

export type ConnectParams = {
  connectorId: ConnectorId;
  chainId?: ChainId;
};

export async function connect(params: ConnectParams): Promise<void> {
  const connector = connectors[params.connectorId];

  const version = await connector.getVersion();
  if (
    version != null &&
    compareVersions(version, connectorMinimumVersions[params.connectorId]) < 0
  ) {
    throw new ConnectorVersionIncompatibleError();
  }

  await connector.connect(params);
  let data = await connector.getData();

  if (params.chainId != null && data.chainId !== params.chainId) {
    await connector.switchChain({ chainId: params.chainId });
    data = await connector.getData();
  }

  if (data.account == null) {
    throw new ConnectorAccountNotFoundError();
  }

  store.set(connectorDatasAtom, connectorDatas => ({
    ...connectorDatas,
    [params.connectorId]: {
      ...connectorDatas[params.connectorId],
      ...data,
    },
  }));
  store.set(lastConnectedConnectorIdAtom, params.connectorId);
}

export async function disconnect(): Promise<void> {
  const connectorId = store.get(lastConnectedConnectorIdAtom);

  if (connectorId != null) {
    const connector = connectors[connectorId];
    await connector.disconnect();

    store.set(lastConnectedConnectorIdAtom, null);
  }
}

export type EnsureCurrentConnectorReadyParams = {
  chainId?: ChainId;
  account?: string;
};

export type EnsureCurrentConnectorReadyResult = {
  connectorId: ConnectorId;
  chainId: ChainId | null;
  account: string | null;
  connector: Connector;
};

export async function ensureCurrentConnectorReady(
  params: EnsureCurrentConnectorReadyParams = {},
): Promise<EnsureCurrentConnectorReadyResult> {
  const connectorId = store.get(lastConnectedConnectorIdAtom);
  const connectorData = store.get(connectedConnectorDataAtom);

  if (connectorId == null || connectorData == null) {
    throw new ConnectorNotConnectedError();
  }
  if (params.chainId != null && connectorData.chainId !== params.chainId) {
    throw new ConnectorChainMismatchError();
  }
  if (params.account != null && connectorData.account !== params.account) {
    throw new ConnectorAccountMismatchError();
  }
  return {
    connectorId,
    chainId: connectorData.chainId,
    account: connectorData.account,
    connector: connectors[connectorId],
  };
}

export async function switchChain(params: SwitchChainParams): Promise<void> {
  const connectorId = store.get(lastConnectedConnectorIdAtom);
  const connectorData = store.get(connectedConnectorDataAtom);

  if (connectorId == null || connectorData == null) {
    store.set(storageChainIdAtom, params.chainId);
    return;
  }

  if (connectorData.chainId !== params.chainId) {
    const connector = connectors[connectorId];

    await connector.switchChain(params);
    const data = await connector.getData();

    store.set(connectorDatasAtom, connectorDatas => ({
      ...connectorDatas,
      [connectorId]: {
        ...connectorDatas[connectorId],
        ...data,
      },
    }));
  }
}

export type InvokeParams = ConnectorInvokeParams & EnsureCurrentConnectorReadyParams;

export async function invoke(params: InvokeParams): Promise<InvokeResult> {
  const { connector } = await ensureCurrentConnectorReady(params);
  return await connector.invoke(params);
}

export type InvokeMultipleParams = ConnectorInvokeMultipleParams &
  EnsureCurrentConnectorReadyParams;

export async function invokeMultiple(params: InvokeMultipleParams): Promise<InvokeMultipleResult> {
  const { connector } = await ensureCurrentConnectorReady(params);
  return await connector.invokeMultiple(params);
}

export type RpcRequestParams = RequestArguments & {
  chainId?: ChainId;
};

export async function rpcRequest<T = unknown>(params: RpcRequestParams): Promise<T> {
  try {
    const transport = new BaseTransport(rpcUrls[params.chainId ?? store.get(chainIdAtom)]);
    return await transport.request<T>(params);
  } catch (error) {
    if (error instanceof JsonRpcError) {
      if (error.code === StandardErrorCodes.CommunicationFailed) {
        throw new HttpRequestError(undefined, { cause: error });
      }
      throw new RpcRequestError(error.message, {
        cause: error,
        data: { responseErrorCode: error.code, responseErrorData: error.data },
      });
    }
    throw error;
  }
}

export type FuraRequestParams = RequestArguments & {
  chainId?: ChainId;
};

export async function furaRequest<T = unknown>(params: FuraRequestParams): Promise<T> {
  try {
    const result = await httpRequest<{ result: T; error: string | { message: string } }>({
      prefixUrl: furaUrls[params.chainId ?? store.get(chainIdAtom)],
      method: 'post',
      json: params,
    });
    if (result.error == null) {
      return result.result;
    }
    if (typeof result.error === 'string') {
      throw new HttpRequestError(result.error);
    }
    throw new HttpRequestError(result.error.message);
  } catch (error) {
    if (error instanceof HttpRequestError) {
      if (error.json != null) {
        const json = error.json as { error: { message: string } };
        throw new HttpRequestError(json.error.message, { cause: error });
      }
    }
    throw error;
  }
}

export type InvokeReadParams = ConnectorInvokeParams & {
  chainId?: ChainId;
};

export async function invokeRead<T = unknown>(params: InvokeReadParams): Promise<T> {
  const result = await rpcRequest<{ exception: string | null; stack: T }>({
    chainId: params.chainId,
    method: 'invokefunction',
    params: [
      params.scriptHash,
      params.operation,
      params.args ?? [],
      (params.signers ?? []).map(signerJsonToSigner),
    ],
  });
  if (result.exception != null) {
    throw new ContractInvocationError(result.exception);
  }
  return result.stack;
}

export type InvokeReadMultipleParams = ConnectorInvokeMultipleParams & {
  chainId?: ChainId;
};

export async function invokeReadMultiple<T = unknown>(
  params: InvokeReadMultipleParams,
): Promise<T> {
  const script = createScript(
    ...params.invocations.map(invocation => ({
      ...invocation,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: invocation.args?.map(arg => ContractParam.fromJson(arg as any)),
    })),
  );
  const base64Script = Buffer.from(script, 'hex').toString('base64');
  const result = await rpcRequest<{ exception: string | null; stack: T }>({
    chainId: params.chainId,
    method: 'invokescript',
    params: [base64Script, (params.signers ?? []).map(signerJsonToSigner)],
  });
  if (result.exception != null) {
    throw new ContractInvocationError(result.exception);
  }
  return result.stack;
}

export type WaitForTransactionParams = {
  chainId?: ChainId;
  hash: string;
};

export async function waitForTransaction(
  params: WaitForTransactionParams,
): Promise<ApplicationLogJson> {
  let retryCount = 0;
  for (;;) {
    try {
      const result = await rpcRequest<ApplicationLogJson>({
        chainId: params.chainId,
        method: 'getapplicationlog',
        params: [params.hash],
      });
      return result;
    } catch (error) {
      if (error instanceof RpcRequestError && error.message.includes('Unknown transaction')) {
        await delay(5000 * 1.2 ** retryCount);
        retryCount += 1;
        continue;
      }
      throw error;
    }
  }
}
