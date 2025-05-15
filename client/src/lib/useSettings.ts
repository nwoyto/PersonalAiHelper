import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings } from '@/types';
import { queryClient } from './queryClient';

interface UpdateSettingsParams {
  alwaysListening?: boolean;
  wakeWord?: string;
  voiceGender?: 'female' | 'male' | 'neutral';
  saveConversations?: boolean;
}

export function useSettings() {
  // Fetch settings
  const { 
    data: settings,
    isLoading,
    error
  } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    retry: false,
  });

  // Update settings
  const mutation = useMutation({
    mutationFn: async (updatedSettings: UpdateSettingsParams) => {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  // Update settings with optimistic UI update
  const updateSettings = async (updatedSettings: UpdateSettingsParams) => {
    // Optimistically update the UI
    queryClient.setQueryData(['/api/settings'], 
      (oldData: Settings | undefined) => oldData 
        ? { ...oldData, ...updatedSettings } 
        : undefined
    );

    // Perform the actual mutation
    return mutation.mutate(updatedSettings);
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    isUpdating: mutation.isPending,
  };
}