import { merge, pick } from 'lodash-es';
import { proxy, subscribe } from 'valtio';
import { SUPPORTED_NETWORK_IDS, SUPPORTED_WALLET_IDS } from 'utils/configs';
import { NetworkId, WalletId } from 'utils/models';

const SETTINGS_KEY = 'SETTINGS';

export const settingsState = proxy({
  local: {
    lastConnectedWalletId: null as WalletId | null,
    dappNetworkId: null as NetworkId | null,
  },
  session: {},
});

function syncLocalSettingsState() {
  const raw = localStorage.getItem(SETTINGS_KEY);

  const persisted = raw != null ? JSON.parse(raw) : {};
  if (!SUPPORTED_WALLET_IDS.includes(persisted.lastConnectedWalletId)) {
    delete persisted.lastConnectedWalletId;
  }
  if (!SUPPORTED_NETWORK_IDS.includes(persisted.dappNetworkId)) {
    persisted.dappNetworkId = SUPPORTED_NETWORK_IDS[0];
  }
  merge(settingsState.local, pick(persisted, Object.keys(settingsState.local)));

  return subscribe(settingsState.local, () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState.local));
  });
}

function syncSessionSettingsState() {
  const raw = sessionStorage.getItem(SETTINGS_KEY);

  const persisted = raw != null ? JSON.parse(raw) : {};
  merge(settingsState.session, pick(persisted, Object.keys(settingsState.session)));

  return subscribe(settingsState.session, () => {
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState.session));
  });
}

export function syncSettingsState(): () => void {
  const localDisposer = syncLocalSettingsState();
  const sessionDisposer = syncSessionSettingsState();

  return () => {
    localDisposer();
    sessionDisposer();
  };
}
