import { wallet } from '@cityofzion/neon-js';

export function isValidAddress(address: string): boolean {
  return wallet.isAddress(address, 53);
}
