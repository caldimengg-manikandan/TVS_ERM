import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, Clock, TrendingUp, Edit2,
  ChevronRight, CheckCircle, AlertCircle, BarChart3, ListTodo,
  UserPlus, Milestone, Archive
} from 'lucide-react';
import { projectsApi, tasksApi } from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'status-badge-active', PLANNING: 'status-badge-planning',
  ON_HOLD: 'status-badge-on-hold', COMPLETED: 'status-badge-completed',
  ARCHIVED: 'status-badge-archived', CANCELLED: 'status-badge-cancelled',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent/10 text-accent',
  REVIEW: 'bg-purple-50 text-purple-700',
  BLOCKED: 'bg-danger/10 text-danger',
  COMPLETED: 'bg-success/10 text-success',
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'milestones' | 'gantt'>('overview');

  const { data: projectRes, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  });

  const { data: tasksRes } = useQuery({
    queryKey: ['tasks', { projectId: id }],
    queryFn: () => tasksApi.getAll({ projectId: id, limit: 50 }),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksApi.updateStatus(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { projectId: id }] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Task status updated');
    },
  });

  const project = projectRes?.data?.data;
  const tasks = tasksRes?.data?.data?.data || [];

  if (isLoading) {
    return (
      <div className="page-wrapper space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`shimmer rounded-lg ${i === 0 ? 'h-32' : 'h-24'}`} />
        ))}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-wrapper text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto text-danger/40 mb-3" />
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const tasksByStatus = {
    OPEN: tasks.filter((t: { status: string }) => t.status === 'OPEN'),
    IN_PROGRESS: tasks.filter((t: { status: string }) => t.status === 'IN_PROGRESS'),
    REVIEW: tasks.filter((t: { status: string }) => t.status === 'REVIEW'),
    COMPLETED: tasks.filter((t: { status: string }) => t.status === 'COMPLETED'),
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'tasks', label: `Tasks (${tasks.length})`, icon: ListTodo },
    { key: 'team', label: `Team (${project.members?.length || 0})`, icon: Users },
    { key: 'milestones', label: `Milestones (${project.milestones?.length || 0})`, icon: Milestone },
    { key: 'gantt', label: 'Gantt Chart', icon: Calendar },
  ];

  const getGanttPosition = (start?: string, end?: string) => {
    if (!start || !end || !project.startDate || !project.endDate) return { left: 0, width: 0 };
    const pStart = new Date(project.startDate).getTime();
    const pEnd = new Date(project.endDate).getTime();
    const tStart = new Date(start).getTime();
    const tEnd = new Date(end).getTime();

    const totalDuration = pEnd - pStart;
    if (totalDuration <= 0) return { left: 0, width: 0 };

    const leftPercent = Math.max(0, Math.min(100, ((tStart - pStart) / totalDuration) * 100));
    const widthPercent = Math.max(1, Math.min(100 - leftPercent, ((tEnd - tStart) / totalDuration) * 100));

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  return (
    <div className="page-wrapper">
      {/* Back + Header */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Project Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-border rounded-lg p-6 mb-5 shadow-card"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                {project.projectCode}
              </span>
              <span className={`status-badge ${STATUS_STYLES[project.status] || ''}`}>
                {project.status.replace('_', ' ')}
              </span>
              <span className={`status-badge priority-${project.priority?.toLowerCase() || 'medium'}`}>
                {project.priority || 'MEDIUM'}
              </span>
              {project.isDelayed && (
                <span className="status-badge bg-danger/10 text-danger flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Delayed
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-primary">{project.name}</h1>
            {project.clientName && (
              <p className="text-sm text-muted-foreground mt-0.5">Client: {project.clientName}</p>
            )}
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2 truncate-2">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate(`/projects/${id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-sm hover:bg-muted transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Project Manager</p>
            <p className="text-sm font-medium">
              {project.projectManager?.firstName} {project.projectManager?.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {format(new Date(project.startDate), 'dd MMM yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">End Date</p>
            <p className={`text-sm font-medium flex items-center gap-1 ${project.isDelayed ? 'text-danger' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(project.endDate), 'dd MMM yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Hours (Planned/Actual)</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {project.plannedHours}h / {project.actualHours}h
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
            <div className="flex items-center gap-2">
              <div className="util-bar flex-1">
                <div
                  className={`util-bar-fill h-2 ${
                    project.completionPercentage >= 80 ? 'bg-success' :
                    project.completionPercentage >= 40 ? 'bg-accent' : 'bg-warning'
                  }`}
                  style={{ width: `${project.completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-primary w-10 text-right">
                {project.completionPercentage}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-card'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Task Status Summary */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="section-title mb-4">Task Status Summary</h3>
            <div className="space-y-3">
              {Object.entries(tasksByStatus).map(([status, items]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-muted-foreground">{status.replace('_', ' ')}</div>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-500 ${
                        status === 'COMPLETED' ? 'bg-success' :
                        status === 'IN_PROGRESS' ? 'bg-accent' :
                        status === 'REVIEW' ? 'bg-purple-500' : 'bg-muted-foreground/30'
                      }`}
                      style={{ width: tasks.length > 0 ? `${(items.length / tasks.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{items.length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Summary */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="section-title mb-4">Milestones</h3>
            <div className="space-y-3">
              {project.milestones?.map((m: {
                id: string; name: string; status: string;
                plannedEndDate: string; completionPercentage: number
              }) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-md">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    m.status === 'COMPLETED' ? 'bg-success' :
                    m.status === 'IN_PROGRESS' ? 'bg-accent' :
                    m.status === 'DELAYED' ? 'bg-danger' : 'bg-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary truncate">{m.name}</p>
                    <p className="text-2xs text-muted-foreground">
                      Due: {format(new Date(m.plannedEndDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary">{m.completionPercentage}%</span>
                </div>
              ))}
              {(!project.milestones || project.milestones.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No milestones defined</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Est. Hours</th>
                <th>Progress</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No tasks found</td></tr>
              ) : tasks.map((task: {
                id: string; name: string; status: string; priority: string;
                estimatedHours: number; completionPercentage: number;
                endDate?: string;
                assignedTo?: { firstName: string; lastName: string };
              }) => (
                <tr key={task.id}>
                  <td className="font-medium">{task.name}</td>
                  <td>{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : <span className="text-muted-foreground">Unassigned</span>}</td>
                  <td><span className={`status-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => statusMutation.mutate({ taskId: task.id, status: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-semibold cursor-pointer focus:outline-none ${TASK_STATUS_COLORS[task.status]}`}
                    >
                      {['OPEN', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td>{task.estimatedHours}h</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="util-bar w-16">
                        <div className={`util-bar-fill ${task.completionPercentage === 100 ? 'bg-success' : 'bg-accent'}`}
                          style={{ width: `${task.completionPercentage}%` }} />
                      </div>
                      <span className="text-xs">{task.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="text-xs">{task.endDate ? format(new Date(task.endDate), 'dd MMM') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {project.members?.map((member: {
            id: string; role: string;
            employee: { id: string; employeeId: string; firstName: string; lastName: string; designation: string }
          }) => (
            <div key={member.id} className="bg-white border border-border rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-bold text-sm">
                    {member.employee.firstName[0]}{member.employee.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{member.employee.firstName} {member.employee.lastName}</p>
                  <p className="text-xs text-muted-foreground">{member.employee.designation}</p>
                  <p className="text-2xs text-accent font-medium">{member.role}</p>
                </div>
              </div>
            </div>
          ))}
          {(!project.members || project.members.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No team members assigned</p>
            </div>
          )}
        </div>
      )}

      {/* Gantt Chart tab content */}
      {activeTab === 'gantt' && (
        <div className="bg-white border border-border rounded-lg shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-base font-bold text-primary">Interactive Project Gantt Chart</h2>
              <p className="text-xs text-muted-foreground">Visualizing task timelines from start to end dates.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Completed</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Review</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> Blocked</span>
            </div>
          </div>

          <div className="gantt-chart-container overflow-x-auto">
            <div className="min-w-[800px] border border-border rounded-md overflow-hidden bg-muted/5">
              {/* Timeline Header Row */}
              <div className="flex border-b border-border bg-muted/20 text-xs font-bold text-muted-foreground">
                <div className="w-1/3 px-4 py-3 border-r border-border">Task Detail</div>
                <div className="w-2/3 relative px-4 py-3">
                  <div className="flex justify-between w-full">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const pStart = new Date(project.startDate).getTime();
                      const pEnd = new Date(project.endDate).getTime();
                      const tickTime = new Date(pStart + ((pEnd - pStart) * i) / 4);
                      return (
                        <span key={i} className="text-2xs font-normal">
                          {format(tickTime, 'MMM dd, yyyy')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Task Rows */}
              <div className="divide-y divide-border/60">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">No tasks assigned to this project</div>
                ) : (
                  tasks.map((task: any) => {
                    const hasDates = task.startDate && task.endDate;
                    const { left, width } = getGanttPosition(task.startDate, task.endDate);

                    return (
                      <div key={task.id} className="flex hover:bg-muted/10 transition-colors items-center">
                        <div className="w-1/3 px-4 py-3.5 border-r border-border">
                          <p className="text-xs font-semibold text-primary truncate" title={task.name}>{task.name}</p>
                          <p className="text-3xs text-muted-foreground mt-0.5">
                            {task.assignedTo ? `Assignee: ${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                          </p>
                        </div>

                        <div className="w-2/3 relative px-4 py-3.5 h-14">
                          <div className="absolute inset-0 flex justify-between pointer-events-none px-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="h-full border-l border-border/25" />
                            ))}
                          </div>

                          {hasDates ? (
                            <div
                              style={{ left, width }}
                              className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md shadow-sm flex items-center px-2 cursor-pointer transition-all hover:scale-[1.01] ${
                                task.status === 'COMPLETED' ? 'bg-success/20 border border-success/35 text-success' :
                                task.status === 'IN_PROGRESS' ? 'bg-accent/20 border border-accent/35 text-accent' :
                                task.status === 'REVIEW' ? 'bg-purple-500/20 border border-purple-500/35 text-purple-700' :
                                task.status === 'BLOCKED' ? 'bg-danger/20 border border-danger/35 text-danger' :
                                'bg-muted-foreground/10 border border-muted-foreground/25 text-muted-foreground'
                              }`}
                            >
                              <span className="text-3xs font-extrabold truncate w-full block">
                                {task.completionPercentage}% ({format(new Date(task.startDate), 'MMM dd')} - {format(new Date(task.endDate), 'MMM dd')})
                              </span>
                            </div>
                          ) : (
                            <span className="text-3xs text-muted-foreground italic flex items-center h-full">Unscheduled (No dates set)</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
