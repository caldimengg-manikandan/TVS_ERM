import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Download, MapPin } from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, getDaysInMonth, getDay } from 'date-fns';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PRESENT: { bg: 'bg-success/15', text: 'text-success', label: 'P' },
  ABSENT: { bg: 'bg-danger/15', text: 'text-danger', label: 'A' },
  HALF_DAY: { bg: 'bg-warning/15', text: 'text-warning', label: 'H' },
  LEAVE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'L' },
  HOLIDAY: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'OH' },
};

const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const { data: todayRes } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getToday(),
    refetchInterval: 60000,
  });

  const { data: monthlyRes, isLoading } = useQuery({
    queryKey: ['attendance', 'monthly', { month, year }],
    queryFn: () => attendanceApi.getMonthly({ month, year }),
  });

  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['attendance'] }); toast.success('Checked in successfully! 🟢'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed to check in'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['attendance'] }); toast.success('Checked out! Have a great day! 👋'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed to check out'),
  });

  const today = todayRes?.data?.data;
  const monthly = monthlyRes?.data?.data;
  const records = monthly?.records || [];
  const summary = monthly?.summary;

  const navigateMonth = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDay = getDay(new Date(year, month - 1, 1)); // 0=Sun
  const calOffset = firstDay === 0 ? 6 : firstDay - 1; // Adjust to Mon=0

  const recordMap = records.reduce((acc: Record<string, { status: string; checkIn?: string; checkOut?: string; workedHours: number }>, r: { date: string; status: string; checkIn?: string; checkOut?: string; workedHours: number }) => {
    const d = new Date(r.date).getDate();
    acc[d] = r;
    return acc;
  }, {});

  const isCheckedIn = today?.checkIn && !today?.checkOut;
  const isCheckedOut = today?.checkIn && today?.checkOut;
  const canCheckIn = !today?.checkIn || today.status === 'NOT_CHECKED_IN';
  const canCheckOut = isCheckedIn;

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Attendance</h1>
          <p className="text-sm text-muted-foreground">Track your daily attendance and working hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Check-in panel + Monthly Summary */}
        <div className="space-y-5">
          {/* Today Check-in Card */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="font-semibold text-primary mb-4">Today — {format(now, 'EEEE, dd MMMM')}</h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check In</span>
                <span className={`font-semibold ${today?.checkIn ? 'text-success' : 'text-muted-foreground'}`}>
                  {today?.checkIn ? format(new Date(today.checkIn), 'h:mm a') : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check Out</span>
                <span className={`font-semibold ${today?.checkOut ? 'text-primary' : 'text-muted-foreground'}`}>
                  {today?.checkOut ? format(new Date(today.checkOut), 'h:mm a') : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hours Worked</span>
                <span className="font-bold text-accent">{today?.workedHours?.toFixed(1) || '0'}h</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {canCheckIn && (
                <button
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  id="check-in-btn"
                  className="w-full py-3 bg-success text-white rounded-lg font-semibold text-sm 
                             hover:bg-success/90 transition-all shadow-sm hover:shadow-md
                             flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
                </button>
              )}
              {canCheckOut && (
                <button
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  id="check-out-btn"
                  className="w-full py-3 bg-primary text-white rounded-lg font-semibold text-sm 
                             hover:bg-primary/90 transition-all shadow-sm hover:shadow-md
                             flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {checkOutMutation.isPending ? 'Checking out...' : 'Check Out'}
                </button>
              )}
              {isCheckedOut && (
                <div className="text-center py-3 text-sm text-success font-medium">
                  ✅ Attendance marked for today
                </div>
              )}
            </div>
          </div>

          {/* Monthly Summary */}
          {summary && (
            <div className="bg-white border border-border rounded-lg p-5 shadow-card">
              <h3 className="font-semibold text-primary mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Present', value: summary.present, color: 'text-success', bg: 'bg-success/10' },
                  { label: 'Absent', value: summary.absent, color: 'text-danger', bg: 'bg-danger/10' },
                  { label: 'Half Day', value: summary.halfDay, color: 'text-warning', bg: 'bg-warning/10' },
                  { label: 'Leave', value: summary.leave, color: 'text-purple-600', bg: 'bg-purple-100' },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} rounded-lg p-3 text-center`}>
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-bold text-accent">{summary.totalWorkedHours?.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Avg Hours/Day</span>
                  <span className="font-medium">{summary.avgWorkedHours?.toFixed(1)}h</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Calendar View */}
        <div className="lg:col-span-2 bg-white border border-border rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-primary">{MONTHS[month - 1]} {year}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateMonth(-1)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigateMonth(1)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day labels */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-2xs font-semibold text-muted-foreground py-1.5">
                {d}
              </div>
            ))}

            {/* Offset days */}
            {Array.from({ length: calOffset }).map((_, i) => (
              <div key={`offset-${i}`} />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const record = recordMap[day];
              const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
              const dayOfWeek = (calOffset + i) % 7;
              const isWeekend = dayOfWeek >= 5;
              const status = record?.status;
              const statusStyle = status ? STATUS_STYLES[status] : null;

              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    ${isToday ? 'ring-2 ring-accent' : ''}
                    ${statusStyle ? statusStyle.bg : isWeekend ? 'bg-muted/50' : 'hover:bg-muted/50'}
                    transition-colors cursor-default`}
                  title={record ? `${record.checkIn ? format(new Date(record.checkIn), 'h:mm a') : ''} – ${record.checkOut ? format(new Date(record.checkOut), 'h:mm a') : ''} (${record.workedHours?.toFixed(1)}h)` : ''}
                >
                  <span className={`text-xs font-medium ${statusStyle ? statusStyle.text : isWeekend ? 'text-muted-foreground' : 'text-primary'}`}>
                    {day}
                  </span>
                  {statusStyle && (
                    <span className={`text-2xs font-bold ${statusStyle.text}`}>{statusStyle.label}</span>
                  )}
                  {record?.workedHours > 0 && !statusStyle && (
                    <span className="text-2xs text-muted-foreground">{record.workedHours.toFixed(0)}h</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
            {Object.entries(STATUS_STYLES).map(([key, style]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-2xs font-bold ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <span className="text-xs text-muted-foreground">{key.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
