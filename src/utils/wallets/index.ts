import { WalletName } from 'utils/enums';
import { Wallet } from './wallet';

const WALLETS = {
  [WalletName.OneGate]: () => import('./onegate'),
  [WalletName.NeoLine]: () => import('./neoline'),
  [WalletName.O3]: () => import('./o3'),
  [WalletName.Neon]: () => import('./neon'),
};

export async function getWallet(name: WalletName): Promise<Wallet> {
  return (await WALLETS[name]()).wallet;
}
