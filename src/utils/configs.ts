import neoline from 'assets/images/wallets/neoline.png';
import neon from 'assets/images/wallets/neon.svg';
import o3 from 'assets/images/wallets/o3.png';
import onegate from 'assets/images/wallets/onegate.png';
import { NetworkId, WalletName } from './enums';
import { TARGET_PRODUCTION } from './env';
import { WalletInfo } from './types';

export const BACKEND_URL = TARGET_PRODUCTION
  ? 'https://localhost:8000' // TODO
  : 'https://localhost:8000'; // TODO

export const FURA_URL = TARGET_PRODUCTION
  ? 'https://neofura.ngd.network'
  : 'https://testmagnet.ngd.network';

export const NODE_URL = TARGET_PRODUCTION
  ? 'https://n3seed2.ngd.network:10332'
  : 'https://n3seed2.ngd.network:40332';

export const CORRECT_NETWORKS = [NetworkId.MainNet, NetworkId.TestNet];

export const WALLET_INFOS: Record<WalletName, WalletInfo> = {
  [WalletName.OneGate]: {
    name: WalletName.OneGate,
    image: onegate,
    downloadUrl: 'https://onegate.space',
    minimumVersion: '0.0.0',
  },
  [WalletName.NeoLine]: {
    name: WalletName.NeoLine,
    image: neoline,
    downloadUrl:
      'https://chrome.google.com/webstore/detail/neoline/cphhlgmgameodnhkjdmkpanlelnlohao',
    minimumVersion: '0.0.0',
  },
  [WalletName.O3]: {
    name: WalletName.O3,
    image: o3,
    downloadUrl: 'https://o3.network/#download',
    minimumVersion: '0.0.0',
  },
  [WalletName.Neon]: {
    name: WalletName.Neon,
    image: neon,
    downloadUrl: 'https://neonwallet.com',
    minimumVersion: '0.0.0',
  },
};

export const NEON_SIGN_CLIENT_OPTIONS = {
  projectId: '6fc6f515daaa4b001616766bc028bffa', // TODO
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'React App', // TODO
    description: 'Web site created using create-react-app', // TODO
    url: 'http://localhost:3000', // TODO
    icons: ['http://localhost:3000/favicon.ico'], // TODO
  },
};
