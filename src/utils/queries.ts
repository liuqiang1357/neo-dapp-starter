import { BaseJsonRpcTransport, RequestArguments, StandardErrorCodes } from '@neongd/json-rpc';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import delay from 'delay';
import queryString from 'query-string';
import { Dispatch, State } from 'store';
import { selectCurrentAuthState } from 'store/slices/auth';
import { publishError } from 'store/slices/errors';
import { ensureWalletReady } from 'store/slices/wallets';
import { BACKEND_URL, FURA_URL, NODE_URL } from './configs';
import { BackendError } from './errors';
import { InvokeParams } from './wallets/wallet';

export function backendBaseQuery(): BaseQueryFn<AxiosRequestConfig> {
  const instance = axios.create({
    baseURL: BACKEND_URL,
    paramsSerializer: { serialize: params => queryString.stringify(params) },
  });
  return async (config, { dispatch, getState }) => {
    try {
      const authState = selectCurrentAuthState(getState() as State);
      const response = await instance.request({
        ...config,
        headers: {
          ...(authState && {
            Authorization: `Bearer ${authState.token}`,
          }),
          ...config.headers,
        },
      });
      return { data: response.data };
    } catch (error: any) {
      const response: AxiosResponse | undefined = error.response;
      let finalError = error;
      if (response) {
        let code = BackendError.Codes.UnknownError;
        if (response.status === 400) {
          code = BackendError.Codes.BadRequest;
        } else if (response.status === 500) {
          code = BackendError.Codes.InternalServiceError;
        }
        finalError = new BackendError(response.data.message, {
          cause: response.data,
          code,
          data: response.data.data,
        });
      } else {
        finalError = new BackendError(error.message, {
          cause: error,
          code: BackendError.Codes.NetworkError,
        });
      }
      dispatch(publishError(finalError));
      return { error: finalError };
    }
  };
}

export function furaBaseQuery(): BaseQueryFn<RequestArguments> {
  const instance = axios.create({ baseURL: FURA_URL });
  return async (request, { dispatch }) => {
    try {
      const response = await instance.post('/', request);
      if (response.data.error == null) {
        return { data: response.data.result };
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
      dispatch(publishError(finalError));
      return { error: finalError };
    } catch (error: any) {
      const finalError = new BackendError(error.message, {
        cause: error,
        code: BackendError.Codes.NetworkError,
      });
      dispatch(publishError(finalError));
      return { error: finalError };
    }
  };
}

export function nodeBaseQuery(): BaseQueryFn<RequestArguments> {
  const transport = new BaseJsonRpcTransport(NODE_URL);
  return async (request, { dispatch }) => {
    try {
      const result = await transport.request(request);
      return { data: result };
    } catch (error: any) {
      let code = BackendError.Codes.UnknownError;
      if (error.code === StandardErrorCodes.NetworkError) {
        code = BackendError.Codes.NetworkError;
      } else if (error.code === -100) {
        code = BackendError.Codes.NotFound;
      }
      const finalError = new BackendError(error.message, { cause: error, code, data: error.data });
      dispatch(publishError(finalError));
      return { error: finalError };
    }
  };
}

export function invokeReadBaseQuery(): BaseQueryFn<InvokeParams> {
  const nodeBaseQueryFn = nodeBaseQuery();
  return async (params, api) => {
    const { data, error } = await nodeBaseQueryFn(
      {
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
      },
      api,
      {},
    );
    if (error == null) {
      if ((data as any).exception == null) {
        return { data: (data as any).stack };
      }
      const finalError = new BackendError((data as any).exception, {
        cause: data,
        code: BackendError.Codes.BadRequest,
      });
      api.dispatch(publishError(finalError));
      return { error: finalError };
    }
    return { error };
  };
}

export function invokeBaseQuery(): BaseQueryFn<InvokeParams & { waitConfirmed?: boolean }> {
  const nodeBaseQueryFn = nodeBaseQuery();
  return async ({ waitConfirmed, ...params }, api) => {
    try {
      const { wallet } = await (api.dispatch as Dispatch)(ensureWalletReady()).unwrap();
      const transactionHash = await wallet.invoke(params);

      if (waitConfirmed === true) {
        let retryCount = 0;
        for (;;) {
          const { error } = await nodeBaseQueryFn(
            { method: 'getapplicationlog', params: [transactionHash] },
            api,
            {},
          );
          if (error == null) {
            break;
          } else {
            if (error instanceof BackendError && error.code === BackendError.Codes.NotFound) {
              error.expose = false;
              await delay(5000 * 1.2 ** retryCount);
              retryCount += 1;
              continue;
            }
            return { error };
          }
        }
      }
      return { data: transactionHash };
    } catch (error: any) {
      api.dispatch(publishError(error));
      return { error };
    }
  };
}
