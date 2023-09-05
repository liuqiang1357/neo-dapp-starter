import { compareVersions } from 'compare-versions';
import { merge } from 'lodash-es';
import { proxy, subscribe } from 'valtio';
import { derive } from 'valtio/utils';
import { SUPPORTED_NETWORK_IDS, SUPPORTED_WALLET_IDS, WALLET_CONFIGS } from 'utils/configs';
import { Connector, ConnectorData } from 'utils/connectors/types';
import { WalletError } from 'utils/errors';
import { ConnectionData, NetworkId, WalletId } from 'utils/models';
import { CONNECTORS } from 'utils/web3';
import { settingsState } from './settings';

export const web3State = proxy({
  connectionDatas: SUPPORTED_WALLET_IDS.reduce(
    (acc, cur) => {
      acc[cur] = {
        walletId: cur,
        address: null,
        networkId: null,
        version: null,
        ready: null,
        connected: false,
      };
      return acc;
    },
    {} as Record<WalletId, ConnectionData>,
  ),

  derived: derive({
    lastConnectedWalletId: get => get(settingsState).local.lastConnectedWalletId,
    dappNetworkId: get => get(settingsState).local.dappNetworkId,
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
      return this.walletNetworkId;
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
  let disposed = false;
  const connectorDisposers: (() => void)[] = [];

  for (const walletId of SUPPORTED_WALLET_IDS) {
    (async () => {
      const connector = await CONNECTORS[walletId]();
      const connectionData = web3State.connectionDatas[walletId];

      if (disposed) {
        return;
      }
      const listener = (connectorData: ConnectorData) => merge(connectionData, connectorData);
      connector.on('change', listener);
      connectorDisposers.push(() => connector.off('change', listener));

      await connector.init();
      connectionData.ready = await connector.isReady();
      if (settingsState.local.lastConnectedWalletId === walletId) {
        if (await connector.isAuthorized()) {
          connect(walletId);
        }
      }
    })();
  }

  const networkIdDisposer = subscribe(web3State, () => {
    settingsState.local.dappNetworkId = web3State.networkId;
  });

  return () => {
    disposed = true;
    connectorDisposers.forEach(disposer => disposer());
    networkIdDisposer();
  };
}

export async function connect(walletId: WalletId): Promise<void> {
  const connector = await CONNECTORS[walletId]();
  const connectorData = await connector.connect({ networkId: web3State.networkId });
  merge(web3State.connectionDatas[walletId], { ...connectorData, connected: true });
  settingsState.local.lastConnectedWalletId = walletId;
}

export async function disconnect(): Promise<void> {
  if (web3State.walletId != null) {
    const connector = await CONNECTORS[web3State.walletId]();
    await connector.disconnect();
    web3State.connectionDatas[web3State.walletId].connected = false;
    settingsState.local.lastConnectedWalletId = null;
  }
}

interface EnsureWalletReadyParams {
  address?: string;
}

export async function ensureWalletReady({ address }: EnsureWalletReadyParams = {}): Promise<{
  connector: Connector;
  address: string;
}> {
  if (web3State.walletId == null && settingsState.local.lastConnectedWalletId != null) {
    await connect(settingsState.local.lastConnectedWalletId);
  }
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
  if (address != null && web3State.address !== address) {
    throw new WalletError('Wallet does not have an account.', {
      code: WalletError.Codes.MismatchedAccount,
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
  const connector = await CONNECTORS[web3State.walletId]();
  return { connector, address: web3State.address };
}

export async function switchNetwork(networkId: NetworkId): Promise<void> {
  if (web3State.walletId != null) {
    throw new WalletError('Switching network failed.', {
      code: WalletError.Codes.FailedToSwitchNetwork,
    });
  }
  settingsState.local.dappNetworkId = networkId;
}
