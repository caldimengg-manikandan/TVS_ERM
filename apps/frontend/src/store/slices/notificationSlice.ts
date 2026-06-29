import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@tvs/shared';
export const notificationSlice = createSlice({ name: 'notifications', initialState: { notifications: [] as Notification[], unreadCount: 0 }, reducers: { setNotifications: (state, a: PayloadAction<Notification[]>) => { state.notifications = a.payload; }, addNotification: (state, a: PayloadAction<Notification>) => { state.notifications.unshift(a.payload); state.unreadCount += 1; }, setUnreadCount: (state, a: PayloadAction<number>) => { state.unreadCount = a.payload; }, markAllRead: (state) => { state.notifications.forEach(n => n.isRead = true); state.unreadCount = 0; } } });
export const { setNotifications, addNotification, setUnreadCount, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
