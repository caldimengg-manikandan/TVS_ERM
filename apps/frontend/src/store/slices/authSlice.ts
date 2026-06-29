import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '@tvs/shared';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiry: number | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionExpiry: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: UserProfile; accessToken: string; expiresIn: number }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.sessionExpiry = Date.now() + action.payload.expiresIn * 1000;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.sessionExpiry = null;
      state.error = null;
    },
    tokenRefreshed: (state, action: PayloadAction<{ accessToken: string; expiresIn: number }>) => {
      state.accessToken = action.payload.accessToken;
      state.sessionExpiry = Date.now() + action.payload.expiresIn * 1000;
    },
    updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, tokenRefreshed, updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;
