import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateProjectInput } from '@tvs/shared';
import { projectsApi } from '../../services/api';
import { toast } from 'sonner';
import ProjectForm from '../../components/projects/ProjectForm';

const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      navigate('/projects');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  return (
    <ProjectForm
      onSubmit={(data) => createMutation.mutate(data)}
      isSubmitting={createMutation.isPending}
      isEditMode={false}
    />
  );
};

export default ProjectCreatePage;
