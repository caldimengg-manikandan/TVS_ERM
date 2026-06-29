import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'sonner';
import { store, persistor } from './store';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectCreatePage = lazy(() => import('./pages/projects/ProjectCreatePage'));
const ProjectEditPage = lazy(() => import('./pages/projects/ProjectEditPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage'));
const EmployeeCreatePage = lazy(() => import('./pages/employees/EmployeeCreatePage'));
const EmployeeDetailPage = lazy(() => import('./pages/employees/EmployeeDetailPage'));
const ResourceAllocationPage = lazy(() => import('./pages/resources/ResourceAllocationPage'));
const CapacityPlanningPage = lazy(() => import('./pages/capacity/CapacityPlanningPage'));
const TimesheetPage = lazy(() => import('./pages/timesheets/TimesheetPage'));
const TimesheetApprovalsPage = lazy(() => import('./pages/timesheets/TimesheetApprovalsPage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const DepartmentsPage = lazy(() => import('./pages/admin/DepartmentsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,   // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Projects */}
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="projects/new" element={<ProjectCreatePage />} />
                    <Route path="projects/:id/edit" element={<ProjectEditPage />} />
                    <Route path="projects/:id" element={<ProjectDetailPage />} />

                    {/* Employees */}
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/employees/new" element={<EmployeeCreatePage />} />
                    <Route path="/employees/:id" element={<EmployeeDetailPage />} />

                    {/* Resources */}
                    <Route path="/resources" element={<ResourceAllocationPage />} />
                    <Route path="/capacity" element={<CapacityPlanningPage />} />

                    {/* Timesheets */}
                    <Route path="/timesheets" element={<TimesheetPage />} />
                    <Route path="/timesheets/approvals" element={<TimesheetApprovalsPage />} />

                    {/* Other modules */}
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/reports" element={<ReportsPage />} />

                    {/* Admin */}
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>

          <Toaster
            position="top-right"
            richColors
            expand
            visibleToasts={5}
            toastOptions={{
              classNames: {
                toast: 'font-sans text-sm shadow-dropdown',
                success: 'border-success/20 bg-success/5',
                error: 'border-danger/20 bg-danger/5',
              },
            }}
          />

          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
