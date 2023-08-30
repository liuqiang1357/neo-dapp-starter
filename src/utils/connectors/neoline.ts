import {
  getPublicKeyFromVerificationScript,
  getSignaturesFromInvocationScript,
} from '@cityofzion/neon-core/lib/wallet';
import { Catch } from 'catchee';
import { windowReady } from 'html-ready';
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

const NEOLINE_CONNECTED = 'NEOLINE_CONNECTED';

const NETWORK_IDS: Partial<Record<string, NetworkId>> = {
  N3MainNet: NetworkId.MainNet,
  N3TestNet: NetworkId.TestNet,
};

const MAGIC_NUMBERS: Record<NetworkId, number> = {
  [NetworkId.MainNet]: 860833102,
  [NetworkId.TestNet]: 894710606,
};

declare const window: Window & {
  NEOLine: any;
  NEOLineN3: any;
};

export class NeoLineConnector extends Connector {
  private neoDapi: any;
  private neoDapiN3: any;

  async init(): Promise<void> {
    const ready = await new Promise<boolean>(resolve => {
      const checkReady = () => {
        if (window.NEOLine != null && window.NEOLineN3 != null) {
          resolve(true);
        }
      };
      window.addEventListener('NEOLine.NEO.EVENT.READY', checkReady);
      window.addEventListener('NEOLine.N3.EVENT.READY', checkReady);
      checkReady();
      windowReady.then(() => setTimeout(() => resolve(false), 3000));
    });

    if (ready) {
      this.neoDapi = new window.NEOLine.Init();
      this.neoDapiN3 = new window.NEOLineN3.Init();
    }
  }

  async isReady(): Promise<boolean> {
    return this.neoDapi != null && this.neoDapiN3 != null;
  }

  async isAuthorized(): Promise<boolean> {
    return sessionStorage.getItem(NEOLINE_CONNECTED) === 'true';
  }

  @Catch('handleError')
  async connect(): Promise<ConnectorData> {
    await this.neoDapiN3.getAccount();
    sessionStorage.setItem(NEOLINE_CONNECTED, 'true');

    this.neoDapi.addEventListener(this.neoDapi.EVENT.ACCOUNT_CHANGED, this.updateData);
    this.neoDapi.addEventListener(this.neoDapi.EVENT.NETWORK_CHANGED, this.updateData);

    return this.queryData();
  }

  async disconnect(): Promise<void> {
    this.neoDapi.removeEventListener(this.neoDapi.EVENT.ACCOUNT_CHANGED, this.updateData);
    this.neoDapi.removeEventListener(this.neoDapi.EVENT.NETWORK_CHANGED, this.updateData);

    sessionStorage.removeItem(NEOLINE_CONNECTED);
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<string> {
    const result = await this.neoDapiN3.invoke(params);
    return result.txid;
  }

  @Catch('handleError')
  async invokeMultiple(params: InvokeMultipleParams): Promise<string> {
    const result = await this.neoDapiN3.invokeMultiple({
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
      const { publicKey, data: signature } = await this.neoDapiN3.signMessageWithoutSalt({
        message,
      });
      return { message, publicKey, signature };
    }
  }

  @Catch('handleError')
  async signTransaction(params: SignTransactionParams): Promise<SignTransactionResult> {
    const result = await this.neoDapiN3.signTransaction({
      transaction: {
        version: params.version,
        nonce: params.nonce,
        systemFee: params.systemFee,
        networkFee: params.networkFee,
        validUntilBlock: params.validUntilBlock,
        attributes: params.attributes,
        signers: params.signers,
        script: params.script,
      },
      magicNumber: MAGIC_NUMBERS[params.network ?? NetworkId.MainNet],
    });
    const signatures = getSignaturesFromInvocationScript(result.witnesses[0].invocationScript);
    const publicKey = getPublicKeyFromVerificationScript(result.witnesses[0].verificationScript);
    return { signature: signatures[0], publicKey };
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
