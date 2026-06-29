import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CreateProjectSchema, CreateProjectInput } from '../../../../../packages/shared/src/schemas';
import { ProjectStatus } from '../../../../../packages/shared/src/constants';
import { departmentsApi } from '../../services/api';
import { ArrowLeft, Save, Building2, FileText, Calendar, DollarSign, Clock } from 'lucide-react';
import { z } from 'zod';

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

interface ProjectFormProps {
  initialData?: Partial<CreateProjectInput>;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSubmit, isSubmitting, isEditMode = false }) => {
  const navigate = useNavigate();

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  });

  const departments = departmentsData?.data?.data || [];

  // Determine which schema to use based on mode (if needed, but usually partial for edit is handled at api level)
  // We'll use the full schema since all fields are rendered and required fields should still be required
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      status: ProjectStatus.YET_TO_START,
      ...initialData,
    },
  });

  const [inputType, setInputType] = React.useState<'hours' | 'days'>('hours');

  const plannedHoursValue = watch('plannedHours') || 0;
  const calculatedDays = plannedHoursValue ? (Number(plannedHoursValue) / 8).toFixed(1) : 0;
  
  const displayValue = inputType === 'hours' ? plannedHoursValue : Number(calculatedDays);

  const handleFormSubmit = (data: CreateProjectInput) => {
    // Convert strings to numbers where necessary
    const submissionData = {
      ...data,
      plannedHours: data.plannedHours ? Number(data.plannedHours) : undefined,
    };
    onSubmit(submissionData);
  };

  return (
    <div className="page-wrapper max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-primary">{isEditMode ? 'Edit Project' : 'Create New Project'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? 'Update the details of the project' : 'Fill in the details to start a new project'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-card p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <input type="hidden" {...register('plannedHours', { valueAsNumber: true })} />

          {/* Validation Errors Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 mb-4 bg-danger/10 border border-danger/20 text-danger rounded-md text-sm">
              <p className="font-semibold mb-1">Please fix the following validation errors:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    <strong>{field === 'projectCode' ? 'Project Code' : field === 'clientName' ? 'Plant Name' : field === 'departmentId' ? 'Department' : field === 'plannedHours' ? 'Planned Hours' : field}</strong>: {error.message || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-accent" />
              General Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project/MH Asset *</label>
                <input
                  {...register('name')}
                  className={`form-input w-full ${errors.name ? 'border-danger' : ''}`}
                  placeholder="e.g. Website Redesign"
                />
                {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project Code *</label>
                <input
                  {...register('projectCode')}
                  className={`form-input w-full ${errors.projectCode ? 'border-danger' : ''}`}
                  placeholder="e.g. PRJ-001"
                />
                {errors.projectCode && <p className="text-danger text-xs mt-1">{errors.projectCode.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Plant Name</label>
                <input
                  {...register('clientName')}
                  className="form-input w-full"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  {...register('location')}
                  className={`form-input w-full ${errors.location ? 'border-danger' : ''}`}
                >
                  <option value="">Select Location</option>
                  <option value="Hosur Plant">Hosur Plant</option>
                  <option value="Mysore Plant">Mysore Plant</option>
                  <option value="Nalagarh Plant">Nalagarh Plant</option>
                  <option value="Chennai HQ">Chennai HQ</option>
                  <option value="Padi Plant">Padi Plant (Chennai)</option>
                  <option value="Sriperumbudur">Sriperumbudur</option>
                  <option value="Oragadam">Oragadam</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Bangalore R&D">Bangalore R&D</option>
                  <option value="Pune Office">Pune Office</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Harita Campus">Harita Campus</option>
                </select>
                {errors.location && <p className="text-danger text-xs mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  {...register('departmentId', { setValueAs: (v) => v === "" ? undefined : v })}
                  className={`form-input w-full ${errors.departmentId ? 'border-danger' : ''}`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-danger text-xs mt-1">{errors.departmentId.message}</p>}
              </div>
            </div>
          </div>

          {/* Timeline & Resources */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Calendar className="w-5 h-5 text-accent" />
              Timeline & Resources
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`form-input w-full ${errors.startDate ? 'border-danger' : ''}`}
                />
                {errors.startDate && <p className="text-danger text-xs mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`form-input w-full ${errors.endDate ? 'border-danger' : ''}`}
                />
                {errors.endDate && <p className="text-danger text-xs mt-1">{errors.endDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1 justify-between">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {inputType === 'hours' ? 'Hours' : 'Days'}</span>
                  {plannedHoursValue > 0 && (
                    <span className="text-xs text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded">
                      ~ {inputType === 'hours' ? `${calculatedDays} Days` : `${plannedHoursValue} Hours`}
                    </span>
                  )}
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={displayValue || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (inputType === 'hours') {
                        setValue('plannedHours', val, { shouldValidate: true });
                      } else {
                        setValue('plannedHours', val * 8, { shouldValidate: true });
                      }
                    }}
                    className={`form-input flex-1 ${errors.plannedHours ? 'border-danger' : ''}`}
                    placeholder={`e.g. ${inputType === 'hours' ? '40' : '5'}`}
                  />
                  <div className="flex bg-muted rounded-md p-1 shrink-0 w-32">
                    <button 
                      type="button" 
                      onClick={() => setInputType('hours')} 
                      className={`flex-1 text-xs font-medium py-1 rounded transition-colors ${inputType === 'hours' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                      Hours
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setInputType('days')} 
                      className={`flex-1 text-xs font-medium py-1 rounded transition-colors ${inputType === 'days' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                      Days
                    </button>
                  </div>
                </div>
                {errors.plannedHours && <p className="text-danger text-xs mt-1">{errors.plannedHours.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select {...register('status')} className="form-input w-full">
                  <option value="YET_TO_START">YET TO START</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-accent text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditMode ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
