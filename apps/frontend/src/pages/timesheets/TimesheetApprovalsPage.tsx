import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, MessageSquare, Filter, ChevronDown, Users } from 'lucide-react';
import { timesheetsApi } from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-accent/10 text-accent',
  TEAM_LEAD_APPROVED: 'bg-purple-50 text-purple-700',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
};

const TimesheetApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['timesheets', 'pending'],
    queryFn: () => timesheetsApi.getPending(),
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: 'APPROVE' | 'REJECT'; comment?: string }) =>
      timesheetsApi.approve(id, { action, comments: comment }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', 'pending'] });
      toast.success(`Timesheet ${vars.action === 'APPROVE' ? 'approved' : 'rejected'}`);
      setComments(prev => { const c = { ...prev }; delete c[vars.id]; return c; });
      setExpandedId(null);
    },
    onError: () => toast.error('Failed to process approval'),
  });

  const pendingTimesheets = data?.data?.data || [];

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Timesheet Approvals</h1>
          <p className="text-sm text-muted-foreground">{pendingTimesheets.length} pending approval</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 shimmer rounded-lg" />)}
        </div>
      ) : pendingTimesheets.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-12 text-center shadow-card">
          <CheckCircle className="w-12 h-12 mx-auto text-success/40 mb-3" />
          <p className="text-primary font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">No pending timesheets to approve</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTimesheets.map((ts: {
            id: string; status: string; totalHours: number; weekStartDate: string;
            submittedAt?: string; rejectionReason?: string;
            employee: { id: string; employeeId: string; firstName: string; lastName: string; designation: string; department: { name: string } };
            entries: Array<{ id: string; totalHours: number; task: { name: string }; project: { name: string } }>
          }) => (
            <motion.div
              key={ts.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-lg shadow-card overflow-hidden"
            >
              {/* Main Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === ts.id ? null : ts.id)}
              >
                {/* Employee Avatar */}
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {ts.employee.firstName[0]}{ts.employee.lastName[0]}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{ts.employee.firstName} {ts.employee.lastName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{ts.employee.designation}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{ts.employee.department?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Week of {format(new Date(ts.weekStartDate), 'dd MMM yyyy')}
                    </span>
                    <span className="text-xs font-semibold text-accent">{ts.totalHours}h total</span>
                    {ts.submittedAt && (
                      <span className="text-xs text-muted-foreground">
                        Submitted {format(new Date(ts.submittedAt), 'dd MMM, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`status-badge text-xs ${STATUS_STYLES[ts.status] || ''}`}>
                    {ts.status.replace('_', ' ')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === ts.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === ts.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  {/* Entry breakdown */}
                  <div className="p-4 pb-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1 pr-4 font-medium">Task</th>
                          <th className="text-left py-1 pr-4 font-medium">Project</th>
                          <th className="text-right py-1 font-medium">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ts.entries?.map((entry) => (
                          <tr key={entry.id} className="border-t border-border/50">
                            <td className="py-1.5 pr-4 text-primary">{entry.task?.name}</td>
                            <td className="py-1.5 pr-4 text-muted-foreground">{entry.project?.name}</td>
                            <td className="py-1.5 text-right font-semibold text-accent">{entry.totalHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Comments + Actions */}
                  <div className="p-4 pt-2 bg-muted/30">
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Comments (optional for approval, required for rejection)
                      </label>
                      <textarea
                        value={comments[ts.id] || ''}
                        onChange={(e) => setComments(prev => ({ ...prev, [ts.id]: e.target.value }))}
                        rows={2}
                        placeholder="Add a comment..."
                        className="form-input resize-none text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => approveMutation.mutate({ id: ts.id, action: 'REJECT', comment: comments[ts.id] })}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger border border-danger/30 
                                   rounded-md text-sm font-medium hover:bg-danger/20 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => approveMutation.mutate({ id: ts.id, action: 'APPROVE', comment: comments[ts.id] })}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-success text-white 
                                   rounded-md text-sm font-medium hover:bg-success/90 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {ts.status === 'SUBMITTED' ? 'TL Approve' : 'Final Approve'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimesheetApprovalsPage;
