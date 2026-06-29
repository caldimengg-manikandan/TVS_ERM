import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateEmployeeSchema, CreateEmployeeInput, EmployeeStatus } from '@tvs/shared';
import { employeesApi, departmentsApi } from '../../services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, Building2, Briefcase, Mail, Phone, Calendar, Clock, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';

const EmployeeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { limit: 100 }],
    queryFn: () => employeesApi.getAll({ limit: 100 }),
  });

  const departments = departmentsData?.data?.data || [];
  const employees = employeesData?.data?.data?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeInput & { skillsText?: string }>({
    resolver: zodResolver(CreateEmployeeSchema.and(z.object({ skillsText: z.string().optional() }))),
    defaultValues: {
      status: EmployeeStatus.ACTIVE,
      skills: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeInput) => employeesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee added successfully');
      navigate('/employees');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    },
  });

  const onSubmit = (data: any) => {
    const submissionData = { ...data };
    
    // Parse comma-separated skills
    if (submissionData.skillsText) {
      submissionData.skills = submissionData.skillsText
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    
    // Remove temporary field
    delete submissionData.skillsText;
    
    // Convert to number
    if (submissionData.experienceYears) {
      submissionData.experienceYears = Number(submissionData.experienceYears);
    }

    createMutation.mutate(submissionData as CreateEmployeeInput);
  };

  return (
    <div className="page-wrapper max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-primary">Add New Employee</h1>
          <p className="text-sm text-muted-foreground">
            Enter the details for the new employee
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <User className="w-5 h-5 text-accent" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID *</label>
                <input
                  {...register('employeeId')}
                  className={`form-input w-full ${errors.employeeId ? 'border-danger' : ''}`}
                  placeholder="e.g. TVS007"
                />
                {errors.employeeId && <p className="text-danger text-xs mt-1">{errors.employeeId.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select {...register('status')} className="form-input w-full">
                  {Object.values(EmployeeStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  {...register('firstName')}
                  className={`form-input w-full ${errors.firstName ? 'border-danger' : ''}`}
                  placeholder="John"
                />
                {errors.firstName && <p className="text-danger text-xs mt-1">{errors.firstName.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  {...register('lastName')}
                  className={`form-input w-full ${errors.lastName ? 'border-danger' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-danger text-xs mt-1">{errors.lastName.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={`form-input w-full ${errors.email ? 'border-danger' : ''}`}
                  placeholder="john.doe@tvs.com"
                />
                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </label>
                <input
                  {...register('phone')}
                  className="form-input w-full"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Briefcase className="w-5 h-5 text-accent" />
              Professional Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Department *
                </label>
                <select
                  {...register('departmentId')}
                  className={`form-input w-full ${errors.departmentId ? 'border-danger' : ''}`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-danger text-xs mt-1">{errors.departmentId.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Designation *</label>
                <input
                  {...register('designation')}
                  className={`form-input w-full ${errors.designation ? 'border-danger' : ''}`}
                  placeholder="e.g. Software Engineer"
                />
                {errors.designation && <p className="text-danger text-xs mt-1">{errors.designation.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Manager
                </label>
                <select
                  {...register('managerId')}
                  className="form-input w-full"
                >
                  <option value="">Select Manager</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joining Date *
                </label>
                <input
                  type="date"
                  {...register('joiningDate')}
                  className={`form-input w-full ${errors.joiningDate ? 'border-danger' : ''}`}
                />
                {errors.joiningDate && <p className="text-danger text-xs mt-1">{errors.joiningDate.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Experience (Years)
                </label>
                <input
                  type="number"
                  step="0.5"
                  {...register('experienceYears')}
                  className="form-input w-full"
                  placeholder="e.g. 5"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Skills
                </label>
                <input
                  {...register('skillsText')}
                  className="form-input w-full"
                  placeholder="e.g. React, Node.js, Project Management (comma separated)"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate skills with commas</p>
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
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeCreatePage;
