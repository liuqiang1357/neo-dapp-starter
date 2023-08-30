import { Catch } from 'catchee';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import o3dapiNeoN3 from 'o3-dapi-neo3';
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

const NETWORK_IDS: Partial<Record<string, NetworkId>> = {
  N3MainNet: NetworkId.MainNet,
  N3TestNet: NetworkId.TestNet,
};

export class O3Connector extends Connector {
  private neoDapi: any;
  private neoDapiN3: any;

  private connected = false;

  async init(): Promise<void> {
    o3dapi.initPlugins([o3dapiNeo, o3dapiNeoN3]);

    let neoDapiReady = false;
    let neoDapiN3Ready = false;
    const ready = await new Promise<boolean>(resolve => {
      o3dapi.NEO.addEventListener(o3dapi.NEO.Constants.EventName.READY, () => {
        neoDapiReady = true;
        if (neoDapiReady && neoDapiN3Ready) {
          resolve(true);
        }
      });
      o3dapi.NEO3.addEventListener(o3dapi.NEO3.Constants.EventName.READY, () => {
        neoDapiN3Ready = true;
        if (neoDapiReady && neoDapiN3Ready) {
          resolve(true);
        }
      });
      setTimeout(() => resolve(false), 5000);
    });

    if (ready) {
      this.neoDapi = o3dapi.NEO;
      this.neoDapiN3 = o3dapi.NEO3;
    }
  }

  async isReady(): Promise<boolean> {
    return this.neoDapi != null && this.neoDapiN3 != null;
  }

  async isAuthorized(): Promise<boolean> {
    return this.connected;
  }

  async connect(): Promise<ConnectorData> {
    await this.neoDapiN3.getAccount();
    this.connected = true;

    this.neoDapi.addEventListener(
      this.neoDapi.Constants.EventName.ACCOUNT_CHANGED,
      this.updateData,
    );
    this.neoDapi.addEventListener(
      this.neoDapi.Constants.EventName.NETWORK_CHANGED,
      this.updateData,
    );
    return this.queryData();
  }

  async disconnect(): Promise<void> {
    this.connected = false;

    this.neoDapi.removeEventListener(
      this.neoDapi.Constants.EventName.ACCOUNT_CHANGED,
      this.updateData,
    );
    this.neoDapi.removeEventListener(
      this.neoDapi.Constants.EventName.NETWORK_CHANGED,
      this.updateData,
    );
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<string> {
    const result = await this.neoDapiN3.invoke(params);
    return result.txid;
  }

  @Catch('handleError')
  async invokeMultiple(params: InvokeMultipleParams): Promise<string> {
    const result = await this.neoDapiN3.invokeMulti({
      invokeArgs: params.invocations,
      signers: params.signers,
    });
    return result.txid;
  }

  @Catch('handleError')
  async signMessage({ withoutSalt, message }: SignMessageParams): Promise<SignMessageResult> {
    if (withoutSalt !== true) {
      const { salt, publicKey, data: signature } = await this.neoDapiN3.signMessage({ message });
      return { message, salt, publicKey, signature };
    } else {
      throw new Error('Parameter withoutSalt is not supported.');
    }
  }

  @Catch('handleError')
  async signTransaction(_params: SignTransactionParams): Promise<SignTransactionResult> {
    throw new Error('Method not implemented.');
  }

  @Catch('handleError')
  protected async queryData(): Promise<ConnectorData> {
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
      networkId: NETWORK_IDS[network] ?? null,
      version,
    };
  }

  protected handleError(error: any): never {
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
}
