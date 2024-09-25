import { Argument, Attribute, Invocation, Signer } from '@neongd/neo-dapi';
import EventEmitter from 'eventemitter3';
import { NetworkId } from 'utils/models';

export type ConnectParams = {
  networkId?: NetworkId;
};

export type InvokeParams = {
  scriptHash: string;
  operation: string;
  args?: Argument[];
  signers?: Signer[];
};

export type InvokeMultipleParams = {
  invocations: Invocation[];
  signers?: Signer[];
};

export type SignMessageParams = {
  version: number;
  message: string;
  withoutSalt?: boolean;
};

export type SignMessageResult = {
  message: string;
  salt?: string;
  publicKey: string;
  signature: string;
};

export type SignTransactionParams = {
  version: number;
  nonce: number;
  systemFee: string;
  networkFee: string;
  validUntilBlock: number;
  script: string;
  invocations?: Invocation[];
  attributes?: Attribute[];
  signers?: Signer[];
  network?: NetworkId;
};

export type SignTransactionResult = {
  signature: string;
  publicKey: string;
};

export type ConnectorData = {
  address: string | null;
  networkId: NetworkId | null;
  version: string | null;
};

export type ConnectorEvents = {
  change(data: ConnectorData): void;
};

export abstract class Connector extends EventEmitter<ConnectorEvents> {
  abstract init(): Promise<void>;

  abstract isReady(): Promise<boolean>;
  abstract isAuthorized(): Promise<boolean>;

  abstract connect(params?: ConnectParams): Promise<ConnectorData>;
  abstract disconnect(): Promise<void>;

  abstract invoke(params: InvokeParams): Promise<string>;
  abstract invokeMultiple(params: InvokeMultipleParams): Promise<string>;
  abstract signMessage(params: SignMessageParams): Promise<SignMessageResult>;
  abstract signTransaction(params: SignTransactionParams): Promise<SignTransactionResult>;

  protected abstract queryData(): Promise<ConnectorData>;

  protected updateData = async (): Promise<void> => {
    this.emit('change', await this.queryData());
  };
}
