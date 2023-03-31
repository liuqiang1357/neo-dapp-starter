import { WalletName } from './enums';
import { WalletState } from './wallets/wallet';

export interface WalletInfo {
  name: WalletName;
  image: string;
  downloadUrl: string;
  minimumVersion: string;
  disabled?: boolean;
}

export interface ActiveWalletState extends WalletState {
  address: string;
}

export interface AuthState {
  address: string;
  token: string;
}
