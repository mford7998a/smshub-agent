import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import modemsReducer from './slices/modemsSlice';
import activationsReducer from './slices/activationsSlice';
import smsReducer from './slices/smsSlice';
import metricsReducer from './slices/metricsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    modems: modemsReducer,
    activations: activationsReducer,
    sms: smsReducer,
    metrics: metricsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 