import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../../services/api';
import { Building2, Plus, Edit2, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const DepartmentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department deactivated'); },
  });

  const departments = data?.data?.data || [];

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Departments</h1>
          <p className="text-sm text-muted-foreground">{departments.length} departments in the organization</p>
        </div>
        <button className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 shimmer rounded-lg" />
        )) : departments.map((dept: {
          id: string; name: string; code: string; description?: string; isActive: boolean;
          _count: { employees: number }; children: Array<{ id: string; name: string }>
        }) => (
          <div key={dept.id} className="bg-white border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{dept.code}</span>
            </div>
            <h3 className="font-semibold text-primary mb-0.5">{dept.name}</h3>
            {dept.description && <p className="text-xs text-muted-foreground mb-3 truncate">{dept.description}</p>}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{dept._count?.employees || 0} employees</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {dept.children?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-2xs text-muted-foreground mb-1">Sub-departments</p>
                {dept.children.map(c => (
                  <div key={c.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3" /> {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsPage;
