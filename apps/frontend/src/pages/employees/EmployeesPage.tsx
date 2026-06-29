import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Users, Filter, Eye, TrendingUp, AlertCircle
} from 'lucide-react';
import { employeesApi, departmentsApi } from '../../services/api';
import { EmployeeStatus } from '@tvs/shared';
import { calculateUtilization, MONTHLY_CAPACITY_HOURS } from '@tvs/shared';

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { page, search, departmentId, status }],
    queryFn: () => employeesApi.getAll({ page, limit: 20, search, departmentId: departmentId || undefined, status: status || undefined }),
  });

  const { data: deptRes } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  });

  const employees = data?.data?.data?.data || [];
  const meta = data?.data?.data?.meta;
  const departments = deptRes?.data?.data || [];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-success/10 text-success',
      INACTIVE: 'bg-muted text-muted-foreground',
      ON_LEAVE: 'bg-warning/10 text-warning',
      TERMINATED: 'bg-danger/10 text-danger',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Employees</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} employees in the system</p>
        </div>
        <button
          id="add-employee-btn"
          onClick={() => navigate('/employees/new')}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, ID, email, designation..."
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
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="form-input w-36"
          >
            <option value="">All Status</option>
            {Object.values(EmployeeStatus).map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Manager</th>
              <th>Skills</th>
              <th>Utilization</th>
              <th>Status</th>
              <th className="w-16">Actions</th>
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
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">No employees found</p>
                </td>
              </tr>
            ) : employees.map((emp: {
              id: string; employeeId: string; firstName: string; lastName: string;
              email: string; designation: string; status: string; skills: string[];
              department: { name: string }; manager?: { firstName: string; lastName: string };
              utilizationPercent?: number;
            }) => {
              const utilization = emp.utilizationPercent ?? 0;
              const utilizationColor = utilization > 100 ? 'bg-danger' : utilization > 80 ? 'bg-warning' : 'bg-success';

              return (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="cursor-pointer"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent text-xs font-bold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-primary">{emp.firstName} {emp.lastName}</div>
                        <div className="text-2xs text-muted-foreground">{emp.employeeId} · {emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department?.name}</td>
                  <td>{emp.designation}</td>
                  <td>{emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : <span className="text-muted-foreground">—</span>}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {emp.skills?.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{skill}</span>
                      ))}
                      {emp.skills?.length > 3 && (
                        <span className="text-2xs text-muted-foreground">+{emp.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="util-bar w-16">
                        <div className={`util-bar-fill ${utilizationColor}`}
                          style={{ width: `${Math.min(100, utilization)}%` }} />
                      </div>
                      <span className={`text-xs font-semibold ${
                        utilization > 100 ? 'text-danger' : utilization > 80 ? 'text-warning' : 'text-success'
                      }`}>{utilization}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge text-xs ${getStatusBadge(emp.status)}`}>
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
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

export default EmployeesPage;
