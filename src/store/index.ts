import { configureStore } from '@reduxjs/toolkit';
import { invokeApi } from './apis/invoke';
import { invokeReadApi } from './apis/invokeRead';
import { authSlice } from './slices/auth';
import { errorsSlice } from './slices/errors';
import { uiSlice } from './slices/ui';
import { walletsSlice } from './slices/wallets';

export const store = configureStore({
  reducer: {
    [errorsSlice.name]: errorsSlice.reducer,
    [walletsSlice.name]: walletsSlice.reducer,
    [authSlice.name]: authSlice.reducer,
    [uiSlice.name]: uiSlice.reducer,
    [invokeReadApi.reducerPath]: invokeReadApi.reducer,
    [invokeApi.reducerPath]: invokeApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(invokeReadApi.middleware, invokeApi.middleware),
});

export type Store = typeof store;
export type Dispatch = Store['dispatch'];
export type GetState = Store['getState'];
export type State = ReturnType<GetState>;
