import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Users ----
export const getMe = () => api.get('/users/me').then(r => r.data);
export const updateMe = (data) => api.put('/users/me', data).then(r => r.data);

// ---- Event Types ----
export const getEventTypes = () => api.get('/event-types').then(r => r.data);
export const getEventType = (id) => api.get(`/event-types/${id}`).then(r => r.data);
export const createEventType = (data) => api.post('/event-types', data).then(r => r.data);
export const updateEventType = (id, data) => api.put(`/event-types/${id}`, data).then(r => r.data);
export const deleteEventType = (id) => api.delete(`/event-types/${id}`).then(r => r.data);
export const toggleEventType = (id) => api.patch(`/event-types/${id}/toggle`).then(r => r.data);

// ---- Availability ----
export const getAvailabilitySchedules = () => api.get('/availability').then(r => r.data);
export const getAvailabilitySchedule = (id) => api.get(`/availability/${id}`).then(r => r.data);
export const createAvailabilitySchedule = (data) => api.post('/availability', data).then(r => r.data);
export const updateAvailabilitySchedule = (id, data) => api.put(`/availability/${id}`, data).then(r => r.data);
export const deleteAvailabilitySchedule = (id) => api.delete(`/availability/${id}`).then(r => r.data);
export const addDateOverride = (scheduleId, data) => api.post(`/availability/${scheduleId}/overrides`, data).then(r => r.data);
export const deleteDateOverride = (id) => api.delete(`/availability/overrides/${id}`).then(r => r.data);

// ---- Bookings ----
export const getBookings = (params) => api.get('/bookings', { params }).then(r => r.data);
export const getBooking = (uid) => api.get(`/bookings/${uid}`).then(r => r.data);
export const cancelBooking = (uid, data) => api.patch(`/bookings/${uid}/cancel`, data).then(r => r.data);
export const rescheduleBooking = (uid, data) => api.patch(`/bookings/${uid}/reschedule`, data).then(r => r.data);

// ---- Public Booking ----
export const getUserProfile = (username) => api.get(`/public/${username}`).then(r => r.data);
export const getPublicEventInfo = (username, slug) => api.get(`/public/${username}/${slug}`).then(r => r.data);
export const getPublicSlots = (username, slug, date, timezone) => 
  api.get(`/public/${username}/${slug}/slots`, { params: { date, timezone } }).then(r => r.data);
export const createPublicBooking = (username, slug, data) => 
  api.post(`/public/${username}/${slug}/book`, data).then(r => r.data);

export default api;
