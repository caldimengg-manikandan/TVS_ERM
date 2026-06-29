import { createSlice } from '@reduxjs/toolkit';
export const projectSlice = createSlice({ name: 'projects', initialState: { filters: {}, selectedId: null as string | null }, reducers: { setSelectedProject: (state, action) => { state.selectedId = action.payload; }, setFilters: (state, action) => { state.filters = action.payload; } } });
export const { setSelectedProject, setFilters } = projectSlice.actions;
export default projectSlice.reducer;
