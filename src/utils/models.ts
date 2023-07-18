import { ConnectorData } from './connectors/types';

export enum NetworkId {
  TestNet = 'TestNet',
  MainNet = 'MainNet',
}

export interface NetworkConfig {
  name: string;
  nodeUrl: string;
  furaUrl: string;
}

export enum WalletId {
  OneGate = 'OneGate',
  NeoLine = 'NeoLine',
  O3 = 'O3',
  Neon = 'Neon',
}

export interface WalletConfig {
  name: string;
  icon: string;
  downloadUrl: string;
  minimumVersion: string;
}

export interface ConnectionData extends ConnectorData {
  walletId: WalletId;
  ready: boolean | null;
  connected: boolean;
}
