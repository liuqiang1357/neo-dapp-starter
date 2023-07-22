import { compareVersions } from 'compare-versions';
import { proxy, subscribe } from 'valtio';
import { derive } from 'valtio/utils';
import { SUPPORTED_NETWORK_IDS, SUPPORTED_WALLET_IDS, WALLET_CONFIGS } from 'utils/configs';
import { Connector, ConnectorData } from 'utils/connectors/types';
import { WalletError } from 'utils/errors';
import { ConnectionData, NetworkId, WalletId } from 'utils/models';
import { CONNECTORS } from 'utils/web3';
import { settingsState } from './settings';

export const web3State = proxy({
  connectionDatas: SUPPORTED_WALLET_IDS.reduce((acc, cur) => {
    acc[cur] = {
      walletId: cur,
      address: null,
      networkId: null,
      version: null,
      ready: null,
      connected: false,
    };
    return acc;
  }, {} as Record<WalletId, ConnectionData>),

  derived: derive({
    lastConnectedWalletId: get => get(settingsState).lastConnectedWalletId,
    dappNetworkId: get => get(settingsState).dappNetworkId,
  }),

  get activeConnectionData() {
    return this.derived.lastConnectedWalletId != null &&
      this.connectionDatas[this.derived.lastConnectedWalletId].connected
      ? this.connectionDatas[this.derived.lastConnectedWalletId] ?? null
      : null;
  },

  get walletId() {
    return this.activeConnectionData?.walletId ?? null;
  },

  get walletNetworkId() {
    return this.activeConnectionData?.networkId ?? null;
  },

  get networkId() {
    if (this.walletNetworkId != null && SUPPORTED_NETWORK_IDS.includes(this.walletNetworkId)) {
      return this.walletNetworkId as NetworkId;
    } else {
      return this.derived.dappNetworkId;
    }
  },

  get address() {
    return this.activeConnectionData?.address ?? null;
  },

  get version() {
    return this.activeConnectionData?.version ?? null;
  },
});

export function syncWeb3State(): () => void {
  const connectorDisposers: (() => void)[] = [];

  for (const walletId of SUPPORTED_WALLET_IDS) {
    const connector = CONNECTORS[walletId];
    const connectionData = web3State.connectionDatas[walletId];

    const listener = (data: ConnectorData) => Object.assign(connectionData, data);
    connector.on('change', listener);
    connectorDisposers.push(() => connector.off('change', listener));

    connector.init().then(async () => {
      connectionData.ready = await connector.isReady();
      if (settingsState.lastConnectedWalletId === walletId) {
        if (await connector.isAuthorized()) {
          connect(walletId, web3State.networkId ?? undefined);
        }
      }
    });
  }

  const syncDappChainIdDisposer = subscribe(web3State, () => {
    settingsState.dappNetworkId = web3State.networkId;
  });

  return () => {
    connectorDisposers.forEach(disposer => disposer());
    syncDappChainIdDisposer();
  };
}

export async function connect(walletId: WalletId, networkId?: NetworkId): Promise<void> {
  const data = await CONNECTORS[walletId].connect({ networkId });
  Object.assign(web3State.connectionDatas[walletId], data, { connected: true });
  settingsState.lastConnectedWalletId = walletId;
}

export async function disconnect(): Promise<void> {
  if (web3State.walletId == null) {
    throw new WalletError('Wallet is not connected.', {
      code: WalletError.Codes.NotConnected,
    });
  }
  await CONNECTORS[web3State.walletId].disconnect();
  web3State.connectionDatas[web3State.walletId].connected = false;
  settingsState.lastConnectedWalletId = null;
}

export function getActiveConnector(): Connector {
  if (web3State.walletId == null) {
    throw new WalletError('Wallet is not connected.', {
      code: WalletError.Codes.NotConnected,
    });
  }
  if (web3State.walletNetworkId !== web3State.networkId) {
    throw new WalletError('Wallet is not in correct network.', {
      code: WalletError.Codes.IncorrectNetwork,
    });
  }
  if (web3State.address == null) {
    throw new WalletError('Wallet does not have an account.', {
      code: WalletError.Codes.NoAccount,
    });
  }
  if (
    web3State.version != null &&
    compareVersions(web3State.version, WALLET_CONFIGS[web3State.walletId].minimumVersion) < 0
  ) {
    throw new WalletError('Wallet version is not compatible.', {
      code: WalletError.Codes.IncompatibleVersion,
    });
  }
  return CONNECTORS[web3State.walletId];
}

export async function switchNetwork(networkId: NetworkId): Promise<void> {
  if (web3State.walletId != null) {
    throw new WalletError('Switching network failed.', {
      code: WalletError.Codes.FailedToSwitchNetwork,
    });
  }
  settingsState.dappNetworkId = networkId;
}
