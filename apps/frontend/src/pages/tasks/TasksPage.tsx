import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ListTodo, Search, Filter, Plus, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { tasksApi, projectsApi } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TaskPriority, TaskStatus } from '@tvs/shared';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent/10 text-accent',
  REVIEW: 'bg-purple-50 text-purple-700',
  BLOCKED: 'bg-danger/10 text-danger',
  COMPLETED: 'bg-success/10 text-success',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'priority-critical',
  HIGH: 'priority-high',
  MEDIUM: 'priority-medium',
  LOW: 'priority-low',
};

const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { search, status, priority, projectId, page }],
    queryFn: () => tasksApi.getAll({ search, status: status || undefined, priority: priority || undefined, projectId: projectId || undefined, page, limit: 25 }),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ['projects', { limit: 100 }],
    queryFn: () => projectsApi.getAll({ limit: 100 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      tasksApi.updateStatus(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted'); },
  });

  const tasks = data?.data?.data?.data || [];
  const meta = data?.data?.data?.meta;
  const projects = projectsRes?.data?.data?.data || [];

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Tasks</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} tasks across all projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tasks..." className="form-input pl-9" />
          </div>
          <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setPage(1); }} className="form-input w-48">
            <option value="">All Projects</option>
            {projects.map((p: { id: string; projectCode: string; name: string }) => (
              <option key={p.id} value={p.id}>{p.projectCode} – {p.name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input w-36">
            <option value="">All Status</option>
            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="form-input w-36">
            <option value="">All Priority</option>
            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Est. Hrs</th>
              <th>Progress</th>
              <th>Due Date</th>
              <th className="w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                <td key={j}><div className="h-4 shimmer rounded" /></td>
              ))}</tr>
            )) : tasks.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12">
                <ListTodo className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">No tasks found</p>
              </td></tr>
            ) : tasks.map((task: {
              id: string; name: string; status: string; priority: string;
              estimatedHours: number; completionPercentage: number; endDate?: string;
              project: { projectCode: string; name: string };
              assignedTo?: { firstName: string; lastName: string };
            }) => (
              <motion.tr key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td>
                  <div className="flex items-start gap-2">
                    <CheckSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${task.status === 'COMPLETED' ? 'text-success' : 'text-muted-foreground/40'}`} />
                    <span className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                      {task.name}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="text-xs">
                    <span className="font-mono bg-muted px-1 rounded">{task.project?.projectCode}</span>
                    <p className="text-muted-foreground mt-0.5 truncate max-w-[120px]">{task.project?.name}</p>
                  </div>
                </td>
                <td>{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : <span className="text-muted-foreground text-xs">Unassigned</span>}</td>
                <td><span className={`status-badge text-xs ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span></td>
                <td>
                  <select
                    value={task.status}
                    onChange={(e) => statusMutation.mutate({ id: task.id, newStatus: e.target.value })}
                    className={`text-xs px-2 py-1 rounded-full border-0 font-semibold cursor-pointer focus:outline-none ${STATUS_COLORS[task.status]}`}
                  >
                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="text-sm">{task.estimatedHours}h</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="util-bar w-14">
                      <div className={`util-bar-fill ${task.completionPercentage === 100 ? 'bg-success' : 'bg-accent'}`}
                        style={{ width: `${task.completionPercentage}%` }} />
                    </div>
                    <span className="text-xs">{task.completionPercentage}%</span>
                  </div>
                </td>
                <td className={`text-xs ${task.endDate && new Date(task.endDate) < new Date() && task.status !== 'COMPLETED' ? 'text-danger font-medium' : ''}`}>
                  {task.endDate ? format(new Date(task.endDate), 'dd MMM yyyy') : '—'}
                </td>
                <td>
                  <button onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(task.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Showing {(page-1)*25+1}–{Math.min(page*25, meta.total)} of {meta.total}</p>
          <div className="flex items-center gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40">Previous</button>
            <span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span>
            <button disabled={page===meta.totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
