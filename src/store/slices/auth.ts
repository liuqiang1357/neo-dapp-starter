import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State } from 'store';
import { createAsyncThunk } from 'utils/misc';
import { AuthState } from 'utils/types';

const CURRENT_AUTH_STATE = 'CURRENT_AUTH_STATE';

export const authSlice = createSlice({
  name: 'authSlice',
  initialState: {
    authState: null as AuthState | null,
    authStateLoaded: false,
  },
  reducers: {
    setAuthState: (state, action: PayloadAction<AuthState | null>) => {
      state.authState = action.payload;
    },
    setAuthStateLoaded: state => {
      state.authStateLoaded = true;
    },
  },
});

export const { setAuthState, setAuthStateLoaded } = authSlice.actions;

export const loadAuthState = createAsyncThunk('loadAuthState', async (arg, { dispatch }) => {
  const data = localStorage.getItem(CURRENT_AUTH_STATE);
  if (data != null) {
    const authState = JSON.parse(data);
    dispatch(setAuthState(authState));
  }
  dispatch(setAuthStateLoaded());
});

export const saveAuthState = createAsyncThunk<void, AuthState>(
  'saveAuthState',
  async (authState, { dispatch }) => {
    dispatch(setAuthState(authState));
    localStorage.setItem(CURRENT_AUTH_STATE, JSON.stringify(authState));
  },
);

export const clearAuthState = createAsyncThunk('clearAuthState', async (arg, { dispatch }) => {
  dispatch(setAuthState(null));
  localStorage.removeItem(CURRENT_AUTH_STATE);
});

export function selectCurrentAuthState(state: State): AuthState | null {
  return state.authSlice.authState;
}

export function selectAuthStateLoaded(state: State): boolean {
  return state.authSlice.authStateLoaded;
}
