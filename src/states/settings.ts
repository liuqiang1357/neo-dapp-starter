import { merge } from 'lodash-es';
import { proxy, subscribe } from 'valtio';
import { SUPPORTED_NETWORK_IDS, SUPPORTED_WALLET_IDS } from 'utils/configs';
import { WalletId } from 'utils/models';

const SETTINGS_KEY = 'SETTINGS';

export const settingsState = proxy({
  lastConnectedWalletId: null as WalletId | null,
  dappNetworkId: SUPPORTED_NETWORK_IDS[0],
});

export function syncSettingsState(): () => void {
  const raw = localStorage.getItem(SETTINGS_KEY);
  const persisted = raw != null ? JSON.parse(raw) : null;

  if (!SUPPORTED_WALLET_IDS.includes(persisted?.lastConnectedWalletId)) {
    delete persisted?.lastConnectedWalletId;
  }
  if (!SUPPORTED_NETWORK_IDS.includes(persisted?.dappNetworkId)) {
    delete persisted?.dappNetworkId;
  }
  merge(settingsState, persisted);

  return subscribe(settingsState, () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState));
  });
}
