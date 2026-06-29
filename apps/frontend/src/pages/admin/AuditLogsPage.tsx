import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/api';
import { Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-accent/10 text-accent',
  DELETE: 'bg-danger/10 text-danger',
  LOGIN: 'bg-purple-50 text-purple-700',
  LOGOUT: 'bg-muted text-muted-foreground',
  APPROVE: 'bg-green-50 text-green-700',
  REJECT: 'bg-red-50 text-red-700',
  EXPORT: 'bg-orange-50 text-orange-700',
};

const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, action, entityType, startDate, endDate }],
    queryFn: () => auditApi.getLogs({ page, limit: 25, action: action || undefined, entityType: entityType || undefined, startDate: startDate || undefined, endDate: endDate || undefined }),
  });

  const logs = data?.data?.data?.data || [];
  const meta = data?.data?.data?.meta;

  return (
    <div className="page-wrapper">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Complete system activity trail · {meta?.total ?? 0} records</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4 mb-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="form-input w-32">
            <option value="">All Actions</option>
            {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','APPROVE','REJECT','EXPORT'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            placeholder="Entity type..." className="form-input w-36" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="form-input w-36" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="form-input w-36" />
          <button onClick={() => { setAction(''); setEntityType(''); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Clear filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Description</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                <td key={j}><div className="h-4 shimmer rounded" /></td>
              ))}</tr>
            )) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No logs found</td></tr>
            ) : logs.map((log: {
              id: string; action: string; entityType: string; entityId?: string; description: string;
              ipAddress?: string; createdAt: string;
              user: { firstName: string; lastName: string; email: string }
            }) => (
              <tr key={log.id}>
                <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss')}
                </td>
                <td>
                  <div className="text-xs font-medium">{log.user?.firstName} {log.user?.lastName}</div>
                  <div className="text-2xs text-muted-foreground">{log.user?.email}</div>
                </td>
                <td>
                  <span className={`status-badge text-xs ${ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'}`}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <div className="text-xs font-medium">{log.entityType}</div>
                  {log.entityId && <div className="text-2xs text-muted-foreground font-mono">{log.entityId.slice(0, 8)}...</div>}
                </td>
                <td className="text-xs max-w-[300px] truncate" title={log.description}>{log.description}</td>
                <td className="text-xs font-mono text-muted-foreground">{log.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Page {page} of {meta.totalPages} · {meta.total} total records</p>
          <div className="flex items-center gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40 flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button disabled={page===meta.totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-40 flex items-center gap-1">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
