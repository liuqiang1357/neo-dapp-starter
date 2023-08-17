import {
  getAddressFromScriptHash,
  getScriptHashFromAddress,
} from '@cityofzion/neon-core/lib/wallet';

export function addressToScriptHash(address: string): string {
  return `0x${getScriptHashFromAddress(address)}`;
}

export function scriptHashToAddress(hash: string): string {
  return getAddressFromScriptHash(hash.replace(/0x/, ''));
}
