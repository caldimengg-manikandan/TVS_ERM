import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../services/api';
import { toast } from 'sonner';
import ProjectForm from '../../components/projects/ProjectForm';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ProjectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  });

  const project = data?.data?.data;

  const updateMutation = useMutation({
    mutationFn: (updateData: any) => projectsApi.update(id!, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success('Project updated successfully');
      navigate(`/projects/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update project');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        Project not found
      </div>
    );
  }

  // Format dates and clean up null values for the form inputs
  const initialData = {
    ...project,
    startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : undefined,
    endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : undefined,
    departmentId: project.departmentId || undefined,
    clientName: project.clientName || undefined,
    location: project.location || undefined,
  };

  return (
    <ProjectForm
      initialData={initialData}
      onSubmit={(updateData) => updateMutation.mutate(updateData)}
      isSubmitting={updateMutation.isPending}
      isEditMode={true}
    />
  );
};

export default ProjectEditPage;
