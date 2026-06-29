import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Save, Send, Copy, Clock,
  CheckCircle, AlertCircle, Plus, Trash2, Info, RefreshCw, Zap, Calendar
} from 'lucide-react';
import { timesheetsApi, tasksApi, projectsApi, attendanceApi } from '../../services/api';
import { RootState } from '../../store';
import { setCurrentWeek, setDirty } from '../../store/slices/timesheetSlice';
import { format, addDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { toast } from 'sonner';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type DayKey = typeof DAYS[number];

interface TimesheetEntryRow {
  id?: string;
  taskId: string;
  projectId: string;
  taskName?: string;
  projectName?: string;
  monday: number; tuesday: number; wednesday: number; thursday: number;
  friday: number; saturday: number; sunday: number;
  description: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'text-muted-foreground bg-muted border-border', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'text-accent bg-accent/10 border-accent/20', icon: Send },
  TEAM_LEAD_APPROVED: { label: 'TL Approved', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: CheckCircle },
  APPROVED: { label: 'Approved', color: 'text-success bg-success/10 border-success/20', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-danger bg-danger/10 border-danger/20', icon: AlertCircle },
};

const formatHours = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const TimesheetPage: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { currentWeekStart } = useSelector((state: RootState) => state.timesheets);
  const { user } = useSelector((state: RootState) => state.auth);
  const [entries, setEntries] = useState<TimesheetEntryRow[]>([]);
  const [timesheetId, setTimesheetId] = useState<string | null>(null);
  const [timesheetStatus, setTimesheetStatus] = useState('DRAFT');

  const weekStart = new Date(currentWeekStart);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  // Get active week's timesheet data
  const { data: timesheetRes, isLoading } = useQuery({
    queryKey: ['timesheet', 'week', currentWeekStart],
    queryFn: () => timesheetsApi.getWeek(currentWeekStart),
  });

  // Query all active projects for selectors
  const { data: projectsRes } = useQuery({
    queryKey: ['projects', { limit: 100 }],
    queryFn: () => projectsApi.getAll({ limit: 100 }),
  });
  const projects = projectsRes?.data?.data?.data || [];

  // Query all tasks for selectors
  const { data: tasksRes } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => tasksApi.getAll({ limit: 100 }),
  });
  const allTasks = tasksRes?.data?.data?.data || [];

  // Get employee's monthly attendance logs for swipe integration
  const { data: attendanceRes } = useQuery({
    queryKey: ['attendance', 'month', currentWeekStart],
    queryFn: () => {
      const d = new Date(currentWeekStart);
      return attendanceApi.getMonthly({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        employeeId: user?.employee?.id
      });
    },
    enabled: !!user?.employee?.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: object) => timesheetsApi.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', 'week'] });
      dispatch(setDirty(false));
      toast.success('Timesheet saved successfully');
    },
    onError: () => toast.error('Failed to save timesheet'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => timesheetsApi.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', 'week'] });
      toast.success('Timesheet submitted for approval!');
    },
    onError: () => toast.error('Failed to submit timesheet'),
  });

  const copyMutation = useMutation({
    mutationFn: () => timesheetsApi.copyPreviousWeek(currentWeekStart),
    onSuccess: (res) => {
      const prevEntries = res.data.data.entries;
      if (prevEntries?.length > 0) {
        const mapped: TimesheetEntryRow[] = prevEntries.map((e: any) => ({
          taskId: e.taskId,
          projectId: e.projectId,
          monday: e.monday, tuesday: e.tuesday, wednesday: e.wednesday,
          thursday: e.thursday, friday: e.friday, saturday: e.saturday, sunday: e.sunday,
          description: e.description || '',
        }));
        setEntries(mapped);
        dispatch(setDirty(true));
        toast.success('Previous week entries loaded');
      } else {
        toast.info('No entries found from the previous week');
      }
    },
    onError: () => toast.error('Failed to copy previous week timesheet'),
  });

  // Load timesheet entries
  useEffect(() => {
    const ts = timesheetRes?.data?.data;
    if (ts) {
      setTimesheetId(ts.id);
      setTimesheetStatus(ts.status || 'DRAFT');
      if (ts.entries?.length > 0) {
        setEntries(ts.entries.map((e: any) => ({
          id: e.id,
          taskId: e.taskId,
          projectId: e.projectId,
          monday: e.monday, tuesday: e.tuesday, wednesday: e.wednesday,
          thursday: e.thursday, friday: e.friday, saturday: e.saturday, sunday: e.sunday,
          description: e.description || '',
        })));
      } else if (ts.suggestedTasks?.length > 0) {
        setEntries(ts.suggestedTasks.map((t: any) => ({
          taskId: t.id,
          projectId: t.project?.id || '',
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
          description: '',
        })));
      } else {
        setEntries([{
          taskId: '', projectId: '',
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
          description: '',
        }]);
      }
    } else {
      setEntries([{
        taskId: '', projectId: '',
        monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
        description: '',
      }]);
    }
  }, [timesheetRes]);

  const navigateWeek = (dir: 1 | -1) => {
    const d = addDays(weekStart, dir * 7);
    dispatch(setCurrentWeek(format(d, 'yyyy-MM-dd')));
  };

  const jumpToCurrentWeek = () => {
    const currentMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    dispatch(setCurrentWeek(format(currentMonday, 'yyyy-MM-dd')));
  };

  const updateHours = (rowIdx: number, day: DayKey, value: string) => {
    const num = Math.max(0, Math.min(24, parseFloat(value) || 0));
    setEntries(prev => prev.map((e, i) => i === rowIdx ? { ...e, [day]: num } : e));
    dispatch(setDirty(true));
  };

  const updateRowSelection = (rowIdx: number, field: 'projectId' | 'taskId', val: string) => {
    setEntries(prev => prev.map((e, i) => {
      if (i === rowIdx) {
        if (field === 'projectId') {
          return { ...e, projectId: val, taskId: '' }; // Clear task when project changes
        }
        return { ...e, taskId: val };
      }
      return e;
    }));
    dispatch(setDirty(true));
  };

  const addRow = () => {
    setEntries(prev => [...prev, {
      taskId: '', projectId: '',
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
      description: '',
    }]);
  };

  const removeRow = (idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx));
    dispatch(setDirty(true));
  };

  const getDayTotal = (day: DayKey) =>
    entries.reduce((sum, e) => sum + (e[day] || 0), 0);

  const getWeekTotal = () =>
    DAYS.reduce((sum, day) => sum + getDayTotal(day), 0);

  // Quick fill: fill 8h for weekdays
  const handleQuickFill8h = () => {
    setEntries(prev => prev.map(e => ({
      ...e,
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8,
      saturday: 0, sunday: 0
    })));
    dispatch(setDirty(true));
    toast.success('Filled 8 hours for all weekdays');
  };

  // Find attendance record for a specific day of the current week
  const getAttendanceRecordForDay = (dayIdx: number) => {
    const targetDate = addDays(weekStart, dayIdx);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const records = attendanceRes?.data?.data?.records || [];
    return records.find((r: any) => format(new Date(r.date), 'yyyy-MM-dd') === dateStr);
  };

  // Quick fill: auto fill hours from attendance records
  const handleFillFromAttendance = () => {
    const updatedEntries = [...entries];
    if (updatedEntries.length === 0) {
      toast.error('Please add a project row first');
      return;
    }

    // Fill hours from attendance logs on the first row
    DAYS.forEach((day, idx) => {
      const record = getAttendanceRecordForDay(idx);
      if (record) {
        updatedEntries[0] = {
          ...updatedEntries[0],
          [day]: Number(record.workedHours) || 0
        };
      }
    });

    setEntries(updatedEntries);
    dispatch(setDirty(true));
    toast.success('Timesheet hours updated from attendance logs');
  };

  const handleSave = (submitAfter = false) => {
    const validEntries = entries.filter(e => e.projectId && e.taskId);
    if (validEntries.length === 0) {
      toast.error('Please add at least one row with a Project and Task');
      return;
    }

    const data = {
      weekStartDate: currentWeekStart,
      entries: validEntries.map(e => ({
        taskId: e.taskId,
        projectId: e.projectId,
        monday: Number(e.monday) || 0, tuesday: Number(e.tuesday) || 0, wednesday: Number(e.wednesday) || 0,
        thursday: Number(e.thursday) || 0, friday: Number(e.friday) || 0, saturday: Number(e.saturday) || 0, sunday: Number(e.sunday) || 0,
        description: e.description || '',
      })),
      status: submitAfter ? 'SUBMITTED' : 'DRAFT',
    };

    saveMutation.mutate(data, {
      onSuccess: (res) => {
        if (submitAfter && res.data?.data?.id) {
          submitMutation.mutate(res.data.data.id);
        }
      }
    });
  };

  const isEditable = ['DRAFT', 'REJECTED'].includes(timesheetStatus);
  const statusConfig = STATUS_CONFIG[timesheetStatus] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;

  const weekLabel = `Week: ${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM (')}Week ${format(weekStart, 'I')})`;
  const monthHeaderLabel = format(weekStart, 'MMMM yyyy');

  return (
    <div className="page-wrapper space-y-6">
      {/* Top Title & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary">Timesheet Entry</h1>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 border rounded-full text-muted-foreground bg-muted">
            <Info className="w-3.5 h-3.5 text-muted-foreground" /> Help
          </span>
        </div>
      </div>

      {/* Quick Fill Box Banner */}
      {isEditable && (
        <div className="bg-accent/5 border border-accent/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 p-2 rounded-lg text-accent">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Quick Fill</h3>
              <p className="text-xs text-muted-foreground">Fill your timesheet in seconds using templates or swipe records.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyMutation.mutate()}
              disabled={copyMutation.isPending}
              className="flex items-center gap-1 text-xs font-medium px-4 py-2 border border-border rounded-md bg-white hover:bg-muted text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" /> Repeat Last Week
            </button>
            <button
              onClick={handleQuickFill8h}
              className="flex items-center gap-1 text-xs font-medium px-4 py-2 border border-border rounded-md bg-white hover:bg-muted text-primary transition-colors"
            >
              <Zap className="w-3 h-3 text-warning" /> Fill 8h / Day
            </button>
            <button
              onClick={handleFillFromAttendance}
              className="flex items-center gap-1 text-xs font-medium px-4 py-2 border border-success/30 hover:border-success/50 rounded-md bg-success/5 text-success hover:bg-success/10 transition-colors"
            >
              <CheckCircle className="w-3 h-3" /> Fill from Attendance
            </button>
          </div>
        </div>
      )}

      {/* Week Navigation Header */}
      <div className="flex items-center justify-between bg-white border border-border p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-md">
            <button onClick={() => navigateWeek(-1)}
              className="w-9 h-9 flex items-center justify-center hover:bg-muted border-r border-border text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigateWeek(1)}
              className="w-9 h-9 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div>
            <span className="text-base font-bold text-primary mr-3">{monthHeaderLabel}</span>
            <span className="text-sm font-medium text-muted-foreground">{weekLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={jumpToCurrentWeek}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-md text-sm font-semibold text-primary hover:bg-muted transition-colors"
          >
            <Calendar className="w-4 h-4" /> CURRENT WEEK
          </button>
        </div>
      </div>

      {/* Timesheet Table Section */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <h2 className="text-base font-bold text-primary">Week Entry</h2>
          <div className="flex items-center gap-2">
            {isEditable && (
              <>
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-md text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD PROJECT
                </button>
                <button
                  onClick={() => toast.info('Permission log request triggered')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-md text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD PERMISSION
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-primary rounded-md text-xs font-semibold transition-colors bg-white shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> SAVE DRAFT
                </button>
              </>
            )}
            <span className={`flex items-center gap-1.5 px-3 py-1 border rounded-md text-xs font-bold ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-left text-xs font-bold text-muted-foreground uppercase">
                <th className="px-4 py-3 text-center w-12">S.No</th>
                <th className="px-4 py-3 w-64">Project Name</th>
                <th className="px-4 py-3 w-64">Task / Leave Type</th>
                {DAYS.map((day, idx) => {
                  const d = addDays(weekStart, idx);
                  return (
                    <th key={day} className="px-2 py-3 text-center w-24">
                      <div>{DAY_LABELS[idx]}</div>
                      <div className="text-3xs font-normal text-muted-foreground">{format(d, 'MMM d')}</div>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-center w-24">Work Hours</th>
                {isEditable && <th className="px-4 py-3 text-center w-12">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={12} className="p-4"><div className="h-8 shimmer rounded" /></td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-muted-foreground">
                    No entries in this week. Click "+ ADD PROJECT" to get started.
                  </td>
                </tr>
              ) : entries.map((entry, idx) => {
                const rowTotal = DAYS.reduce((s, d) => s + (entry[d] || 0), 0);
                const projectTasks = allTasks.filter((t: any) => t.projectId === entry.projectId);

                return (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{idx + 1}</td>
                    
                    {/* Project Selector */}
                    <td className="px-4 py-4">
                      {isEditable ? (
                        <select
                          value={entry.projectId}
                          onChange={(e) => updateRowSelection(idx, 'projectId', e.target.value)}
                          className="form-input w-full text-xs"
                        >
                          <option value="">Select Project</option>
                          {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.projectCode} - {p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs font-semibold text-primary">{entry.projectName || '—'}</div>
                      )}
                    </td>

                    {/* Task Selector */}
                    <td className="px-4 py-4">
                      {isEditable ? (
                        <select
                          value={entry.taskId}
                          onChange={(e) => updateRowSelection(idx, 'taskId', e.target.value)}
                          disabled={!entry.projectId}
                          className="form-input w-full text-xs disabled:opacity-50"
                        >
                          <option value="">Select Task</option>
                          {projectTasks.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs font-medium text-muted-foreground">{entry.taskName || '—'}</div>
                      )}
                    </td>

                    {/* Days Inputs */}
                    {DAYS.map((day, dIdx) => {
                      const recordForDay = getAttendanceRecordForDay(dIdx);
                      const isLeave = recordForDay?.status === 'LEAVE';
                      
                      return (
                        <td key={day} className="px-2 py-4 text-center">
                          {isEditable ? (
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={entry[day] || ''}
                                onChange={(e) => updateHours(idx, day, e.target.value)}
                                placeholder="0"
                                className={`w-16 text-center text-xs border border-border rounded-md px-1 py-1.5 focus:outline-none focus:border-accent font-medium ${entry[day] > 0 ? 'text-accent bg-accent/5 font-bold border-accent/20' : 'text-muted-foreground'}`}
                              />
                              {isLeave && (
                                <span className="text-3xs text-success bg-success/5 border border-success/15 px-1.5 py-0.5 rounded mt-1.5 block shrink-0 whitespace-nowrap">
                                  Leave (Approved)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className={`text-xs ${entry[day] > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                                {entry[day] ? formatHours(entry[day]) : '—'}
                              </span>
                              {isLeave && (
                                <span className="text-3xs text-success bg-success/5 border border-success/15 px-1.5 py-0.5 rounded mt-1.5 block shrink-0 whitespace-nowrap">
                                  Leave (Approved)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Hours Total */}
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-black ${rowTotal > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                        {formatHours(rowTotal)}
                      </span>
                    </td>

                    {/* Row Delete Action */}
                    {isEditable && (
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => removeRow(idx)}
                          className="w-8 h-8 flex items-center justify-center border border-danger/10 hover:bg-danger/5 text-danger rounded-md transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Attendance Swipe Hours Row */}
              <tr className="bg-muted/10 font-medium text-xs text-muted-foreground border-t border-border">
                <td colSpan={3} className="px-4 py-3.5 font-bold text-primary flex items-center gap-1.5">
                  Office Presence (Swipe Hours)
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer" />
                </td>
                {DAYS.map((day, dIdx) => {
                  const record = getAttendanceRecordForDay(dIdx);
                  return (
                    <td key={day} className="px-2 py-3.5 text-center text-primary font-semibold">
                      {record?.workedHours ? formatHours(record.workedHours) : '—'}
                    </td>
                  );
                })}
                <td className="px-4 py-3.5 text-center font-bold text-primary">
                  {formatHours(
                    DAYS.reduce((sum, _, dIdx) => {
                      const record = getAttendanceRecordForDay(dIdx);
                      return sum + (record?.workedHours || 0);
                    }, 0)
                  )}
                </td>
                {isEditable && <td />}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Weekly Summary Totals */}
        <div className="bg-muted/10 border-t border-border p-4 flex items-center justify-between text-xs font-bold text-primary">
          <div className="flex items-center gap-1 text-danger font-bold text-xs uppercase">
            <span className="w-2.5 h-2.5 bg-danger rounded-full inline-block" /> Daily Limit: 8 hrs
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">WEEK TOTAL:</span>
            <span className="text-lg font-black text-accent">{formatHours(getWeekTotal())}</span>
          </div>
        </div>
      </div>

      {/* Office Swipe Integration Status Box */}
      <div className="bg-white border border-border p-4 rounded-lg flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-xs font-black uppercase text-primary tracking-wider">OFFICE SWIPE INTEGRATION</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Attendance device integration is not configured for this organization. Contact your administrator to enable real-time swipe tracking.</p>
        </div>
        <span className="text-3xs font-black text-warning bg-warning/5 border border-warning/15 px-2.5 py-1 rounded uppercase tracking-wider">
          STATUS: NOT CONFIGURED
        </span>
      </div>

      {/* Bottom Submit Action */}
      {isEditable && (
        <div className="flex justify-end pt-3">
          <button
            onClick={() => handleSave(true)}
            disabled={saveMutation.isPending || submitMutation.isPending}
            className="flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-md text-sm font-black hover:bg-accent/90 shadow-sm transition-all uppercase tracking-wider disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit Week ({formatHours(getWeekTotal())})
          </button>
        </div>
      )}
    </div>
  );
};

export default TimesheetPage;
