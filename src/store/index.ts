import { configureStore } from '@reduxjs/toolkit';
import vehicleReducer from './vehicleSlice';

export const store = configureStore({
  reducer: {
    vehicles: vehicleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
