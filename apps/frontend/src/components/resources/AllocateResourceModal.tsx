import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateAllocationSchema, CreateAllocationInput } from '@tvs/shared';
import { resourcesApi, projectsApi } from '../../services/api';
import { toast } from 'sonner';
import { X, Calendar, Clock, Save, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';

interface AllocateResourceModalProps {
  employeeDbId: string;
  employeeName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AllocateResourceModal: React.FC<AllocateResourceModalProps> = ({ employeeDbId, employeeName, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
    enabled: isOpen,
  });
  
  const { data: allocationsRes } = useQuery({
    queryKey: ['employee-allocations', employeeDbId],
    queryFn: () => resourcesApi.getEmployeeAllocations(employeeDbId),
    enabled: isOpen && !!employeeDbId,
  });
  
  const projects = projectsData?.data?.data?.data || [];
  const activeAllocations = allocationsRes?.data?.data || [];
  const assignedProjectIds = new Set<string>(activeAllocations.map((a: any) => a.projectId));
  const availableProjects = projects.filter((p: any) => !assignedProjectIds.has(p.id));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAllocationInput>({
    resolver: zodResolver(CreateAllocationSchema),
    defaultValues: {
      employeeId: employeeDbId,
    },
  });

  // Reset form when opened for a new employee
  React.useEffect(() => {
    if (isOpen) {
      reset({ employeeId: employeeDbId });
    }
  }, [isOpen, employeeDbId, reset]);

  const allocateMutation = useMutation({
    mutationFn: (data: CreateAllocationInput) => resourcesApi.allocate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['employee-allocations'] });
      toast.success('Resource allocated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to allocate resource');
    },
  });

  const onSubmit = (data: any) => {
    // Make sure we pass numbers where necessary
    const submissionData = {
      ...data,
      allocatedHours: Number(data.allocatedHours)
    };
    allocateMutation.mutate(submissionData as CreateAllocationInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold text-primary">Allocate Project</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto">
          <div className="mb-5 p-3 bg-accent/5 border border-accent/20 rounded-md">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Allocating Resource</div>
            <div className="font-medium text-primary">{employeeName}</div>
          </div>

          <form id="allocate-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('employeeId')} />
            
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> Select Project *
              </label>
              <select
                {...register('projectId')}
                className={`form-input w-full ${errors.projectId ? 'border-danger' : ''}`}
              >
                <option value="">Choose a project...</option>
                {availableProjects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.projectCode})</option>
                ))}
              </select>
              {errors.projectId && <p className="text-danger text-xs mt-1">{errors.projectId.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Allocated Hours *
              </label>
              <input
                type="number"
                {...register('allocatedHours', { valueAsNumber: true })}
                className={`form-input w-full ${errors.allocatedHours ? 'border-danger' : ''}`}
                placeholder="e.g. 100"
              />
              {errors.allocatedHours && <p className="text-danger text-xs mt-1">{errors.allocatedHours.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Start Date *
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`form-input w-full ${errors.startDate ? 'border-danger' : ''}`}
                />
                {errors.startDate && <p className="text-danger text-xs mt-1">{errors.startDate.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> End Date *
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`form-input w-full ${errors.endDate ? 'border-danger' : ''}`}
                />
                {errors.endDate && <p className="text-danger text-xs mt-1">{errors.endDate.message as string}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                {...register('notes')}
                className="form-input w-full h-20 resize-none"
                placeholder="Optional assignment notes..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="allocate-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-accent text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Allocate Resource
          </button>
        </div>

      </div>
    </div>
  );
};

export default AllocateResourceModal;
