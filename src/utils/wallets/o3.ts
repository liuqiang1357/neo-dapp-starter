import { Catch } from 'catchee';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import o3dapiNeoN3 from 'o3-dapi-neo3';
import { NetworkId, WalletName } from 'utils/enums';
import { WalletError } from 'utils/errors';
import { BaseWallet, QueryWalletStateResult } from './base';
import { InvokeParams, SignMessageParams, SignMessageResult } from './wallet';

const NETWORK_MAP: Record<string, NetworkId> = {
  N3MainNet: NetworkId.MainNet,
  N3TestNet: NetworkId.TestNet,
};

class O3 extends BaseWallet {
  private neoDapi: any;
  private neoDapiN3: any;

  constructor() {
    super(WalletName.O3);
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<string> {
    const result = await this.neoDapiN3.invoke(params);
    return result.txid;
  }

  @Catch('handleError')
  async signMessage({ message, withoutSalt }: SignMessageParams): Promise<SignMessageResult> {
    if (withoutSalt !== true) {
      const { salt, publicKey, data: signature } = await this.neoDapiN3.signMessage({ message });
      return { message, salt, publicKey, signature };
    } else {
      throw new Error('Parameter withoutSalt is not supported.');
    }
  }

  handleError(error: any): never {
    let code = WalletError.Codes.UnknownError;
    switch (error.type) {
      case 'NO_PROVIDER':
        code = WalletError.Codes.NotInstalled;
        break;
      case 'CONNECTION_DENIED':
        code = WalletError.Codes.UserRejected;
        break;
      case 'CONNECTION_REFUSED':
        code = WalletError.Codes.CommunicateFailed;
        break;
      case 'RPC_ERROR':
        code = WalletError.Codes.RemoteRpcError;
        break;
      case 'MALFORMED_INPUT':
        code = WalletError.Codes.MalformedInput;
        break;
      case 'CANCELED':
        code = WalletError.Codes.UserRejected;
        break;
      case 'INSUFFICIENT_FUNDS':
        code = WalletError.Codes.InsufficientFunds;
        break;
    }
    throw new WalletError(error.message ?? error.description, { cause: error, code });
  }

  // -------- protected methods --------

  protected async internalInit(): Promise<boolean> {
    o3dapi.initPlugins([o3dapiNeo, o3dapiNeoN3]);

    this.neoDapi = o3dapi.NEO;
    this.neoDapiN3 = o3dapi.NEO3;

    let neoDapiReady = false;
    let neoDapiN3Ready = false;

    const installed = await new Promise<boolean>(resolve => {
      this.neoDapi.addEventListener(this.neoDapi.Constants.EventName.READY, () => {
        neoDapiReady = true;
        if (neoDapiReady && neoDapiN3Ready) {
          resolve(true);
        }
      });
      this.neoDapiN3.addEventListener(this.neoDapi.Constants.EventName.READY, () => {
        neoDapiN3Ready = true;
        if (neoDapiReady && neoDapiN3Ready) {
          resolve(true);
        }
      });
      setTimeout(() => resolve(false), 5000);
    });

    if (installed) {
      this.neoDapi.addEventListener(
        this.neoDapi.Constants.EventName.ACCOUNT_CHANGED,
        this.updateWalletState,
      );
      this.neoDapi.addEventListener(
        this.neoDapi.Constants.EventName.NETWORK_CHANGED,
        this.updateWalletState,
      );
    }
    return installed;
  }

  protected canRestoreConnection(): boolean {
    return false;
  }

  @Catch('handleError')
  protected async internalConnect(): Promise<void> {
    await this.neoDapiN3.getAccount();
  }

  protected async internalDisconnect(): Promise<void> {
    // noop
  }

  @Catch('handleError')
  protected async queryWalletState(): Promise<QueryWalletStateResult> {
    const network = (await this.neoDapi.getNetworks()).defaultNetwork;
    let address;
    if (network === 'MainNet' || network === 'TestNet') {
      address = (await this.neoDapi.getAccount()).address;
    } else {
      address = (await this.neoDapiN3.getAccount()).address;
    }
    const version = (await this.neoDapi.getProvider()).version;
    return {
      address,
      network: NETWORK_MAP[network],
      version,
    };
  }
}

export const wallet = new O3();
