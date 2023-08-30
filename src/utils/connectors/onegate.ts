import { StandardErrorCodes } from '@neongd/json-rpc';
import { BaseDapi, Dapi, DapiErrorCodes } from '@neongd/neo-dapi';
import { Provider } from '@neongd/neo-provider';
import { Catch } from 'catchee';
import { WalletError } from 'utils/errors';
import { NetworkId } from 'utils/models';
import {
  Connector,
  ConnectorData,
  InvokeMultipleParams,
  InvokeParams,
  SignMessageParams,
  SignMessageResult,
  SignTransactionParams,
  SignTransactionResult,
} from './types';

declare const window: Window & {
  OneGate?: Provider;
};

const ONEGATE_CONNECTED = 'ONEGATE_CONNECTED';

const NETWORK_IDS: Partial<Record<string, NetworkId>> = {
  MainNet: NetworkId.MainNet,
  TestNet: NetworkId.TestNet,
};

export class OneGateConnector extends Connector {
  private dapi: Dapi | null = null;

  async init(): Promise<void> {
    if (window.OneGate) {
      this.dapi = new BaseDapi(window.OneGate);
    }
  }

  async isReady(): Promise<boolean> {
    return this.dapi != null;
  }

  async isAuthorized(): Promise<boolean> {
    return localStorage.getItem(ONEGATE_CONNECTED) === 'true';
  }

  @Catch('handleError')
  async connect(): Promise<ConnectorData> {
    await this.getDapi().getAccount();
    localStorage.setItem(ONEGATE_CONNECTED, 'true');

    if (window.OneGate) {
      window.OneGate.on('accountChanged', this.updateData);
      window.OneGate.on('networkChanged', this.updateData);
    }
    return this.queryData();
  }

  async disconnect(): Promise<void> {
    localStorage.removeItem(ONEGATE_CONNECTED);

    if (window.OneGate) {
      window.OneGate.removeListener('accountChanged', this.updateData);
      window.OneGate.removeListener('networkChanged', this.updateData);
    }
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<string> {
    const result = await this.getDapi().invoke(params);
    return result.txid;
  }

  @Catch('handleError')
  async invokeMultiple(params: InvokeMultipleParams): Promise<string> {
    const result = await this.getDapi().invokeMulti(params);
    return result.txid;
  }

  @Catch('handleError')
  async signMessage({ withoutSalt, message }: SignMessageParams): Promise<SignMessageResult> {
    if (withoutSalt !== true) {
      const { salt, publicKey, signature } = await this.getDapi().signMessage({
        message,
      });
      return { message, salt, publicKey, signature };
    } else {
      const { publicKey, signature } = await this.getDapi().signMessageWithoutSalt({
        message,
      });
      return { message, publicKey, signature };
    }
  }

  @Catch('handleError')
  async signTransaction(params: SignTransactionParams): Promise<SignTransactionResult> {
    const result = await this.getDapi().signTransaction(params);
    return result;
  }

  @Catch('handleError')
  private getDapi() {
    if (this.dapi) {
      return this.dapi;
    }
    throw new Error('neo dapi is not inited');
  }

  protected async queryData(): Promise<ConnectorData> {
    const network = (await this.getDapi().getNetworks()).defaultNetwork;
    const address = (await this.getDapi().getAccount()).address;
    const version = (await this.getDapi().getProvider()).version;
    return {
      address,
      networkId: NETWORK_IDS[network] ?? null,
      version,
    };
  }

  protected handleError(error: any): never {
    let code = WalletError.Codes.UnknownError;
    switch (error.code) {
      case StandardErrorCodes.InvalidParams:
        code = WalletError.Codes.MalformedInput;
        break;
      case DapiErrorCodes.UnsupportedNetwork:
        code = WalletError.Codes.UnsupportedNetwork;
        break;
      case DapiErrorCodes.NoAccount:
        code = WalletError.Codes.NoAccount;
        break;
      case DapiErrorCodes.InsufficientFunds:
        code = WalletError.Codes.InsufficientFunds;
        break;
      case DapiErrorCodes.RemoteRpcError:
        code = WalletError.Codes.RemoteRpcError;
        break;
      case DapiErrorCodes.UserRejected:
        code = WalletError.Codes.UserRejected;
        break;
    }
    throw new WalletError(error.message, { cause: error, code });
  }
}
