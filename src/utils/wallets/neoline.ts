import { wallet as neonWallet } from '@cityofzion/neon-js';
import { Catch } from 'catchee';
import { windowReady } from 'html-ready';
import { NetworkId, WalletName } from 'utils/enums';
import { TARGET_MAINNET } from 'utils/env';
import { WalletError } from 'utils/errors';
import { BaseWallet, QueryWalletStateResult } from './base';
import {
  InvokeParams,
  SignMessageParams,
  SignMessageResult,
  SignTransactionParams,
  SignTransactionResult,
} from './wallet';

const NEOLINE_WAS_CONNECTED = 'NEOLINE_WAS_CONNECTED';

const NETWORK_MAP: Record<string, NetworkId> = {
  N3MainNet: NetworkId.MainNet,
  N3TestNet: NetworkId.TestNet,
};

declare const window: Window & {
  NEOLine: any;
  NEOLineN3: any;
};

class NeoLine extends BaseWallet {
  private neoDapi: any;
  private neoDapiN3: any;

  constructor() {
    super(WalletName.NeoLine);
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
      magicNumber: TARGET_MAINNET ? 860833102 : 894710606,
    });
    const signatures = neonWallet.getSignaturesFromInvocationScript(
      result.witnesses[0].invocationScript,
    );
    const publicKey = neonWallet.getPublicKeyFromVerificationScript(
      result.witnesses[0].verificationScript,
    );
    return { signature: signatures[0], publicKey };
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
    const installed = await new Promise<boolean>(resolve => {
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

    if (installed) {
      this.neoDapi = new window.NEOLine.Init();
      this.neoDapiN3 = new window.NEOLineN3.Init();

      this.neoDapi.addEventListener(this.neoDapi.EVENT.ACCOUNT_CHANGED, this.updateWalletState);
      this.neoDapi.addEventListener(this.neoDapi.EVENT.NETWORK_CHANGED, this.updateWalletState);
    }
    return installed;
  }

  protected canRestoreConnection(): boolean {
    return sessionStorage.getItem(NEOLINE_WAS_CONNECTED) === 'true';
  }

  @Catch('handleError')
  protected async internalConnect(): Promise<void> {
    await this.neoDapiN3.getAccount();
    sessionStorage.setItem(NEOLINE_WAS_CONNECTED, 'true');
  }

  protected async internalDisconnect(): Promise<void> {
    sessionStorage.removeItem(NEOLINE_WAS_CONNECTED);
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

export const wallet = new NeoLine();
