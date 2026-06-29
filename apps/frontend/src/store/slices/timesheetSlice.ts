import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { format, startOfWeek } from 'date-fns';
export const timesheetSlice = createSlice({ name: 'timesheets', initialState: { currentWeekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), isDirty: false, lastSaved: null as string | null }, reducers: { setCurrentWeek: (state, a: PayloadAction<string>) => { state.currentWeekStart = a.payload; }, setDirty: (state, a: PayloadAction<boolean>) => { state.isDirty = a.payload; }, setLastSaved: (state, a: PayloadAction<string>) => { state.lastSaved = a.payload; } } });
export const { setCurrentWeek, setDirty, setLastSaved } = timesheetSlice.actions;
export default timesheetSlice.reducer;
