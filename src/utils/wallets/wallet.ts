import { Argument, Attribute, Invocation, Signer } from '@neongd/neo-dapi';
import { NetworkId, WalletName } from 'utils/enums';

export interface WalletState {
  name: WalletName;
  installed: boolean;
  connected: boolean;
  address: string | null;
  network: NetworkId | null;
  version: string | null;
}

export interface InvokeParams {
  scriptHash: string;
  operation: string;
  args?: Argument[];
  signers?: Signer[];
}

export interface SignMessageParams {
  message: string;
  withoutSalt?: boolean;
}

export interface SignMessageResult {
  message: string;
  salt?: string;
  publicKey: string;
  signature: string;
}

export interface SignTransactionParams {
  version: number;
  nonce: number;
  systemFee: string;
  networkFee: string;
  validUntilBlock: number;
  script: string;
  invocations?: Invocation[];
  attributes?: Attribute[];
  signers?: Signer[];
}

export interface SignTransactionResult {
  signature: string;
  publicKey: string;
}

export interface Wallet {
  onWalletStateChange?: (state: WalletState) => void;

  init(restoreConnection: boolean): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  invoke(params: InvokeParams): Promise<string>;
  signMessage(params: SignMessageParams): Promise<SignMessageResult>;
  signTransaction(params: SignTransactionParams): Promise<SignTransactionResult>;

  handleError(error: any): never;
}
