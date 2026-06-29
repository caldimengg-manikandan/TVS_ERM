import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import dashboardReducer from './slices/dashboardSlice';
import projectReducer from './slices/projectSlice';
import employeeReducer from './slices/employeeSlice';
import resourceReducer from './slices/resourceSlice';
import timesheetReducer from './slices/timesheetSlice';
import notificationReducer from './slices/notificationSlice';

// Persist configuration
const persistConfig = {
  key: 'tvs-erm',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI state
};

const uiPersistConfig = {
  key: 'tvs-erm-ui',
  storage,
  whitelist: ['sidebarCollapsed', 'theme'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
  dashboard: dashboardReducer,
  projects: projectReducer,
  employees: employeeReducer,
  resources: resourceReducer,
  timesheets: timesheetReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
