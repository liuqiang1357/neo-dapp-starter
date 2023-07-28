import neoline from 'assets/images/wallets/neoline.png';
import neon from 'assets/images/wallets/neon.svg';
import o3 from 'assets/images/wallets/o3.png';
import onegate from 'assets/images/wallets/onegate.png';
import { NetworkConfig, NetworkId, WalletConfig, WalletId } from './models';

// Network configs
export const SUPPORTED_NETWORK_IDS = [NetworkId.MainNet, NetworkId.TestNet];

export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  [NetworkId.MainNet]: {
    name: 'MainNet',
    nodeUrl: 'https://n3seed2.ngd.network:10332',
    furaUrl: 'https://neofura.ngd.network',
  },
  [NetworkId.TestNet]: {
    name: 'TestNet',
    nodeUrl: 'https://n3seed2.ngd.network:40332',
    furaUrl: 'https://testmagnet.ngd.network',
  },
};

// Wallet configs
export const SUPPORTED_WALLET_IDS = [
  WalletId.OneGate,
  WalletId.NeoLine,
  WalletId.O3,
  WalletId.Neon,
];

export const WALLET_CONFIGS: Record<WalletId, WalletConfig> = {
  [WalletId.OneGate]: {
    name: WalletId.OneGate,
    icon: onegate,
    downloadUrl: 'https://onegate.space',
    minimumVersion: '0.0.0',
  },
  [WalletId.NeoLine]: {
    name: WalletId.NeoLine,
    icon: neoline,
    downloadUrl:
      'https://chrome.google.com/webstore/detail/neoline/cphhlgmgameodnhkjdmkpanlelnlohao',
    minimumVersion: '0.0.0',
  },
  [WalletId.O3]: {
    name: WalletId.O3,
    icon: o3,
    downloadUrl: 'https://o3.network/#download',
    minimumVersion: '0.0.0',
  },
  [WalletId.Neon]: {
    name: WalletId.Neon,
    icon: neon,
    downloadUrl: 'https://neonwallet.com',
    minimumVersion: '0.0.0',
  },
};
