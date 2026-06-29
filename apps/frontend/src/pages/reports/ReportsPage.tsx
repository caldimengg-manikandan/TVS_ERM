import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { reportsApi } from '../../services/api';
import { Download, BarChart3, Users, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ReportsPage: React.FC = () => {
  const now = new Date();
  const [activeReport, setActiveReport] = useState<'utilization' | 'progress' | 'timesheet'>('utilization');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: utilRes } = useQuery({
    queryKey: ['reports', 'utilization', { month, year }],
    queryFn: () => reportsApi.getResourceUtilization({ month, year }),
  });

  const { data: progressRes } = useQuery({
    queryKey: ['reports', 'progress'],
    queryFn: () => reportsApi.getProjectProgress(),
  });

  const { data: timesheetRes } = useQuery({
    queryKey: ['reports', 'timesheet', { month, year }],
    queryFn: () => reportsApi.getTimesheetSummary({ month, year }),
  });

  const utilizationData = utilRes?.data?.data?.data || [];
  const progressData = progressRes?.data?.data?.data || [];
  const timesheetData = timesheetRes?.data?.data;

  const navMonth = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const tabs = [
    { key: 'utilization', label: 'Resource Utilization', icon: Users },
    { key: 'progress', label: 'Project Progress', icon: TrendingUp },
    { key: 'timesheet', label: 'Timesheet Summary', icon: Clock },
  ];

  const pieData = timesheetData ? [
    { name: 'Approved', value: timesheetData.summary?.approved || 0, fill: '#16A34A' },
    { name: 'TL Approved', value: timesheetData.summary?.tlApproved || 0, fill: '#8B5CF6' },
    { name: 'Submitted', value: timesheetData.summary?.submitted || 0, fill: '#2563EB' },
    { name: 'Rejected', value: timesheetData.summary?.rejected || 0, fill: '#DC2626' },
    { name: 'Draft', value: timesheetData.summary?.draft || 0, fill: '#94A3B8' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Organization-wide performance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-border rounded-md px-2">
            <button onClick={() => navMonth(-1)} className="w-7 h-7 flex items-center justify-center hover:text-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium w-24 text-center">{MONTHS[month-1]} {year}</span>
            <button onClick={() => navMonth(1)} className="w-7 h-7 flex items-center justify-center hover:text-accent transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key as typeof activeReport)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeReport === tab.key ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resource Utilization Report */}
      {activeReport === 'utilization' && (
        <div className="space-y-5">
          {/* Chart */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="section-title mb-4">Employee Utilization Rate — {MONTHS[month-1]} {year}</h3>
            {utilizationData.length === 0 ? (
              <div className="h-48 shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={utilizationData.slice(0, 15)} barSize={20} margin={{ left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="employeeName" tick={{ fontSize: 10, fill: '#64748B' }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="utilizationPercent" name="Utilization %" radius={[4,4,0,0]}
                    fill="#2563EB"
                    label={{ position: 'top', fontSize: 9, fill: '#64748B', formatter: (v: number) => v > 0 ? `${v}%` : '' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Table */}
          <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th className="text-right">Capacity (h)</th>
                  <th className="text-right">Allocated (h)</th>
                  <th className="text-right">Logged (h)</th>
                  <th className="text-right">Utilization</th>
                  <th className="text-right">Allocation %</th>
                </tr>
              </thead>
              <tbody>
                {utilizationData.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No data</td></tr>
                ) : utilizationData.map((row: {
                  employeeId: string; employeeName: string; designation: string; department: string;
                  capacityHours: number; allocatedHours: number; loggedHours: number;
                  utilizationPercent: number; allocationPercent: number;
                }) => (
                  <tr key={row.employeeId}>
                    <td className="font-medium">{row.employeeName}</td>
                    <td>{row.department}</td>
                    <td className="text-xs">{row.designation}</td>
                    <td className="text-right">{row.capacityHours}</td>
                    <td className="text-right text-accent font-medium">{row.allocatedHours}</td>
                    <td className="text-right">{row.loggedHours}</td>
                    <td className="text-right">
                      <span className={`font-bold ${row.utilizationPercent > 100 ? 'text-danger' : row.utilizationPercent > 80 ? 'text-warning' : 'text-success'}`}>
                        {row.utilizationPercent}%
                      </span>
                    </td>
                    <td className="text-right">{row.allocationPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Progress Report */}
      {activeReport === 'progress' && (
        <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Priority</th>
                <th className="text-right">Planned (h)</th>
                <th className="text-right">Actual (h)</th>
                <th>Progress</th>
                <th>End Date</th>
                <th className="text-center">On Track</th>
              </tr>
            </thead>
            <tbody>
              {progressData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">No projects</td></tr>
              ) : progressData.map((p: {
                projectCode: string; projectName: string; projectManager: string;
                department: string; status: string; priority: string;
                startDate: string; endDate: string;
                plannedHours: number; actualHours: number;
                completionPercent: number; isDelayed: boolean; daysRemaining: number;
              }) => (
                <tr key={p.projectCode}>
                  <td>
                    <div className="font-medium text-sm">{p.projectName}</div>
                    <div className="text-2xs font-mono text-muted-foreground">{p.projectCode}</div>
                  </td>
                  <td className="text-sm">{p.projectManager}</td>
                  <td><span className="status-badge text-xs status-badge-active">{p.status}</span></td>
                  <td><span className={`status-badge text-xs priority-${p.priority.toLowerCase()}`}>{p.priority}</span></td>
                  <td className="text-right">{p.plannedHours}</td>
                  <td className="text-right">{p.actualHours}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="util-bar w-20">
                        <div className={`util-bar-fill ${p.completionPercent >= 80 ? 'bg-success' : p.completionPercent >= 40 ? 'bg-accent' : 'bg-warning'}`}
                          style={{ width: `${p.completionPercent}%` }} />
                      </div>
                      <span className="text-xs font-bold">{p.completionPercent}%</span>
                    </div>
                  </td>
                  <td className={`text-xs ${p.isDelayed ? 'text-danger font-medium' : ''}`}>
                    {new Date(p.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    {p.isDelayed && <div className="text-danger text-2xs">OVERDUE</div>}
                  </td>
                  <td className="text-center">
                    {p.isDelayed ? '🔴' : p.daysRemaining < 7 ? '🟡' : '🟢'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timesheet Report */}
      {activeReport === 'timesheet' && timesheetData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="section-title mb-4">Submission Status — {MONTHS[month-1]} {year}</h3>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total', value: timesheetData.summary?.total || 0, color: 'text-primary' },
                { label: 'Approved', value: timesheetData.summary?.approved || 0, color: 'text-success' },
                { label: 'Pending', value: (timesheetData.summary?.submitted || 0) + (timesheetData.summary?.tlApproved || 0), color: 'text-warning' },
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="section-title mb-4">Hours Summary</h3>
            <div className="text-center py-6">
              <div className="text-4xl font-black text-primary mb-1">{timesheetData.summary?.totalHours?.toFixed(0) || 0}h</div>
              <div className="text-sm text-muted-foreground">Total hours logged</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
