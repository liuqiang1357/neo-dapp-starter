import { WalletName } from 'utils/enums';
import {
  InvokeParams,
  SignedMessage,
  SignedMessageWithoutSalt,
  Wallet,
  WalletState,
} from './wallet';

export type QueryWalletStateResult = Pick<WalletState, 'address' | 'network' | 'version'>;

export abstract class BaseWallet implements Wallet {
  private state: Readonly<WalletState>;

  constructor(protected name: WalletName) {
    this.state = {
      name,
      installed: false,
      connected: false,
      address: null,
      network: null,
      version: null,
    };
  }

  onWalletStateChange?: (state: WalletState) => void;

  async init(restoreConnection: boolean): Promise<void> {
    this.state = { ...this.state, installed: await this.internalInit() };
    this.onWalletStateChange?.(this.state);

    if (!this.state.installed) {
      return;
    }
    if (this.canRestoreConnection() && restoreConnection) {
      await this.connect(false);
    }
  }

  async connect(forceNewConnection = true): Promise<void> {
    if (this.state.connected) {
      await this.disconnect();
    }
    await this.internalConnect(forceNewConnection);
    this.state = { ...this.state, connected: true };

    await this.updateWalletState();
  }

  async disconnect(): Promise<void> {
    await this.internalDisconnect();
    this.state = {
      ...this.state,
      connected: false,
      address: null,
      network: null,
      version: null,
    };
    this.onWalletStateChange?.(this.state);
  }

  abstract invoke(params: InvokeParams): Promise<string>;

  abstract signMessage(message: string): Promise<SignedMessage>;

  abstract signMessageWithoutSalt(message: string): Promise<SignedMessageWithoutSalt>;

  abstract handleError(error: any): never;

  // -------- protected methods --------

  protected abstract internalInit(): Promise<boolean>;

  protected abstract canRestoreConnection(): boolean;

  protected abstract internalConnect(forceNewConnection: boolean): Promise<void>;

  protected abstract internalDisconnect(): Promise<void>;

  protected updateWalletState = async (): Promise<void> => {
    this.state = { ...this.state, ...(await this.queryWalletState()) };
    this.onWalletStateChange?.(this.state);
  };

  protected abstract queryWalletState(): Promise<QueryWalletStateResult>;
}
