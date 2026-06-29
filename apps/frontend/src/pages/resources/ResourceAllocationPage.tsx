import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, AlertTriangle, CheckCircle, Search,
  Filter, ChevronLeft, ChevronRight, BarChart3, Download,
  ChevronDown, ChevronUp, Calendar, Clock, CheckSquare, Plus, Eye, Info, Trash2
} from 'lucide-react';
import { resourcesApi, departmentsApi } from '../../services/api';
import { format, differenceInDays, addDays, startOfWeek } from 'date-fns';
import AllocateResourceModal from '../../components/resources/AllocateResourceModal';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { ResourceStatus } from '@tvs/shared';

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  NEAR_CAPACITY: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  OVERLOADED: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
};

const ExpandableResourceRow = ({ row, statusStyle, selectedMonth, selectedYear }: { row: any, statusStyle: any, selectedMonth: number, selectedYear: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const navigate = useNavigate();
  
  const { data: allocData, isLoading } = useQuery({
    queryKey: ['employee-allocations', row.employeeDbId],
    queryFn: () => resourcesApi.getEmployeeAllocations(row.employeeDbId),
    enabled: expanded,
  });

  const queryClient = useQueryClient();
  const deallocateMutation = useMutation({
    mutationFn: (allocationId: string) => resourcesApi.cancel(allocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['employee-allocations'] });
      toast.success('Resource deallocated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deallocate resource');
    }
  });

  const handleDeallocate = (e: React.MouseEvent, allocationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to deallocate this project from the employee?')) {
      deallocateMutation.mutate(allocationId);
    }
  };

  const allocations = allocData?.data?.data || [];

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!allocations || allocations.length === 0) {
      toast.error('No allocations to download');
      return;
    }
    
    const headers = ['Project Name', 'Project Code', 'Allocated Hours', 'Start Date', 'End Date', 'Progress (%)'];
    const csvContent = [
      headers.join(','),
      ...allocations.map((alloc: any) => [
        `"${alloc.project.name}"`,
        `"${alloc.project.projectCode}"`,
        alloc.allocatedHours,
        format(new Date(alloc.startDate), 'yyyy-MM-dd'),
        format(new Date(alloc.endDate), 'yyyy-MM-dd'),
        alloc.project.completionPercentage || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Allocations_${row.employeeName.replace(/\\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded successfully');
  };

  // Gantt Chart timeline calculations
  const centerDate = new Date(selectedYear, selectedMonth - 1, 15);
  let timelineUnits: Date[] = [];
  let getHeaderName: (d: Date) => string;
  let subHeaderFormat: string;
  let getUnitEnd: (d: Date) => Date;

  switch (viewMode) {
    case 'day':
      timelineUnits = Array.from({ length: 28 }).map((_, i) => addDays(centerDate, i - 14));
      getHeaderName = (d) => format(d, 'MMMM yyyy');
      subHeaderFormat = 'dd';
      getUnitEnd = (d) => addDays(d, 1);
      break;
    case 'week':
      const startOfCenterWeek = startOfWeek(centerDate, { weekStartsOn: 1 });
      timelineUnits = Array.from({ length: 16 }).map((_, i) => addDays(startOfCenterWeek, (i - 5) * 7));
      getHeaderName = (d) => format(d, 'MMMM yyyy');
      subHeaderFormat = 'MMM dd';
      getUnitEnd = (d) => addDays(d, 7);
      break;
    case 'month':
      timelineUnits = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date(selectedYear, selectedMonth - 1, 1);
        d.setMonth(d.getMonth() + (i - 5));
        return d;
      });
      getHeaderName = (d) => format(d, 'yyyy');
      subHeaderFormat = 'MMM';
      getUnitEnd = (d) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + 1); return nd; };
      break;
    case 'year':
      timelineUnits = Array.from({ length: 5 }).map((_, i) => {
        return new Date(selectedYear + (i - 2), 0, 1);
      });
      getHeaderName = () => `${timelineUnits[0].getFullYear()} - ${timelineUnits[timelineUnits.length-1].getFullYear()}`;
      subHeaderFormat = 'yyyy';
      getUnitEnd = (d) => { const nd = new Date(d); nd.setFullYear(nd.getFullYear() + 1); return nd; };
      break;
  }

  const minTime = timelineUnits[0].getTime();
  const maxTime = getUnitEnd(timelineUnits[timelineUnits.length - 1]).getTime();
  const timelineDuration = maxTime - minTime;

  // Group units by header name
  const monthsHeader: { name: string; colspan: number }[] = [];
  timelineUnits.forEach((w) => {
    const hName = getHeaderName(w);
    const last = monthsHeader[monthsHeader.length - 1];
    if (last && last.name === hName) {
      last.colspan += 1;
    } else {
      monthsHeader.push({ name: hName, colspan: 1 });
    }
  });

  // Today marker positioning
  const today = new Date();
  const todayTime = today.getTime();
  const showTodayLine = todayTime >= minTime && todayTime <= maxTime;
  const todayLeft = showTodayLine ? ((todayTime - minTime) / timelineDuration) * 100 : -1;

  const getBarPosition = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const left = Math.max(0, Math.min(100, ((start - minTime) / timelineDuration) * 100));
    const right = Math.max(0, Math.min(100, ((maxTime - end) / timelineDuration) * 100));
    const width = Math.max(1, 100 - left - right);
    return { left: `${left}%`, width: `${width}%` };
  };

  // Metrics
  const totalAllocated = allocations.reduce((sum: number, a: any) => sum + a.allocatedHours, 0);
  const totalAvailable = Math.max(0, row.capacityHours - totalAllocated);
  const overdueCount = allocations.filter((a: any) => new Date(a.project.endDate).getTime() < new Date().getTime()).length;
  const avgProgress = allocations.length > 0
    ? Math.round(allocations.reduce((sum: number, a: any) => sum + (a.project.completionPercentage || 0), 0) / allocations.length)
    : 0;

  return (
    <>
      <motion.tr 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className={`hover:bg-muted/30 transition-colors cursor-pointer ${expanded ? 'bg-muted/30' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="text-center text-muted-foreground text-xs">
          <div className="flex items-center justify-center gap-1">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {row.sNo}
          </div>
        </td>
        <td>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-2xs font-bold">
                {row.employeeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-primary">{row.employeeName}</div>
              <div className="text-2xs text-muted-foreground">{row.employeeId}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="text-sm">{row.role}</div>
          <div className="text-2xs text-muted-foreground">{row.department}</div>
        </td>
        <td className="text-sm">{row.currentProject}</td>
        <td className="text-right text-sm font-medium">{row.capacityHours}</td>
        <td className="text-right text-sm font-semibold text-accent">{row.allocatedHours}</td>
        <td className="text-right text-sm font-medium text-success">{row.availableHours}</td>
        <td className={`text-right text-sm font-medium ${row.balanceHours < 0 ? 'text-danger' : 'text-primary'}`}>
          {row.balanceHours < 0 ? `(${Math.abs(row.balanceHours)})` : row.balanceHours}
        </td>
        <td>
          <div className="flex items-center gap-2 justify-center">
            <div className="util-bar w-16">
              <div
                className={`util-bar-fill ${
                  row.utilizationPercent > 100 ? 'bg-danger' :
                  row.utilizationPercent > 80 ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${Math.min(100, row.utilizationPercent)}%` }}
              />
            </div>
            <span className={`text-xs font-bold w-9 ${
              row.utilizationPercent > 100 ? 'text-danger' :
              row.utilizationPercent > 80 ? 'text-warning' : 'text-success'
            }`}>{row.utilizationPercent}%</span>
          </div>
        </td>
        <td className="text-center">
          <span className={`status-badge text-xs ${statusStyle.bg} ${statusStyle.text} gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {row.resourceStatus.replace('_', ' ')}
          </span>
        </td>
      </motion.tr>
      
      {/* Expanded Breakdown Row */}
      {expanded && (
        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={10} className="p-0">
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 border-l-4 border-accent space-y-6"
            >
              {/* 1. Project Allocations Table View */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">PROJECT ALLOCATIONS BREAKDOWN</h4>
                    <span className="text-3xs font-semibold px-2 py-0.5 bg-accent/10 border border-accent/25 rounded text-accent">Table View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-1 bg-white border border-border hover:bg-muted text-primary px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 px-4 py-1.5 rounded-md shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Allocate New Project
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="h-20 shimmer rounded" />
                ) : allocations.length === 0 ? (
                  <div className="text-center py-6 bg-white border border-border rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">No active project allocations found.</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                      className="mt-3 text-sm text-accent hover:underline"
                    >
                      Allocate a project now
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-bold">Project</th>
                          <th className="px-4 py-3 font-bold text-center">Allocated Time</th>
                          <th className="px-4 py-3 font-bold text-center">Actual Time</th>
                          <th className="px-4 py-3 font-bold text-center">Variance</th>
                          <th className="px-4 py-3 font-bold text-center">Deadline</th>
                          <th className="px-4 py-3 font-bold text-center">Progress / Balance</th>
                          <th className="w-12 text-center" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allocations.map((alloc: any) => {
                          const daysRemaining = differenceInDays(new Date(alloc.project.endDate), new Date());
                          const allocatedDays = (alloc.allocatedHours / 8).toFixed(1);
                          const actualHours = alloc.actualHours || 0;
                          const actualDays = (actualHours / 8).toFixed(1);
                          const compPercent = alloc.project.completionPercentage || 0;
                          const balanceWorkPercent = Math.max(0, 100 - compPercent).toFixed(1);
                          
                          const varianceHours = actualHours - alloc.allocatedHours;
                          const varianceDays = (varianceHours / 8).toFixed(1);
                          const efficiency = actualHours > 0 ? ((alloc.allocatedHours / actualHours) * 100).toFixed(0) : 0;

                          return (
                            <tr key={alloc.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-primary text-sm">{alloc.project.name}</div>
                                <div className="text-xs text-muted-foreground">{alloc.project.projectCode}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="text-sm font-black text-accent">{alloc.allocatedHours} h</div>
                                <div className="text-xs text-muted-foreground font-medium">{allocatedDays} Days</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="text-sm font-black text-primary">{actualHours} h</div>
                                <div className="text-xs text-muted-foreground font-medium">{actualDays} Days</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {varianceHours > 0 ? (
                                    <>
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-danger/10 text-danger border border-danger/20 shadow-sm" title={`${varianceHours} hours delayed`}>
                                        {Math.abs(Number(varianceDays))} Days Delayed
                                      </span>
                                      <span className="text-3xs text-danger font-semibold">+{varianceHours}h overrun</span>
                                    </>
                                  ) : varianceHours < 0 ? (
                                    <>
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-success/10 text-success border border-success/20 shadow-sm" title={`${Math.abs(varianceHours)} hours early`}>
                                        {Math.abs(Number(varianceDays))} Days Early
                                      </span>
                                      <span className="text-3xs text-success font-semibold">{varianceHours}h saved</span>
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                                      On Track
                                    </span>
                                  )}
                                  {actualHours > 0 && varianceHours !== 0 && (
                                    <span className="text-4xs uppercase tracking-wider text-muted-foreground font-bold mt-0.5">
                                      {efficiency}% Efficiency
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="font-semibold text-primary text-sm">
                                  {format(new Date(alloc.project.endDate), 'MMM dd, yyyy')}
                                </div>
                                <div className={`text-xs ${daysRemaining < 0 ? 'text-danger font-bold' : daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center gap-2 justify-center mb-1">
                                  <div className="util-bar w-24 h-2">
                                    <div 
                                      className="util-bar-fill bg-success"
                                      style={{ width: `${compPercent}%` }} 
                                    />
                                  </div>
                                  <span className="text-xs font-black text-success w-10 text-left">{compPercent}%</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Balance Work: <span className="font-semibold">{balanceWorkPercent}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${alloc.project.id}`); }}
                                    className="p-1.5 border border-border rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-all shadow-sm"
                                    title="View Project Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeallocate(e, alloc.id)}
                                    className="p-1.5 border border-border rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-all shadow-sm"
                                    title="Deallocate Project"
                                    disabled={deallocateMutation.isPending}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2. Project Gantt Chart View */}
              {allocations.length > 0 && (
                <div className="border border-border rounded-lg bg-white overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-primary uppercase tracking-wide">
                      <Calendar className="w-4 h-4 text-accent" /> Gantt Chart
                    </div>
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border border-border">
                      {(['day', 'week', 'month', 'year'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-all ${
                            viewMode === mode 
                              ? 'bg-white shadow-sm text-accent' 
                              : 'text-muted-foreground hover:text-primary'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="gantt-chart-container overflow-x-auto p-4">
                    <div className="min-w-[900px] border border-border rounded-md overflow-hidden bg-muted/5 relative">
                      {/* Timeline Header Row (Months) */}
                      <div className="flex border-b border-border bg-muted/20 text-3xs font-bold text-muted-foreground text-center">
                        <div className="w-1/4 px-4 py-2 border-r border-border text-left">Project Info</div>
                        <div className="w-3/4 relative flex divide-x divide-border">
                          {monthsHeader.map((m, idx) => (
                            <div key={idx} style={{ flexGrow: m.colspan }} className="py-2 text-2xs uppercase tracking-wide">
                              {m.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline Sub-Header Row */}
                      <div className="flex border-b border-border bg-muted/10 text-3xs text-muted-foreground text-center">
                        <div className="w-1/4 px-4 py-2 border-r border-border" />
                        <div className="w-3/4 relative flex justify-between divide-x divide-border/40">
                          {timelineUnits.map((w, idx) => (
                            <div key={idx} className="flex-1 py-1 text-3xs font-normal">
                              {format(w, subHeaderFormat)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gantt Rows */}
                      <div className="divide-y divide-border/60 relative">
                        {/* Dynamic Today Red Dotted Line */}
                        {showTodayLine && (
                          <div 
                            style={{ left: `calc(25% + (75% * ${todayLeft / 100}))` }} 
                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-danger/60 z-30"
                          >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-4xs bg-danger text-white px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                              Today
                            </span>
                          </div>
                        )}

                        {allocations.map((alloc: any, idx) => {
                          const { left, width } = getBarPosition(alloc.startDate, alloc.endDate);
                          const barColors = idx === 0 
                            ? 'bg-accent/15 border border-accent/35 text-accent font-bold' 
                            : 'bg-success/15 border border-success/35 text-success font-bold';
                          
                          return (
                            <div key={alloc.id} className="flex hover:bg-muted/10 transition-colors items-center">
                              <div className="w-1/4 px-4 py-3.5 border-r border-border">
                                <p className="text-xs font-bold text-primary truncate" title={alloc.project.name}>{alloc.project.name}</p>
                                <p className="text-3xs text-muted-foreground mt-0.5">{alloc.project.projectCode}</p>
                              </div>
                              <div className="w-3/4 relative px-4 py-3.5 h-14">
                                <div className="absolute inset-0 flex justify-between pointer-events-none">
                                  {timelineUnits.map((_, i) => (
                                    <div key={i} className="flex-1 h-full border-r border-border/20" />
                                  ))}
                                </div>
                                <div
                                  style={{ left, width }}
                                  className={`absolute top-1/2 -translate-y-1/2 h-6 rounded shadow-2xs flex items-center px-3 justify-center cursor-pointer transition-all hover:scale-[1.01] overflow-hidden ${barColors}`}
                                >
                                  <span className="text-3xs truncate tracking-wide whitespace-nowrap">
                                    {alloc.allocatedHours}h ({format(new Date(alloc.startDate), 'MMM dd')} - {format(new Date(alloc.endDate), 'MMM dd')})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Project Summary & Insights Metrics */}
              {allocations.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-6 border-t border-border pt-6">
                  {/* Summary Metric Cards */}
                  <div className="lg:col-span-3 space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" /> Project Summary
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="border border-border/60 bg-muted/5 rounded-lg p-3 text-center">
                        <div className="text-base font-black text-primary">{allocations.length}</div>
                        <div className="text-4xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Active Projects</div>
                      </div>
                      <div className="border border-border/60 bg-muted/5 rounded-lg p-3 text-center">
                        <div className="text-base font-black text-purple-600">{totalAllocated}h</div>
                        <div className="text-4xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">~ {(totalAllocated / 8).toFixed(1)} Days</div>
                      </div>
                      <div className="border border-border/60 bg-muted/5 rounded-lg p-3 text-center">
                        <div className="text-base font-black text-success">{totalAvailable}h</div>
                        <div className="text-4xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">~ {(totalAvailable / 8).toFixed(1)} Days</div>
                      </div>
                      <div className="border border-border/60 bg-muted/5 rounded-lg p-3 text-center">
                        <div className={`text-base font-black ${row.utilizationPercent > 100 ? 'text-danger' : row.utilizationPercent > 80 ? 'text-warning' : 'text-success'}`}>
                          {row.utilizationPercent}%
                        </div>
                        <div className="text-4xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Good</div>
                      </div>
                      <div className="border border-border/60 bg-muted/5 rounded-lg p-3 text-center">
                        <div className={`text-base font-black ${overdueCount > 0 ? 'text-danger' : 'text-success'}`}>{overdueCount}</div>
                        <div className="text-4xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Need Attention</div>
                      </div>
                      <div className="border border-border/60 bg-muted/5 rounded-lg p-3 text-center">
                        <div className="text-base font-black text-primary">{avgProgress}%</div>
                        <div className="text-4xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Across Projects</div>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Insights Panel */}
                  <div className="lg:col-span-1 border border-border/80 bg-muted/5 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
                    <div className="space-y-3">
                      <h5 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-accent" /> Allocation Insights
                      </h5>
                      <ul className="space-y-2 text-2xs text-muted-foreground list-disc pl-4 font-medium">
                        <li>{row.employeeName} is working on {allocations.length} active projects.</li>
                        {overdueCount > 0 ? (
                          <li>{overdueCount} projects are overdue. Review deadlines.</li>
                        ) : (
                          <li>No projects are overdue. Well scheduled!</li>
                        )}
                        <li>Consider rebalancing workload for optimal capacity.</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => navigate(`/employees/${row.employeeDbId}`)}
                      className="mt-4 w-full py-2 bg-accent/10 hover:bg-accent/15 text-accent text-2xs font-bold rounded border border-accent/10 transition-colors uppercase tracking-wider"
                    >
                      View Detailed Report
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </td>
        </tr>
      )}

      {/* Render Modal */}
      <AllocateResourceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeDbId={row.employeeDbId}
        employeeName={row.employeeName}
      />
    </>
  );
};

const ResourceAllocationPage: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  const { data: gridRes, isLoading } = useQuery({
    queryKey: ['resources', 'grid', { month, year, search, departmentId, page }],
    queryFn: () => resourcesApi.getGrid({ month, year, search, departmentId: departmentId || undefined, page, limit: 20 }),
  });

  const { data: utilRes } = useQuery({
    queryKey: ['resources', 'utilization', { month, year }],
    queryFn: () => resourcesApi.getUtilization(month, year),
  });

  const { data: deptRes } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  });

  const grid = gridRes?.data?.data?.data || [];
  const meta = gridRes?.data?.data?.meta;
  const utilization = utilRes?.data?.data;
  const departments = deptRes?.data?.data || [];

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleExport = () => {
    if (!grid || grid.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = ['S.No', 'Employee Name', 'Employee ID', 'Role', 'Department', 'Current Project', 'Capacity (h)', 'Allocated (h)', 'Available (h)', 'Balance (h)', 'Utilization (%)', 'Status'];
    const csvContent = [
      headers.join(','),
      ...grid.map((row: any) => [
        row.sNo,
        `"${row.employeeName}"`,
        `"${row.employeeId}"`,
        `"${row.role}"`,
        `"${row.department}"`,
        `"${row.currentProject || ''}"`,
        row.capacityHours,
        row.allocatedHours,
        row.availableHours,
        row.balanceHours,
        row.utilizationPercent,
        `"${row.resourceStatus.replace('_', ' ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Resource_Allocation_${MONTHS[month - 1]}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported successfully');
  };

  const navigateMonth = (dir: 1 | -1) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    setMonth(newMonth);
    setYear(newYear);
    setPage(1);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Resource Allocation</h1>
          <p className="text-sm text-muted-foreground">Workforce allocation and utilization management</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Utilization Summary Cards */}
      {utilization && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total Employees', value: utilization.totalEmployees, icon: Users, color: 'text-primary', bg: 'bg-muted' },
            { label: 'Allocated', value: utilization.allocatedEmployees, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'Unallocated', value: utilization.unallocatedEmployees, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Avg Utilization', value: `${utilization.avgUtilizationPercent}%`, icon: BarChart3, color: 'text-success', bg: 'bg-success/10' },
          ].map(card => (
            <div key={card.label} className="kpi-card">
              <div className={`kpi-card-icon ${card.bg} mb-2`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="kpi-value">{card.value}</div>
              <div className="kpi-label">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters Row */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center gap-2 bg-muted rounded-md px-2">
            <button onClick={() => navigateMonth(-1)}
              className="w-7 h-7 flex items-center justify-center hover:text-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium w-24 text-center">{MONTHS[month - 1]} {year}</span>
            <button onClick={() => navigateMonth(1)}
              className="w-7 h-7 flex items-center justify-center hover:text-accent transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search employees..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
            className="form-input w-44"
          >
            <option value="">All Departments</option>
            {departments.map((d: { id: string; name: string }) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Allocation Grid — Main TVS-style table */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th className="w-10 text-center">S.No</th>
                <th>Employee</th>
                <th>Role / Department</th>
                <th>Current Project</th>
                <th className="text-right">Capacity (h)</th>
                <th className="text-right">Allocated (h)</th>
                <th className="text-right">Available (h)</th>
                <th className="text-right">Balance (h)</th>
                <th className="text-center">Utilization</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j}><div className="h-4 shimmer rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : grid.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No resource data found</p>
                  </td>
                </tr>
              ) : grid.map((row: {
                sNo: number; employeeId: string; employeeDbId: string; employeeName: string;
                role: string; department: string; currentProject: string;
                capacityHours: number; allocatedHours: number; availableHours: number;
                balanceHours: number; utilizationPercent: number; resourceStatus: ResourceStatus;
              }) => {
                const statusStyle = STATUS_COLOR[row.resourceStatus] || STATUS_COLOR.AVAILABLE;
                return (
                  <ExpandableResourceRow key={row.employeeDbId} row={row} statusStyle={statusStyle} selectedMonth={month} selectedYear={year} />
                );
              })}
            </tbody>
            {/* Footer totals */}
            {grid.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50 font-semibold border-t-2 border-border">
                  <td colSpan={4} className="text-sm text-muted-foreground py-3 pl-4">TOTALS ({meta?.total ?? grid.length} employees)</td>
                  <td className="text-right text-sm pr-4">{grid.reduce((s: number, r: { capacityHours: number }) => s + r.capacityHours, 0)}</td>
                  <td className="text-right text-sm pr-4 text-accent">{grid.reduce((s: number, r: { allocatedHours: number }) => s + r.allocatedHours, 0)}</td>
                  <td className="text-right text-sm pr-4 text-success">{grid.reduce((s: number, r: { availableHours: number }) => s + r.availableHours, 0)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40">Previous</button>
            <span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span>
            <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceAllocationPage;
