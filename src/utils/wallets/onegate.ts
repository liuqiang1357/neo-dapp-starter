import { StandardErrorCodes } from '@neongd/json-rpc';
import { BaseDapi, Dapi, DapiErrorCodes } from '@neongd/neo-dapi';
import { Provider } from '@neongd/neo-provider';
import { Catch } from 'catchee';
import { NetworkId, WalletName } from 'utils/enums';
import { WalletError } from 'utils/errors';
import { BaseWallet, QueryWalletStateResult } from './base';
import { InvokeParams, SignMessageParams, SignMessageResult } from './wallet';

declare const window: Window & {
  OneGate?: Provider;
};

const ONEGATE_WAS_CONNECTED = 'ONEGATE_WAS_CONNECTED';

const NETWORK_MAP: Record<string, NetworkId> = {
  MainNet: NetworkId.MainNet,
  TestNet: NetworkId.TestNet,
};

class OneGate extends BaseWallet {
  private dapi: Dapi | null = null;

  constructor() {
    super(WalletName.OneGate);
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<string> {
    const result = await this.getDapi().invoke(params);
    return result.txid;
  }

  @Catch('handleError')
  async signMessage({ message, withoutSalt }: SignMessageParams): Promise<SignMessageResult> {
    if (withoutSalt !== true) {
      const { salt, publicKey, signature } = await this.getDapi().signMessage({
        message: message,
      });
      return { message, salt, publicKey, signature };
    } else {
      const { publicKey, signature } = await this.getDapi().signMessageWithoutSalt({
        message: message,
      });
      return { message, publicKey, signature };
    }
  }

  handleError(error: any): never {
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

  // -------- protected methods --------

  protected async internalInit(): Promise<boolean> {
    const installed = window.OneGate != null;

    if (installed && window.OneGate) {
      this.dapi = new BaseDapi(window.OneGate);

      window.OneGate.on('accountChanged', this.updateWalletState);
      window.OneGate.on('networkChanged', this.updateWalletState);
    }
    return installed;
  }

  protected canRestoreConnection(): boolean {
    return localStorage.getItem(ONEGATE_WAS_CONNECTED) === 'true';
  }

  @Catch('handleError')
  protected async internalConnect(): Promise<void> {
    await this.getDapi().getAccount();
    localStorage.setItem(ONEGATE_WAS_CONNECTED, 'true');
  }

  protected async internalDisconnect(): Promise<void> {
    localStorage.removeItem(ONEGATE_WAS_CONNECTED);
  }

  @Catch('handleError')
  protected async queryWalletState(): Promise<QueryWalletStateResult> {
    const network = (await this.getDapi().getNetworks()).defaultNetwork;
    const address = (await this.getDapi().getAccount()).address;
    const version = (await this.getDapi().getProvider()).version;
    return {
      address,
      network: NETWORK_MAP[network],
      version,
    };
  }

  // -------- private methods --------

  private getDapi() {
    if (this.dapi != null) {
      return this.dapi;
    }
    throw new Error('neo dapi is not inited');
  }
}

export const wallet = new OneGate();
