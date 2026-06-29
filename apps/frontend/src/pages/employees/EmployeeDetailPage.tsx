import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Calendar, Building2, Users, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { employeesApi } from '../../services/api';
import { format } from 'date-fns';

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const now = new Date();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.getById(id!),
    enabled: !!id,
  });

  const { data: availRes } = useQuery({
    queryKey: ['employee-availability', id],
    queryFn: () => employeesApi.getAvailability(id!, now.getMonth() + 1, now.getFullYear()),
    enabled: !!id,
  });

  const emp = data?.data?.data;
  const availability = availRes?.data?.data;

  if (isLoading) return (
    <div className="page-wrapper space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 shimmer rounded-lg" />)}
    </div>
  );

  if (!emp) return (
    <div className="page-wrapper text-center py-20">
      <p className="text-muted-foreground">Employee not found</p>
    </div>
  );

  return (
    <div className="page-wrapper">
      <button onClick={() => navigate('/employees')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-lg p-6 shadow-card text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-accent text-2xl font-bold">{emp.firstName[0]}{emp.lastName[0]}</span>
            </div>
            <h1 className="text-lg font-bold text-primary">{emp.firstName} {emp.lastName}</h1>
            <p className="text-sm text-muted-foreground">{emp.designation}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {emp.employeeId}
            </span>

            <div className="mt-5 pt-5 border-t border-border space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-primary truncate">{emp.email}</span>
              </div>
              {emp.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{emp.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{emp.department?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined {format(new Date(emp.joiningDate), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>{emp.experienceYears} years experience</span>
              </div>
              {emp.manager && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Reports to {emp.manager.firstName} {emp.manager.lastName}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {emp.skills?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border text-left">
                <p className="text-xs font-semibold text-muted-foreground mb-2">SKILLS</p>
                <div className="flex flex-wrap gap-1.5">
                  {emp.skills.map((skill: string) => (
                    <span key={skill} className="text-xs bg-accent/5 border border-accent/20 text-accent px-2 py-0.5 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Availability Card */}
          {availability && (
            <div className="bg-white border border-border rounded-lg p-5 shadow-card">
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Current Month Availability
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Capacity', value: `${availability.capacityHours}h`, color: 'text-primary' },
                  { label: 'Allocated', value: `${availability.allocatedHours}h`, color: 'text-accent' },
                  { label: 'Available', value: `${availability.availableHours}h`, color: 'text-success' },
                  { label: 'Utilization', value: `${availability.utilizationPercent}%`, color: availability.utilizationPercent > 100 ? 'text-danger' : availability.utilizationPercent > 80 ? 'text-warning' : 'text-success' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="util-bar h-3">
                  <div
                    className={`util-bar-fill ${
                      availability.utilizationPercent > 100 ? 'bg-danger' :
                      availability.utilizationPercent > 80 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(100, availability.utilizationPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Allocations */}
          <div className="bg-white border border-border rounded-lg p-5 shadow-card">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Active Allocations
            </h3>
            {emp.resourceAllocations?.length > 0 ? (
              <div className="space-y-2">
                {emp.resourceAllocations.map((alloc: {
                  id: string; allocatedHours: number; startDate: string; endDate: string;
                  project: { projectCode: string; name: string; status: string }
                }) => (
                  <div key={alloc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-primary">{alloc.project?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alloc.startDate), 'dd MMM')} – {format(new Date(alloc.endDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{alloc.allocatedHours}h</p>
                      <p className="text-2xs text-muted-foreground">allocated</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No active allocations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
