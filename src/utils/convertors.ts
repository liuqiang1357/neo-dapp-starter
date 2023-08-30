import {
  getAddressFromScriptHash,
  getScriptHashFromAddress,
} from '@cityofzion/neon-core/lib/wallet';
import { Signer } from '@neongd/neo-dapi';

export function addressToScriptHash(address: string): string {
  return `0x${getScriptHashFromAddress(address)}`;
}

export function scriptHashToAddress(hash: string): string {
  return getAddressFromScriptHash(hash.replace(/0x/, ''));
}

export function deserializeSigner(signer: any): Signer {
  return {
    account: signer.account,
    scopes: signer.scopes,
    allowedContracts: signer.allowedcontracts,
    allowedGroups: signer.allowedgroups,
    rules: signer.rules,
  };
}

export function serializeSigner(signer: Signer): any {
  return {
    account: signer.account,
    scopes: signer.scopes,
    allowedcontracts: signer.allowedContracts,
    allowedgroups: signer.allowedGroups,
    rules: signer.rules,
  };
}
