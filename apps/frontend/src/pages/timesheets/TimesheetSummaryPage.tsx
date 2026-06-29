import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TrendingDown, TrendingUp, Clock } from 'lucide-react';

const TimesheetSummaryPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['timesheets', 'performance-summary'],
    queryFn: async () => {
      const res = await api.get('/timesheets/summary/performance');
      return res.data.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Timesheet Performance Summary</h1>
        <p className="text-muted-foreground">View employee timesheet records and performance based on allocated hours.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timesheet Data View (All Employees) */}
          <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-card-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Timesheet Data
                </h3>
                <p className="text-sm text-muted-foreground">Total actual timesheet hours logged by employees</p>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-right">Actual Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {data?.allEmployees?.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-muted-foreground">
                        No data available
                      </td>
                    </tr>
                  )}
                  {data?.allEmployees?.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-card-foreground">
                          {row.employee.firstName} {row.employee.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.employee.employeeId}</div>
                      </td>
                      <td className="p-4 text-right font-medium text-card-foreground">{row.actualHours.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Worst Performers (Extra Hours) */}
            <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-danger" />
                    Extra Hours (Over-allocated)
                  </h3>
                  <p className="text-sm text-muted-foreground">Employees logging more hours than allocated</p>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Employee</th>
                      <th className="p-4 text-center">Allocated</th>
                      <th className="p-4 text-center">Actual</th>
                      <th className="p-4 text-right">Extra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {data?.worstPerformers?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No data available
                        </td>
                      </tr>
                    )}
                    {data?.worstPerformers?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-card-foreground">
                            {row.employee.firstName} {row.employee.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{row.employee.employeeId}</div>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">{row.allocatedHours.toFixed(1)}h</td>
                        <td className="p-4 text-center font-medium text-card-foreground">{row.actualHours.toFixed(1)}h</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                            +{row.difference.toFixed(1)}h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Best Performers (Fast Working) */}
            <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Fast Working (Under-allocated)
                  </h3>
                  <p className="text-sm text-muted-foreground">Employees completing work in fewer hours</p>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Employee</th>
                      <th className="p-4 text-center">Allocated</th>
                      <th className="p-4 text-center">Actual</th>
                      <th className="p-4 text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {data?.bestPerformers?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No data available
                        </td>
                      </tr>
                    )}
                    {data?.bestPerformers?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-card-foreground">
                            {row.employee.firstName} {row.employee.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{row.employee.employeeId}</div>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">{row.allocatedHours.toFixed(1)}h</td>
                        <td className="p-4 text-center font-medium text-card-foreground">{row.actualHours.toFixed(1)}h</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
                            -{row.difference.toFixed(1)}h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetSummaryPage;
