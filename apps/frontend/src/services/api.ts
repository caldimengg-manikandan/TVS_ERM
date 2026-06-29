import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import { tokenRefreshed, logout } from '../store/slices/authSlice';
import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: string) => void; reject: (reason?: unknown) => void }> = [];

let csrfTokenPromise: Promise<string> | null = null;
const fetchCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios.get(`${BASE_URL}/auth/csrf`, { withCredentials: true })
      .then(res => res.data.data.csrfToken)
      .catch(err => {
        csrfTokenPromise = null;
        throw err;
      });
  }
  return csrfTokenPromise;
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token ?? undefined));
  failedQueue = [];
};

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token and CSRF token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Attach CSRF token for mutating requests
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    try {
      const csrfToken = await fetchCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && 
        error.response?.data?.error === 'TOKEN_EXPIRED' &&
        !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken, expiresIn } = response.data.data;
        
        store.dispatch(tokenRefreshed({ accessToken, expiresIn }));
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for other errors
    const message = error.response?.data?.message || 'An error occurred';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ============================================
// API Functions
// ============================================
export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string; confirmPassword: string }) => api.post('/auth/reset-password', data),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => api.post('/auth/change-password', data),
  getProfile: () => api.get('/auth/profile'),
  getLoginHistory: () => api.get('/auth/login-history'),
};

export const dashboardApi = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getProjectProgress: () => api.get('/dashboard/project-progress'),
  getResourceUtilization: () => api.get('/dashboard/resource-utilization'),
  getMonthlyHours: () => api.get('/dashboard/monthly-hours'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getUpcomingDeadlines: () => api.get('/dashboard/upcoming-deadlines'),
};

export const employeesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post('/employees', data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getAvailability: (id: string, month: number, year: number) => api.get(`/employees/${id}/availability`, { params: { month, year } }),
  getSkillMatrix: (departmentId?: string) => api.get('/employees/skill-matrix', { params: { departmentId } }),
};

export const projectsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: unknown) => api.post('/projects', data),
  update: (id: string, data: unknown) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  archive: (id: string) => api.post(`/projects/${id}/archive`),
  clone: (id: string, data: unknown) => api.post(`/projects/${id}/clone`, data),
  addMember: (id: string, data: { employeeId: string; role: string }) => api.post(`/projects/${id}/members`, data),
  removeMember: (id: string, employeeId: string) => api.delete(`/projects/${id}/members/${employeeId}`),
};

export const resourcesApi = {
  getGrid: (params?: Record<string, unknown>) => api.get('/resources/grid', { params }),
  getUtilization: (month: number, year: number) => api.get('/resources/utilization', { params: { month, year } }),
  getEmployeeAllocations: (employeeId: string) => api.get(`/resources/employee/${employeeId}`),
  getProjectAllocations: (projectId: string) => api.get(`/resources/project/${projectId}`),
  allocate: (data: unknown) => api.post('/resources', data),
  bulkAllocate: (data: unknown) => api.post('/resources/bulk', data),
  update: (id: string, data: unknown) => api.put(`/resources/${id}`, data),
  cancel: (id: string) => api.delete(`/resources/${id}`),
};

export const tasksApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: unknown) => api.post('/tasks', data),
  update: (id: string, data: unknown) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: string, data: { status: string; completionPercentage?: number }) => api.patch(`/tasks/${id}/status`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const timesheetsApi = {
  getWeek: (weekStartDate: string) => api.get('/timesheets/week', { params: { weekStartDate } }),
  save: (data: unknown) => api.post('/timesheets', data),
  submit: (id: string) => api.post(`/timesheets/${id}/submit`),
  approve: (id: string, data: { action: 'APPROVE' | 'REJECT'; comments?: string }) => api.post(`/timesheets/${id}/approve`, data),
  getPending: () => api.get('/timesheets/pending'),
  copyPreviousWeek: (weekStartDate: string) => api.get('/timesheets/copy-previous', { params: { weekStartDate } }),
  getSummary: (month: number, year: number) => api.get('/timesheets/summary', { params: { month, year } }),
};

export const attendanceApi = {
  getToday: () => api.get('/attendance/today'),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getMonthly: (params?: Record<string, unknown>) => api.get('/attendance', { params }),
  manualEntry: (data: unknown) => api.post('/attendance/manual', data),
};

export const capacityApi = {
  getOverview: (params?: Record<string, unknown>) => api.get('/capacity/overview', { params }),
  getForecast: () => api.get('/capacity/forecast'),
};

export const reportsApi = {
  getResourceUtilization: (params?: Record<string, unknown>) => api.get('/reports/resource-utilization', { params }),
  getProjectProgress: () => api.get('/reports/project-progress'),
  getTimesheetSummary: (params?: Record<string, unknown>) => api.get('/reports/timesheet-summary', { params }),
};

export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const departmentsApi = {
  getAll: () => api.get('/departments'),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: unknown) => api.post('/departments', data),
  update: (id: string, data: unknown) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const auditApi = {
  getLogs: (params?: Record<string, unknown>) => api.get('/audit-logs', { params }),
};
