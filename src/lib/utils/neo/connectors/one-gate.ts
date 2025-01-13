import { JsonRpcError, StandardErrorCodes } from '@neongd/json-rpc';
import { BaseDapi, Dapi, DapiErrorCodes, Provider } from '@neongd/neo-dapi';
import { Catch } from 'catchee';
import { ChainId } from '@/configs/chains';
import { InternalError } from '@/lib/errors/common';
import {
  ConnectorAccountNotFoundError,
  ConnectorChainMismatchError,
  ConnectorCommunicationError,
  InsufficientFundsError,
  InternalRpcError,
  InvalidParamsError,
  SwitchChainNotSupportedError,
  UnknownNeoError,
  UserRejectedRequestError,
} from '@/lib/errors/neo';
import {
  Connector,
  ConnectorData,
  ConnectParams,
  InvokeMultipleParams,
  InvokeMultipleResult,
  InvokeParams,
  InvokeResult,
  SwitchChainParams,
} from './types';

declare const window: Window & {
  OneGate?: Provider;
};

const neoChainIds: Partial<Record<string, ChainId>> = {
  MainNet: ChainId.Mainnet,
  TestNet: ChainId.Testnet,
};

export class OneGateConnector extends Connector {
  private dapi: Dapi | null = null;

  @Catch('handleError')
  async init(): Promise<void> {
    if (window.OneGate != null) {
      this.dapi = new BaseDapi(window.OneGate);
    }
    if (window.OneGate != null) {
      window.OneGate.on('networkChanged', this.emitChange);
      window.OneGate.on('accountChanged', this.emitChange);
    }
  }

  @Catch('handleError')
  async destroy(): Promise<void> {
    if (window.OneGate != null) {
      window.OneGate.removeListener('networkChanged', this.emitChange);
      window.OneGate.removeListener('accountChanged', this.emitChange);
    }
  }

  @Catch('handleError')
  async isIntalled(): Promise<boolean> {
    return this.dapi != null;
  }

  @Catch('handleError')
  async getVersion(): Promise<string | null> {
    const version = (await this.getDapi().getProvider()).version;
    return version;
  }

  @Catch('handleError')
  async getData(): Promise<ConnectorData> {
    const network = (await this.getDapi().getNetworks()).defaultNetwork;

    let address: string | null = null;
    if (await this.isAuthorized()) {
      address = (await this.getDapi().getAccount()).address;
    }

    return { chainId: neoChainIds[network] ?? null, account: address };
  }

  @Catch('handleError')
  async isAuthorized(): Promise<boolean> {
    return localStorage.getItem('oneGateAuthorized') === 'true';
  }

  @Catch('handleError')
  async connect(_params: ConnectParams): Promise<void> {
    await this.getDapi().getAccount();
    localStorage.setItem('oneGateAuthorized', 'true');
  }

  @Catch('handleError')
  async disconnect(): Promise<void> {
    localStorage.removeItem('oneGateAuthorized');
  }

  @Catch('handleError')
  async switchChain(_params: SwitchChainParams): Promise<void> {
    throw new SwitchChainNotSupportedError();
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const result = await this.getDapi().invoke(params);
    return { transactionHash: result.txid, signedTransaction: result.signedTx };
  }

  @Catch('handleError')
  async invokeMultiple(params: InvokeMultipleParams): Promise<InvokeMultipleResult> {
    const result = await this.getDapi().invokeMulti(params);
    return { transactionHash: result.txid, signedTransaction: result.signedTx };
  }

  @Catch('handleError')
  private getDapi() {
    if (this.dapi != null) {
      return this.dapi;
    }
    throw new InternalError('Neo dapi is not inited.');
  }

  protected handleError(error: unknown): never {
    if (error instanceof JsonRpcError) {
      switch (error.code) {
        case StandardErrorCodes.CommunicationFailed:
          throw new ConnectorCommunicationError(undefined, { cause: error });
        case DapiErrorCodes.UnsupportedNetwork:
          throw new ConnectorChainMismatchError(undefined, { cause: error });
        case DapiErrorCodes.NoAccount:
          throw new ConnectorAccountNotFoundError(undefined, { cause: error });
        case StandardErrorCodes.InvalidParams:
          throw new InvalidParamsError(undefined, { cause: error });
        case DapiErrorCodes.InsufficientFunds:
          throw new InsufficientFundsError(undefined, { cause: error });
        case DapiErrorCodes.RemoteRpcError:
          throw new InternalRpcError(error.message, { cause: error });
        case DapiErrorCodes.UserRejected:
          throw new UserRejectedRequestError(undefined, { cause: error });
      }
      throw new UnknownNeoError(error.message, { cause: error });
    }
    throw error;
  }
}
