import { ConnectorId } from '@/configs/chains';
import { NeoLineConnector } from './neo-line';
import { OneGateConnector } from './one-gate';
import { Connector } from './types';

export const connectors: Record<ConnectorId, Connector> = {
  [ConnectorId.NeoLine]: new NeoLineConnector(),
  [ConnectorId.OneGate]: new OneGateConnector(),
};
