// dashboardSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardKPIs } from '@tvs/shared';

interface DashboardState { kpis: DashboardKPIs | null; isLoading: boolean; lastFetched: number | null; }
const initialState: DashboardState = { kpis: null, isLoading: false, lastFetched: null };
export const dashboardSlice = createSlice({
  name: 'dashboard', initialState,
  reducers: {
    setKPIs: (state, action: PayloadAction<DashboardKPIs>) => { state.kpis = action.payload; state.lastFetched = Date.now(); },
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
  },
});
export const { setKPIs, setLoading } = dashboardSlice.actions;
export default dashboardSlice.reducer;
