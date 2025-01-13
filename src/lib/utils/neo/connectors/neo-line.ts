import { Catch } from 'catchee';
import whenDomReady from 'when-dom-ready';
import { ChainId } from '@/configs/chains';
import {
  ConnectorCommunicationError,
  ConnectorNotInstalledError,
  InsufficientFundsError,
  InternalRpcError,
  InvalidParamsError,
  UnknownNeoError,
  UserRejectedRequestError,
} from '@/lib/errors/neo';
import { isAddress } from '../../misc';
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

const neoChainIds: Partial<Record<number, ChainId>> = {
  3: ChainId.Mainnet,
  6: ChainId.Testnet,
};

const neoLineChainIds: Record<ChainId, number> = {
  [ChainId.Mainnet]: 3,
  [ChainId.Testnet]: 6,
};

declare const window: Window & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NEOLine: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NEOLineN3: any;
};

export class NeoLineConnector extends Connector {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private neoDapi: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private neoDapiN3: any;

  @Catch('handleError')
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
      whenDomReady().then(() => setTimeout(() => resolve(false), 3000));
    });

    if (ready) {
      this.neoDapi = new window.NEOLine.Init();
      this.neoDapiN3 = new window.NEOLineN3.Init();
    }

    if (this.neoDapi != null) {
      this.neoDapi.addEventListener(this.neoDapi.EVENT.NETWORK_CHANGED, this.emitChange);
      this.neoDapi.addEventListener(this.neoDapi.EVENT.ACCOUNT_CHANGED, this.emitChange);
    }
  }

  @Catch('handleError')
  async destroy(): Promise<void> {
    if (this.neoDapi != null) {
      this.neoDapi.removeEventListener(this.neoDapi.EVENT.NETWORK_CHANGED, this.emitChange);
      this.neoDapi.removeEventListener(this.neoDapi.EVENT.ACCOUNT_CHANGED, this.emitChange);
    }
  }

  @Catch('handleError')
  async isIntalled(): Promise<boolean> {
    return this.neoDapi != null && this.neoDapiN3 != null;
  }

  @Catch('handleError')
  async getVersion(): Promise<string | null> {
    const version = (await this.neoDapiN3.getProvider()).version;
    return version;
  }

  @Catch('handleError')
  async getData(): Promise<ConnectorData> {
    const neoLineChainId = (await this.neoDapiN3.getNetworks()).chainId;
    const chainId = neoChainIds[neoLineChainId];

    let address: string | null = null;
    if (await this.isAuthorized()) {
      address = (await this.neoDapiN3.getAccount()).address;
    }

    return {
      chainId: chainId ?? null,
      account: address != null && isAddress(address) ? address : null,
    };
  }

  @Catch('handleError')
  async isAuthorized(): Promise<boolean> {
    return sessionStorage.getItem('neoLineAuthorized') === 'true';
  }

  @Catch('handleError')
  async connect(_params: ConnectParams): Promise<void> {
    await this.neoDapiN3.getAccount();
    sessionStorage.setItem('neoLineAuthorized', 'true');
  }

  @Catch('handleError')
  async disconnect(): Promise<void> {
    sessionStorage.removeItem('neoLineAuthorized');
  }

  @Catch('handleError')
  async switchChain(params: SwitchChainParams): Promise<void> {
    await this.neoDapiN3.switchWalletNetwork({ chainId: neoLineChainIds[params.chainId] });
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const result = await this.neoDapiN3.invoke(params);
    return {
      transactionHash: result.txid,
      signedTransaction:
        result.signedTx != null
          ? Buffer.from(result.signedTx, 'hex').toString('base64')
          : undefined,
    };
  }

  @Catch('handleError')
  async invokeMultiple(params: InvokeMultipleParams): Promise<InvokeMultipleResult> {
    const result = await this.neoDapiN3.invokeMultiple({
      invokeArgs: params.invocations,
      signers: params.signers,
    });
    return {
      transactionHash: result.txid,
      signedTransaction:
        result.signedTx != null
          ? Buffer.from(result.signedTx, 'hex').toString('base64')
          : undefined,
    };
  }

  protected handleError(error: unknown): never {
    if (error != null && typeof error === 'object' && 'type' in error) {
      const message =
        'message' in error && typeof error.message === 'string'
          ? error.message
          : 'description' in error && typeof error.description === 'string'
            ? error.description
            : 'Unknown wallet error.';

      const cause = new Error(message);

      switch (error.type) {
        case 'NO_PROVIDER':
          throw new ConnectorNotInstalledError(undefined, { cause });
        case 'CONNECTION_REFUSED':
          throw new ConnectorCommunicationError(undefined, { cause });
        case 'MALFORMED_INPUT':
          throw new InvalidParamsError(undefined, { cause });
        case 'INSUFFICIENT_FUNDS':
          throw new InsufficientFundsError(undefined, { cause });
        case 'RPC_ERROR':
          throw new InternalRpcError(message, { cause });
        case 'CONNECTION_DENIED':
          throw new UserRejectedRequestError(undefined, { cause });
        case 'CANCELED':
          throw new UserRejectedRequestError(undefined, { cause });
      }

      throw new UnknownNeoError(message, { cause });
    }
    throw error;
  }
}
