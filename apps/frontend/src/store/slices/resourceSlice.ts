import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export const resourceSlice = createSlice({ name: 'resources', initialState: { viewMonth: new Date().getMonth() + 1, viewYear: new Date().getFullYear(), filters: {} as Record<string, string> }, reducers: { setViewPeriod: (state, a: PayloadAction<{month: number; year: number}>) => { state.viewMonth = a.payload.month; state.viewYear = a.payload.year; }, setFilters: (state, a) => { state.filters = a.payload; } } });
export const { setViewPeriod, setFilters } = resourceSlice.actions;
export default resourceSlice.reducer;
