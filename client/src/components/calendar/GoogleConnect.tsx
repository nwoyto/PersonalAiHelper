import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function GoogleConnect() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  // Check if Google Calendar is already connected
  const { data: integrationStatus, isLoading } = useQuery({
    queryKey: ['/api/calendar/integration-status'],
    refetchOnWindowFocus: false,
  });
  
  const isConnected = integrationStatus?.google === true;

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const response = await apiRequest('/api/calendar/connect', {
        method: 'POST',
        data: { provider: 'google' }
      });
      
      if (response.authUrl) {
        // Open the Google OAuth URL in a new window
        window.open(response.authUrl, 'googleAuthPopup', 'width=600,height=700');
        
        // Show instructions to the user
        toast({
          title: 'Google Calendar Authentication',
          description: 'Please complete the authentication in the popup window.',
        });
        
        // Poll for integration status changes to detect when auth is complete
        const checkInterval = setInterval(async () => {
          await queryClient.invalidateQueries({ queryKey: ['/api/calendar/integration-status'] });
          const newStatus = queryClient.getQueryData(['/api/calendar/integration-status']);
          
          if (newStatus?.google === true) {
            clearInterval(checkInterval);
            
            toast({
              title: 'Calendar Connected!',
              description: 'Your Google Calendar has been connected successfully.',
              variant: 'success',
            });
            
            // Also refresh calendar events
            queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
          }
        }, 2000); // Check every 2 seconds
        
        // Stop checking after 2 minutes if not completed
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 120000);
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    
    try {
      // Find the integration ID first
      const integrations = await apiRequest('/api/calendar/integrations');
      const googleIntegration = integrations.find((i: any) => i.provider === 'google');
      
      if (googleIntegration) {
        await apiRequest(`/api/calendar/integrations/${googleIntegration.id}`, {
          method: 'DELETE'
        });
        
        toast({
          title: 'Calendar Disconnected',
          description: 'Your Google Calendar has been disconnected successfully.',
        });
        
        // Refresh integration status and events
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/integration-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      }
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Unable to disconnect Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return <Button variant="outline" disabled>Checking connection...</Button>;
  }

  return isConnected ? (
    <Button 
      variant="outline" 
      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      onClick={handleDisconnect}
      disabled={isConnecting}
    >
      {isConnecting ? 'Disconnecting...' : 'Google Calendar Connected ✓'}
    </Button>
  ) : (
    <Button 
      variant="default"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
    </Button>
  );
}