import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Eye, Edit2, Archive, MoreVertical,
  FolderKanban, Calendar, Users, Clock, ChevronRight
} from 'lucide-react';
import { projectsApi } from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ProjectStatus, ProjectPriority } from '@tvs/shared';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'status-badge-active',
  PLANNING: 'status-badge-planning',
  ON_HOLD: 'status-badge-on-hold',
  COMPLETED: 'status-badge-completed',
  ARCHIVED: 'status-badge-archived',
  CANCELLED: 'status-badge-cancelled',
};

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: 'priority-critical',
  HIGH: 'priority-high',
  MEDIUM: 'priority-medium',
  LOW: 'priority-low',
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search, status: statusFilter, priority: priorityFilter }],
    queryFn: () => projectsApi.getAll({ page, limit: 20, search, status: statusFilter || undefined, priority: priorityFilter || undefined }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => projectsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project archived');
    },
  });

  const projects = data?.data?.data?.data || [];
  const meta = data?.data?.data?.meta;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {meta?.total ?? 0} projects · Manage your organization's projects
          </p>
        </div>
        <button
          id="create-project-btn"
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-md text-sm font-medium 
                     hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="project-search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code, or client..."
              className="form-input pl-9"
            />
          </div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="form-input w-36"
          >
            <option value="">All Status</option>
            {Object.values(ProjectStatus).map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="form-input w-36"
          >
            <option value="">All Priorities</option>
            {Object.values(ProjectPriority).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Manager</th>
              <th>Timeline</th>
              <th>Progress</th>
              <th>Team</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="h-4 shimmer rounded" /></td>
                  ))}
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No projects found</p>
                </td>
              </tr>
            ) : projects.map((project: {
              id: string;
              projectCode: string;
              name: string;
              clientName?: string;
              status: string;
              priority: string;
              projectManager: { firstName: string; lastName: string };
              startDate: string;
              endDate: string;
              completionPercentage: number;
              teamCount: number;
              isDelayed: boolean;
              daysRemaining: number;
            }) => (
              <motion.tr
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <td>
                  <div>
                    <div className="font-semibold text-primary text-sm">{project.name}</div>
                    <div className="text-2xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-mono bg-muted px-1 rounded">{project.projectCode}</span>
                      {project.clientName && <span>· {project.clientName}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${STATUS_STYLES[project.status] || ''}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${PRIORITY_STYLES[project.priority] || ''}`}>
                    {project.priority}
                  </span>
                </td>
                <td>
                  <span className="text-sm">{project.projectManager?.firstName} {project.projectManager?.lastName}</span>
                </td>
                <td>
                  <div className="text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.startDate), 'dd MMM yyyy')}
                    </div>
                    <div className={`flex items-center gap-1 font-medium ${project.isDelayed ? 'text-danger' : 'text-muted-foreground'}`}>
                      <Clock className="w-3 h-3" />
                      {project.daysRemaining < 0
                        ? `${Math.abs(project.daysRemaining)}d overdue`
                        : `${project.daysRemaining}d remaining`
                      }
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="util-bar w-20">
                      <div
                        className={`util-bar-fill ${
                          project.completionPercentage >= 80 ? 'bg-success' :
                          project.completionPercentage >= 40 ? 'bg-accent' : 'bg-warning'
                        }`}
                        style={{ width: `${project.completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary w-8">{project.completionPercentage}%</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{project.teamCount ?? 0}</span>
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => archiveMutation.mutate(project.id)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-warning transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total} projects
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
