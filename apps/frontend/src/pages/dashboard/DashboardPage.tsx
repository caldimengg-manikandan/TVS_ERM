import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FolderKanban, Users, TrendingUp, AlertTriangle,
  Clock, CheckCircle, BarChart3, CalendarDays, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6'];

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: number;
  subtitle?: string;
  id?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, color, bgColor, trend, subtitle, id }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="kpi-card"
    id={id}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`kpi-card-icon ${bgColor}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {trend !== undefined && (
        <span className={`kpi-trend ${trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-label mt-1">{label}</div>
    {subtitle && <div className="text-2xs text-muted-foreground mt-0.5">{subtitle}</div>}
  </motion.div>
);

const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-48' }) => (
  <div className={`${height} shimmer rounded-lg`} />
);

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: kpisRes, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKPIs(),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: progressRes } = useQuery({
    queryKey: ['dashboard', 'project-progress'],
    queryFn: () => dashboardApi.getProjectProgress(),
  });

  const { data: utilizationRes } = useQuery({
    queryKey: ['dashboard', 'resource-utilization'],
    queryFn: () => dashboardApi.getResourceUtilization(),
  });

  const { data: monthlyRes } = useQuery({
    queryKey: ['dashboard', 'monthly-hours'],
    queryFn: () => dashboardApi.getMonthlyHours(),
  });

  const { data: activitiesRes } = useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(),
  });

  const { data: deadlinesRes } = useQuery({
    queryKey: ['dashboard', 'upcoming-deadlines'],
    queryFn: () => dashboardApi.getUpcomingDeadlines(),
  });

  const kpis = kpisRes?.data?.data;
  const progress = progressRes?.data?.data || [];
  const utilization = utilizationRes?.data?.data || [];
  const monthly = monthlyRes?.data?.data || [];
  const activities = activitiesRes?.data?.data || [];
  const deadlines = deadlinesRes?.data?.data;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-dropdown p-3 text-sm">
          <p className="font-medium text-primary mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}h</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary">
          {greeting()}, {user?.firstName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here's what's happening across your organization
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {kpisLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi-card shimmer h-28" />
          ))
        ) : (
          <>
            <KPICard id="kpi-active-projects" label="Active Projects" value={kpis?.activeProjects ?? 0}
              icon={FolderKanban} color="text-accent" bgColor="bg-accent/10" trend={5}
              subtitle={`${kpis?.totalProjects ?? 0} total`} />
            <KPICard id="kpi-employees" label="Total Employees" value={kpis?.totalEmployees ?? 0}
              icon={Users} color="text-success" bgColor="bg-success/10"
              subtitle="Active workforce" />
            <KPICard id="kpi-utilization" label="Avg Utilization" value={`${kpis?.resourceUtilization ?? 0}%`}
              icon={TrendingUp} color="text-purple-600" bgColor="bg-purple-100" trend={3}
              subtitle="Resource efficiency" />
            <KPICard id="kpi-delayed" label="Delayed Projects" value={kpis?.delayedProjects ?? 0}
              icon={AlertTriangle} color="text-danger" bgColor="bg-danger/10"
              subtitle="Needs attention" />
            <KPICard id="kpi-approvals" label="Pending Approvals" value={kpis?.pendingApprovals ?? 0}
              icon={Clock} color="text-warning" bgColor="bg-warning/10"
              subtitle="Timesheets awaiting" />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        {/* Monthly Hours Chart */}
        <div className="bg-white border border-border rounded-lg p-5 shadow-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Monthly Hours Trend</h2>
              <p className="text-xs text-muted-foreground">Planned vs Actual vs Overtime</p>
            </div>
          </div>
          {monthly.length === 0 ? (
            <ChartSkeleton height="h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="planned" name="Planned" stroke="#2563EB" fill="url(#gradPlanned)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#16A34A" fill="url(#gradActual)" strokeWidth={2} />
                <Area type="monotone" dataKey="overtime" name="Overtime" stroke="#F59E0B" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resource Utilization by Department */}
        <div className="bg-white border border-border rounded-lg p-5 shadow-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Utilization by Department</h2>
              <p className="text-xs text-muted-foreground">Allocated vs Available hours</p>
            </div>
          </div>
          {utilization.length === 0 ? (
            <ChartSkeleton height="h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={utilization} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="utilized" name="Utilized" fill="#2563EB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#E2E8F0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Project Progress */}
        <div className="xl:col-span-2 bg-white border border-border rounded-lg p-5 shadow-card">
          <div className="section-header">
            <h2 className="section-title">Active Project Progress</h2>
          </div>
          <div className="space-y-3">
            {progress.slice(0, 6).map((p: { projectName: string; actualProgress: number; plannedProgress: number; status: string }, idx: number) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary truncate max-w-[200px]">{p.projectName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">Plan: {p.plannedProgress}%</span>
                    <span className="text-xs font-semibold text-primary">{p.actualProgress}%</span>
                  </div>
                </div>
                <div className="relative h-5 bg-muted rounded overflow-hidden">
                  {/* Planned bar */}
                  <div
                    className="absolute h-full bg-border/80 rounded transition-all duration-500"
                    style={{ width: `${p.plannedProgress}%` }}
                  />
                  {/* Actual bar */}
                  <div
                    className={`absolute h-full rounded transition-all duration-700 ${
                      p.actualProgress >= p.plannedProgress ? 'bg-success/70' : 'bg-accent/70'
                    }`}
                    style={{ width: `${p.actualProgress}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs font-bold text-primary/60">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
            {progress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No active projects</div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white border border-border rounded-lg p-5 shadow-card">
          <div className="section-header">
            <h2 className="section-title">Upcoming Deadlines</h2>
            <span className="text-xs text-muted-foreground">Next 14 days</span>
          </div>
          <div className="space-y-2">
            {deadlines?.tasks?.slice(0, 6).map((task: { id: string; name: string; endDate: string; priority: string; project: { name: string }; status: string }, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  task.priority === 'CRITICAL' ? 'bg-danger' :
                  task.priority === 'HIGH' ? 'bg-warning' : 'bg-accent'
                }`} />
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-primary truncate">{task.name}</p>
                  <p className="text-2xs text-muted-foreground">{task.project?.name}</p>
                  <p className="text-2xs text-danger font-medium">
                    Due: {format(new Date(task.endDate), 'dd MMM')}
                  </p>
                </div>
              </div>
            ))}
            {(!deadlines?.tasks || deadlines.tasks.length === 0) && (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success/50" />
                No urgent deadlines!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-card">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <button className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {activities.slice(0, 8).map((activity: { id: string; action: string; entityName: string; description: string; createdAt: string; user: { firstName: string; lastName: string } }, idx: number) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 hover:bg-muted/30 rounded-md transition-colors">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-2xs font-bold">
                  {activity.user?.firstName?.[0]}{activity.user?.lastName?.[0]}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-primary leading-relaxed">{activity.description}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  {format(new Date(activity.createdAt), 'dd MMM, h:mm a')}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
