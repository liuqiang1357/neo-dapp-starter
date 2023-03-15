import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { compareVersions } from 'compare-versions';
import i18n from 'i18next';
import pDefer from 'p-defer';
import { State } from 'store';
import { CORRECT_NETWORKS, WALLET_INFOS } from 'utils/configs';
import { WalletName } from 'utils/enums';
import { WalletError } from 'utils/errors';
import { formatEnum } from 'utils/formatters';
import { createAsyncThunk } from 'utils/misc';
import { ActiveWalletState } from 'utils/models';
import { parseEnum } from 'utils/parsers';
import { getWallet } from 'utils/wallets';
import { WalletState } from 'utils/wallets/wallet';

const LAST_CONNECTED_WALLET_NAME = 'LAST_CONNECTED_WALLET_NAME';

export const walletsSlice = createSlice({
  name: 'walletsSlice',
  initialState: {
    walletStates: {} as Record<WalletName, WalletState>,
    lastConnectedWalletName: null as WalletName | null,
  },
  reducers: {
    setWalletState: (state, action: PayloadAction<WalletState>) => {
      state.walletStates[action.payload.name] = action.payload;
    },
    setLastConnectedWalletName: (state, action: PayloadAction<WalletName | null>) => {
      state.lastConnectedWalletName = action.payload;
    },
  },
});

export const { setWalletState, setLastConnectedWalletName } = walletsSlice.actions;

const deferred = pDefer();
let inited = false;

export const initWallets = createAsyncThunk('initWallets', async (args, { dispatch, getState }) => {
  try {
    if (inited) {
      return deferred.promise;
    }
    inited = true;
    await dispatch(loadLastConnectedWalletName()).unwrap();
    const lastConnectedWalletName = selectLastConnectedWalletName(getState() as State);
    await Promise.all(
      Object.values(WALLET_INFOS)
        .filter(info => info.disabled !== true)
        .map(async info => {
          const wallet = await getWallet(info.name);
          wallet.onWalletStateChange = walletState => dispatch(setWalletState(walletState));
          await wallet.init(lastConnectedWalletName === info.name);
        }),
    );
  } finally {
    deferred.resolve();
  }
});

export const ensureWalletReady = createAsyncThunk(
  'ensureWalletReady',
  async (args, { getState }) => {
    await deferred.promise;
    const walletState = selectLastConnectedWalletState(getState() as State);
    if (walletState == null || !walletState.connected) {
      throw new WalletError('Wallet is not connected.', {
        code: WalletError.Codes.NotConnected,
      });
    }
    if (walletState.network == null || !CORRECT_NETWORKS.includes(walletState.network)) {
      throw new WalletError('Wallet is not in correct network.', {
        code: WalletError.Codes.IncorrectNetwork,
        data: {
          walletName: walletState.name,
          walletNetwork: CORRECT_NETWORKS.map(networkId =>
            formatEnum('WalletNetwork', [walletState.name, networkId]),
          ).join(i18n.t('parts.or') ?? ', '),
        },
      });
    }
    if (
      walletState.version != null &&
      compareVersions(walletState.version, WALLET_INFOS[walletState.name].minimumVersion) < 0
    ) {
      throw new WalletError('Wallet version is not compatible.', {
        code: WalletError.Codes.VerionNotCompatible,
      });
    }
    if (walletState.address == null) {
      throw new WalletError('No account.', {
        code: WalletError.Codes.NoAccount,
      });
    }
    return {
      walletState: walletState as ActiveWalletState,
      wallet: await getWallet(walletState.name),
    };
  },
);

export const connectWallet = createAsyncThunk<void, WalletName>(
  'connectWallet',
  async (walletName, { dispatch }) => {
    const wallet = await getWallet(walletName);
    await wallet.connect();
    await dispatch(saveLastConnectedWalletName(walletName)).unwrap();
  },
);

export const disconnectWallet = createAsyncThunk<void, WalletName>(
  'disconnectWallet',
  async (walletName, { dispatch }) => {
    const wallet = await getWallet(walletName);
    await wallet.disconnect();
    await dispatch(clearLastConnectedWalletName()).unwrap();
  },
);

export const loadLastConnectedWalletName = createAsyncThunk(
  'loadLastConnectedWalletName',
  async (args, { dispatch }) => {
    const data = localStorage.getItem(LAST_CONNECTED_WALLET_NAME);
    if (data != null) {
      const walletName = parseEnum(WalletName, data);
      if (walletName != null) {
        dispatch(setLastConnectedWalletName(walletName));
      }
    }
  },
);

export const saveLastConnectedWalletName = createAsyncThunk<void, WalletName>(
  'saveLastConnectedWalletName',
  async (walletName, { dispatch }) => {
    dispatch(setLastConnectedWalletName(walletName));
    localStorage.setItem(LAST_CONNECTED_WALLET_NAME, walletName);
  },
);

export const clearLastConnectedWalletName = createAsyncThunk(
  'clearLastConnectedWalletName',
  async (args, { dispatch }) => {
    dispatch(setLastConnectedWalletName(null));
    localStorage.removeItem(LAST_CONNECTED_WALLET_NAME);
  },
);

export function selectWalletStates(state: State): Record<WalletName, WalletState> {
  return state.walletsSlice.walletStates;
}

export function selectWalletState(
  state: State,
  { walletName }: { walletName: WalletName },
): WalletState | null {
  const walletStates = selectWalletStates(state);
  return walletStates[walletName];
}

export function selectLastConnectedWalletName(state: State): WalletName | null {
  return state.walletsSlice.lastConnectedWalletName;
}

export function selectLastConnectedWalletState(state: State): WalletState | null {
  const walletName = selectLastConnectedWalletName(state);
  return walletName != null ? selectWalletState(state, { walletName }) : null;
}

export function selectActiveWalletState(state: State): ActiveWalletState | null {
  const walletState = selectLastConnectedWalletState(state);
  if (walletState && walletState.address != null) {
    return walletState as ActiveWalletState;
  }
  return null;
}
