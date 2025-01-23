import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import neoLine from '@/assets/images/connectors/neo-line.png';
import oneGate from '@/assets/images/connectors/one-gate.png';

export enum ChainId {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export const supportedChainIds = [ChainId.Mainnet, ChainId.Testnet];

export const chainNames: Record<ChainId, string> = {
  [ChainId.Mainnet]: 'MainNet',
  [ChainId.Testnet]: 'TestNet',
};

export const rpcUrls: Record<ChainId, string> = {
  [ChainId.Mainnet]: 'https://n3seed2.ngd.network:10332',
  [ChainId.Testnet]: 'https://n3seed2.ngd.network:40332',
};

export const furaUrls: Record<ChainId, string> = {
  [ChainId.Mainnet]: 'https://neofura.ngd.network',
  [ChainId.Testnet]: 'https://testmagnet.ngd.network',
};

export enum ConnectorId {
  NeoLine = 'neo-line',
  OneGate = 'one-gate',
}

export const supportedConnectorIds = [ConnectorId.NeoLine, ConnectorId.OneGate];

export const connectorNames: Record<ConnectorId, string> = {
  [ConnectorId.NeoLine]: 'NeoLine',
  [ConnectorId.OneGate]: 'OneGate',
};

export const connectorIcons: Record<ConnectorId, string | StaticImport> = {
  [ConnectorId.NeoLine]: neoLine,
  [ConnectorId.OneGate]: oneGate,
};

export const connectorDownloadUrls: Record<ConnectorId, string> = {
  [ConnectorId.NeoLine]:
    'https://chrome.google.com/webstore/detail/neoline/cphhlgmgameodnhkjdmkpanlelnlohao',
  [ConnectorId.OneGate]: 'https://onegate.space',
};

export const connectorMinimumVersions: Record<ConnectorId, string> = {
  [ConnectorId.NeoLine]: '0.0.0',
  [ConnectorId.OneGate]: '0.0.0',
};
