import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { capacityApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CapacityPlanningPage: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const { data: overviewRes, isLoading } = useQuery({
    queryKey: ['capacity', 'overview', { month, year }],
    queryFn: () => capacityApi.getOverview({ month, year }),
  });

  const { data: forecastRes } = useQuery({
    queryKey: ['capacity', 'forecast'],
    queryFn: () => capacityApi.getForecast(),
  });

  const overview = overviewRes?.data?.data;
  const forecast = forecastRes?.data?.data || [];

  const navigateMonth = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Capacity Planning</h1>
          <p className="text-sm text-muted-foreground">Department capacity overview and 3-month forecast</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-border rounded-md px-3 py-1.5">
          <button onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
          <span className="text-sm font-medium w-28 text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* 3-Month Forecast Chart */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-card mb-5">
        <h2 className="section-title mb-4">3-Month Capacity Forecast</h2>
        {forecast.length === 0 ? (
          <div className="h-48 shimmer rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecast} barSize={40} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(value: number, name: string) => [`${value}h`, name]}
                contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 6 }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="allocated" name="Allocated" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="#DCFCE7" stroke="#16A34A" strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Department Capacity Overview */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 shimmer rounded-lg" />
          ))
        ) : overview?.departments?.map((dept: {
          departmentId: string; departmentName: string; departmentCode: string;
          employeeCount: number; totalCapacity: number; totalAllocated: number;
          available: number; utilizationPercent: number;
          employees: Array<{
            id: string; name: string; designation: string;
            capacity: number; allocated: number; available: number; utilization: number
          }>
        }) => (
          <motion.div
            key={dept.departmentId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-lg p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-primary">{dept.departmentName}</h3>
                <p className="text-xs text-muted-foreground">{dept.employeeCount} employees</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-primary">{dept.totalCapacity}h</div>
                  <div className="text-2xs text-muted-foreground">Capacity</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-accent">{dept.totalAllocated}h</div>
                  <div className="text-2xs text-muted-foreground">Allocated</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-success">{dept.available}h</div>
                  <div className="text-2xs text-muted-foreground">Available</div>
                </div>
                <div className={`text-center px-3 py-1 rounded-lg ${
                  dept.utilizationPercent > 90 ? 'bg-danger/10' :
                  dept.utilizationPercent > 70 ? 'bg-warning/10' : 'bg-success/10'
                }`}>
                  <div className={`font-bold ${
                    dept.utilizationPercent > 90 ? 'text-danger' :
                    dept.utilizationPercent > 70 ? 'text-warning' : 'text-success'
                  }`}>{dept.utilizationPercent}%</div>
                  <div className="text-2xs text-muted-foreground">Utilization</div>
                </div>
              </div>
            </div>

            {/* Dept Utilization Bar */}
            <div className="util-bar h-2 mb-4">
              <div
                className={`util-bar-fill ${
                  dept.utilizationPercent > 90 ? 'bg-danger' :
                  dept.utilizationPercent > 70 ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${Math.min(100, dept.utilizationPercent)}%` }}
              />
            </div>

            {/* Employee breakdown */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1 pr-4 font-medium">Employee</th>
                    <th className="text-right py-1 px-2 font-medium">Capacity</th>
                    <th className="text-right py-1 px-2 font-medium">Allocated</th>
                    <th className="text-right py-1 px-2 font-medium">Available</th>
                    <th className="py-1 px-2 font-medium w-28">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.employees.map(emp => (
                    <tr key={emp.id} className="border-t border-border/50">
                      <td className="py-1.5 pr-4">
                        <div className="font-medium text-primary">{emp.name}</div>
                        <div className="text-muted-foreground">{emp.designation}</div>
                      </td>
                      <td className="text-right py-1.5 px-2">{emp.capacity}h</td>
                      <td className="text-right py-1.5 px-2 text-accent font-medium">{emp.allocated}h</td>
                      <td className="text-right py-1.5 px-2 text-success font-medium">{emp.available}h</td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="util-bar flex-1">
                            <div
                              className={`util-bar-fill ${
                                emp.utilization > 90 ? 'bg-danger' :
                                emp.utilization > 70 ? 'bg-warning' : 'bg-success'
                              }`}
                              style={{ width: `${Math.min(100, emp.utilization)}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium">{emp.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CapacityPlanningPage;
