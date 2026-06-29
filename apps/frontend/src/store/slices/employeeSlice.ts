import { createSlice } from '@reduxjs/toolkit';
export const employeeSlice = createSlice({ name: 'employees', initialState: { filters: {}, selectedId: null as string | null }, reducers: { setSelectedEmployee: (state, a) => { state.selectedId = a.payload; }, setFilters: (state, a) => { state.filters = a.payload; } } });
export const { setSelectedEmployee, setFilters } = employeeSlice.actions;
export default employeeSlice.reducer;
