import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon, MicrosoftIcon, AppleIcon } from './CalendarIcons';

export default function CalendarConnections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check connection status for different calendar providers
  const { data: integrationStatus, isLoading } = useQuery({
    queryKey: ['/api/calendar/integration-status'],
    refetchOnWindowFocus: false,
  });
  
  const isConnected = {
    google: integrationStatus && typeof integrationStatus === 'object' && 'google' in integrationStatus && integrationStatus.google === true,
    outlook: integrationStatus && typeof integrationStatus === 'object' && 'outlook' in integrationStatus && integrationStatus.outlook === true,
    apple: integrationStatus && typeof integrationStatus === 'object' && 'apple' in integrationStatus && integrationStatus.apple === true
  };
  
  const connectCalendar = async (provider: string) => {
    try {
      const response = await apiRequest('/api/calendar/connect', {
        method: 'POST',
        data: { provider }
      });
      
      if (response && typeof response === 'object' && 'authUrl' in response) {
        // Open the OAuth URL in a new window
        window.open(response.authUrl, `${provider}AuthPopup`, 'width=600,height=700');
        
        // Show instructions to the user
        toast({
          title: 'Calendar Authentication',
          description: `Please complete the ${provider} authentication in the popup window.`,
        });
        
        // Poll for integration status changes to detect when auth is complete
        const checkInterval = setInterval(async () => {
          await queryClient.invalidateQueries({ queryKey: ['/api/calendar/integration-status'] });
          const newStatus = queryClient.getQueryData(['/api/calendar/integration-status']);
          
          if (newStatus && typeof newStatus === 'object' && provider in newStatus && newStatus[provider] === true) {
            clearInterval(checkInterval);
            
            toast({
              title: 'Calendar Connected!',
              description: `Your ${provider} Calendar has been connected successfully.`,
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
      console.error('Failed to connect calendars:', error);
      toast({
        title: 'Connection Failed',
        description: `Unable to connect to ${provider} Calendar. Please try again.`,
        variant: 'destructive',
      });
    }
  };
  
  const disconnectCalendar = async (provider: string) => {
    try {
      // Find the integration ID first
      const integrations = await apiRequest('/api/calendar/integrations', {});
      
      if (Array.isArray(integrations)) {
        const integration = integrations.find((i: any) => i.provider === provider.toLowerCase());
        
        if (integration) {
          await apiRequest(`/api/calendar/integrations/${integration.id}`, {
            method: 'DELETE'
          });
          
          toast({
            title: 'Calendar Disconnected',
            description: `Your ${provider} Calendar has been disconnected successfully.`,
          });
          
          // Refresh integration status and events
          queryClient.invalidateQueries({ queryKey: ['/api/calendar/integration-status'] });
          queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
        }
      }
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast({
        title: 'Disconnection Failed',
        description: `Unable to disconnect ${provider} Calendar. Please try again.`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Google Calendar */}
      <CalendarCard
        title="Google Calendar"
        description="Sync your Google Calendar events"
        icon={<GoogleIcon className="w-8 h-8" />}
        isConnected={isConnected.google}
        isLoading={isLoading}
        onConnect={() => connectCalendar('google')}
        onDisconnect={() => disconnectCalendar('google')}
      />
      
      {/* Outlook Calendar */}
      <CalendarCard
        title="Outlook Calendar"
        description="Sync your Microsoft Outlook events"
        icon={<MicrosoftIcon className="w-8 h-8" />}
        isConnected={isConnected.outlook}
        isLoading={isLoading}
        onConnect={() => connectCalendar('outlook')}
        onDisconnect={() => disconnectCalendar('outlook')}
        comingSoon={true}
      />
      
      {/* Apple Calendar */}
      <CalendarCard
        title="Apple Calendar"
        description="Sync your Apple Calendar events"
        icon={<AppleIcon className="w-8 h-8" />}
        isConnected={isConnected.apple}
        isLoading={isLoading}
        onConnect={() => connectCalendar('apple')}
        onDisconnect={() => disconnectCalendar('apple')}
        comingSoon={true}
      />
    </div>
  );
}

interface CalendarCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  comingSoon?: boolean;
}

function CalendarCard({ title, description, icon, isConnected, isLoading, onConnect, onDisconnect, comingSoon }: CalendarCardProps) {
  return (
    <Card className={`overflow-hidden ${isConnected ? 'border-green-300' : 'border-gray-200'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {isConnected && <span className="text-xs text-green-600 font-medium">Connected</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter className="bg-gray-50 pt-2 pb-3 px-6">
        {comingSoon ? (
          <Button variant="outline" disabled className="w-full">
            Coming Soon
          </Button>
        ) : isLoading ? (
          <Button variant="outline" disabled className="w-full">
            Loading...
          </Button>
        ) : isConnected ? (
          <Button 
            variant="outline" 
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="w-full"
            onClick={onConnect}
          >
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}