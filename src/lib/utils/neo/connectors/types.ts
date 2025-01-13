import { Argument, Invocation, Signer } from '@neongd/neo-dapi';
import EventEmitter from 'eventemitter3';
import { ChainId } from '@/configs/chains';

export type ConnectorData = {
  chainId: ChainId | null;
  account: string | null;
};

export type ConnectorEvents = {
  change(data: ConnectorData): void;
};

export type ConnectParams = {
  chainId?: ChainId;
};

export type SwitchChainParams = {
  chainId: ChainId;
};

export type InvokeParams = {
  scriptHash: string;
  operation: string;
  args?: Argument[];
  signers?: Signer[];
  broadcastOverride?: boolean;
};

export type InvokeResult = {
  transactionHash: string;
  signedTransaction?: string;
};

export type InvokeMultipleParams = {
  invocations: Invocation[];
  signers?: Signer[];
  broadcastOverride?: boolean;
};

export type InvokeMultipleResult = {
  transactionHash: string;
  signedTransaction?: string;
};

export abstract class Connector extends EventEmitter<ConnectorEvents> {
  abstract init(): Promise<void>;

  abstract destroy(): Promise<void>;

  abstract isIntalled(): Promise<boolean>;

  abstract getVersion(): Promise<string | null>;

  abstract getData(): Promise<ConnectorData>;

  abstract isAuthorized(): Promise<boolean>;

  abstract connect(params?: ConnectParams): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract switchChain(params: SwitchChainParams): Promise<void>;

  abstract invoke(params: InvokeParams): Promise<InvokeResult>;

  abstract invokeMultiple(params: InvokeMultipleParams): Promise<InvokeMultipleResult>;

  protected emitChange = async (): Promise<void> => {
    this.emit('change', await this.getData());
  };
}
