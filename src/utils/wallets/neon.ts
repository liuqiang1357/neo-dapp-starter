import { parse as parseScopes } from '@cityofzion/neon-core/lib/tx/components/WitnessScope';
import WcSdk from '@cityofzion/wallet-connect-sdk-core';
import SignClient from '@walletconnect/sign-client';
import { Catch } from 'catchee';
import { NEON_SIGN_CLIENT_OPTIONS } from 'utils/configs';
import { NetworkId, WalletName } from 'utils/enums';
import { TARGET_MAINNET } from 'utils/env';
import { WalletError } from 'utils/errors';
import { BaseWallet, QueryWalletStateResult } from './base';
import {
  InvokeParams,
  SignMessageParams,
  SignMessageResult,
  SignTransactionParams,
  SignTransactionResult,
} from './wallet';

const NETWORK_MAP: Record<string, NetworkId> = {
  'neo3:mainnet': NetworkId.MainNet,
  'neo3:testnet': NetworkId.TestNet,
};

class Neon extends BaseWallet {
  private wcSdk: WcSdk | null = null;

  constructor() {
    super(WalletName.Neon);
  }

  @Catch('handleError')
  async invoke(params: InvokeParams): Promise<string> {
    const result = await this.getWcSdk().invokeFunction({
      invocations: [
        {
          scriptHash: params.scriptHash,
          operation: params.operation,
          // TODO: convert args?
          args: (params.args as any[]) ?? [],
        },
      ],
      // TODO: cannot add duplicate cosigner
      signers: (params.signers ?? []).slice(0, 1).map(signer => ({
        account: signer.account,
        scopes: parseScopes(signer.scopes),
        allowedGroups: signer.allowedGroups,
        allowedContracts: signer.allowedContracts,
        // TODO: parse rules?
        rules: signer.rules,
      })),
    });
    return result;
  }

  @Catch('handleError')
  async signMessage({ message, withoutSalt }: SignMessageParams): Promise<SignMessageResult> {
    if (withoutSalt !== true) {
      const {
        salt,
        publicKey,
        data: signature,
      } = await this.getWcSdk().signMessage({ message, version: 1 });
      return { message, salt, publicKey, signature };
    } else {
      throw new Error('Parameter withoutSalt is not supported.');
    }
  }

  @Catch('handleError')
  async signTransaction(_params: SignTransactionParams): Promise<SignTransactionResult> {
    throw new Error('Method not implemented.');
  }

  handleError(error: any): never {
    const code = WalletError.Codes.UnknownError;
    // TODO: convert errors
    throw new WalletError(error.message, { cause: error, code });
  }

  // -------- protected methods --------

  protected async internalInit(): Promise<boolean> {
    this.wcSdk = new WcSdk(await SignClient.init(NEON_SIGN_CLIENT_OPTIONS));
    this.wcSdk.loadSession();
    return true;
  }

  protected canRestoreConnection(): boolean {
    return this.getWcSdk().isConnected() === true;
  }

  @Catch('handleError')
  protected async internalConnect(forceNewConnection: boolean): Promise<void> {
    if (forceNewConnection) {
      localStorage.removeItem('walletconnect');
    }
    if (!this.getWcSdk().isConnected()) {
      await this.getWcSdk().connect(TARGET_MAINNET ? 'neo3:mainnet' : 'neo3:testnet');
    }
  }

  @Catch('handleError')
  protected async internalDisconnect(): Promise<void> {
    await this.getWcSdk().disconnect();
    localStorage.removeItem('walletconnect');
  }

  @Catch('handleError')
  protected async queryWalletState(): Promise<QueryWalletStateResult> {
    const network = this.getWcSdk().getChainId();
    const address = this.getWcSdk().getAccountAddress();
    return {
      address: address,
      network: network != null ? NETWORK_MAP[network] : null,
      version: null,
    };
  }

  // -------- private methods --------

  private getWcSdk() {
    if (this.wcSdk) {
      return this.wcSdk;
    }
    throw new Error('wc sdk is not inited');
  }
}

export const wallet = new Neon();
