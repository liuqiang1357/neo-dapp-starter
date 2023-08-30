import { parse as parseScopes } from '@cityofzion/neon-core/lib/tx/components/WitnessScope';
import WcSdk, { NetworkType } from '@cityofzion/wallet-connect-sdk-core';
import SignClient from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';
import { Catch } from 'catchee';
import { WalletError } from 'utils/errors';
import { NetworkId } from 'utils/models';
import {
  Connector,
  ConnectorData,
  ConnectParams,
  InvokeMultipleParams,
  InvokeParams,
  SignMessageParams,
  SignMessageResult,
  SignTransactionParams,
  SignTransactionResult,
} from './types';

const NETWORK_IDS: Partial<Record<string, NetworkId>> = {
  'neo3:mainnet': NetworkId.MainNet,
  'neo3:testnet': NetworkId.TestNet,
};

const WALLET_NETWORKS: Record<NetworkId, NetworkType> = {
  [NetworkId.MainNet]: 'neo3:mainnet',
  [NetworkId.TestNet]: 'neo3:testnet',
};

export interface NeonConnectorOptions {
  signClientOptions: SignClientTypes.Options;
}

export class NeonConnector extends Connector {
  private wcSdk: WcSdk | null = null;

  constructor(private options: NeonConnectorOptions) {
    super();
  }

  async init(): Promise<void> {
    this.wcSdk = new WcSdk(await SignClient.init(this.options.signClientOptions));
    this.wcSdk.loadSession();
  }

  async isReady(): Promise<boolean> {
    return this.wcSdk != null;
  }

  async isAuthorized(): Promise<boolean> {
    return this.getWcSdk().isConnected() === true;
  }

  @Catch('handleError')
  async connect(params: ConnectParams = {}): Promise<ConnectorData> {
    if (!this.getWcSdk().isConnected()) {
      await this.getWcSdk().connect(WALLET_NETWORKS[params.networkId ?? NetworkId.MainNet], []);
    }
    return this.queryData();
  }

  async disconnect(): Promise<void> {
    await this.getWcSdk().disconnect();
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
  async invokeMultiple(params: InvokeMultipleParams): Promise<string> {
    const result = await this.getWcSdk().invokeFunction({
      invocations: params.invocations.map(invocaction => ({
        scriptHash: invocaction.scriptHash,
        operation: invocaction.operation,
        // TODO: convert args?
        args: (invocaction.args as any[]) ?? [],
      })),
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
  async signMessage({ withoutSalt, message }: SignMessageParams): Promise<SignMessageResult> {
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

  @Catch('handleError')
  protected async queryData(): Promise<ConnectorData> {
    const network = this.getWcSdk().getChainId();
    const address = this.getWcSdk().getAccountAddress();
    return {
      address: address,
      networkId: network != null ? NETWORK_IDS[network] ?? null : null,
      version: null,
    };
  }

  private getWcSdk() {
    if (this.wcSdk) {
      return this.wcSdk;
    }
    throw new Error('wc sdk is not inited');
  }

  protected handleError(error: any): never {
    const code = WalletError.Codes.UnknownError;
    // TODO: convert errors
    throw new WalletError(error.message, { cause: error, code });
  }
}
