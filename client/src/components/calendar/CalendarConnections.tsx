import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient as defaultQueryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Calendar service icons
function GoogleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
      <path d="M3.15302 7.3455L6.43852 9.755C7.32752 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z" fill="#FF3D00"/>
      <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39897 18 7.19047 16.3415 6.35847 14.027L3.09747 16.5395C4.75247 19.778 8.11347 22 12 22Z" fill="#4CAF50"/>
      <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
    </svg>
  );
}

function MicrosoftIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4 24H0V12.6H11.4V24Z" fill="#F1511B"/>
      <path d="M24 24H12.6V12.6H24V24Z" fill="#80CC28"/>
      <path d="M11.4 11.4H0V0H11.4V11.4Z" fill="#00ADEF"/>
      <path d="M24 11.4H12.6V0H24V11.4Z" fill="#FBBC09"/>
    </svg>
  );
}

function AppleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.7484 0C16.8134 0 16.8784 0 16.9444 0C17.0434 1.413 16.6074 2.436 15.9534 3.229C15.3184 4.007 14.4714 4.696 13.0974 4.57C13.0214 3.185 13.4674 2.191 14.1194 1.398C14.7254 0.648 15.7824 0.068 16.7484 0Z" fill="#999999"/>
      <path d="M21.3055 17.8876C21.3055 17.9146 21.3055 17.9406 21.3055 17.9676C20.8755 19.3746 20.2165 20.6346 19.3725 21.7996C18.6255 22.8316 17.7615 24.0006 16.3755 24.0006C15.1845 24.0006 14.3965 23.3446 13.2385 23.3146C12.0205 23.2836 11.2835 23.8826 10.1215 24.0006C10.0195 24.0006 9.91846 24.0006 9.81646 24.0006C8.74146 23.9216 7.87946 22.9016 7.21946 21.9876C5.67346 19.7916 4.47046 17.0556 4.31046 13.7456C4.31046 13.4856 4.31046 13.2266 4.31046 12.9676C4.36146 10.6606 5.40146 8.78859 6.84246 7.80859C7.63246 7.26959 8.63746 6.85659 9.77246 6.95859C10.2535 6.99859 10.7345 7.11559 11.1715 7.24859C11.5815 7.37559 12.0485 7.58759 12.5045 7.58759C12.8305 7.58759 13.1555 7.43359 13.5785 7.30659C14.5205 7.01259 15.4115 6.67759 16.5435 6.80959C16.8205 6.83259 17.0965 6.86959 17.3685 6.92859C18.5495 7.18459 19.4835 7.76759 20.1195 8.56859C19.0614 9.26059 18.2394 10.3006 18.0854 11.9376C17.9454 13.4286 18.5194 14.7046 19.4425 15.4876C19.8405 15.8286 20.2925 16.0916 20.7765 16.3376C20.9665 16.8026 21.1465 17.2906 21.3055 17.8876Z" fill="#999999"/>
    </svg>
  );
}

interface CalendarProvider {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  comingSoon?: boolean;
}

// Calendar services configuration
const calendarProviders: CalendarProvider[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Connect to Google Calendar to sync your events, meetings, and reminders.',
    icon: GoogleIcon
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Sync your Outlook calendar events from work and personal accounts.',
    icon: MicrosoftIcon,
    comingSoon: true
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    description: 'Connect your Apple Calendar to synchronize all your iOS and macOS events.',
    icon: AppleIcon,
    comingSoon: false
  }
];

// Type for our connection status
interface ConnectionStatus {
  [key: string]: boolean;
}

export default function CalendarConnections() {
  const { toast } = useToast();
  const queryClient = useQueryClient() || defaultQueryClient;
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  
  // Check connection status for different calendar providers
  const { data, isLoading } = useQuery({
    queryKey: ['/api/calendar/integration-status'],
    refetchOnWindowFocus: false,
  });
  
  // Convert data to properly typed connection status
  const integrationStatus: ConnectionStatus = (data && typeof data === 'object') 
    ? data as ConnectionStatus 
    : { google: false, outlook: false, apple: false };
  
  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    
    try {
      const response = await fetch('/api/calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: providerId })
      });
      
      const data = await response.json();
      
      if (data && typeof data === 'object' && 'authUrl' in data) {
        // Open the OAuth URL in a new window
        window.open(data.authUrl, `${providerId}AuthPopup`, 'width=600,height=700');
        
        // Show instructions to the user
        toast({
          title: 'Calendar Authentication',
          description: `Please complete the authentication in the popup window.`,
        });
        
        // Poll for integration status changes to detect when auth is complete
        const checkInterval = setInterval(async () => {
          await queryClient.invalidateQueries({ queryKey: ['/api/calendar/integration-status'] });
          const newStatus = queryClient.getQueryData(['/api/calendar/integration-status']) as ConnectionStatus;
          
          if (newStatus && typeof newStatus === 'object' && providerId in newStatus && newStatus[providerId] === true) {
            clearInterval(checkInterval);
            
            toast({
              title: 'Calendar Connected!',
              description: `Your calendar has been connected successfully.`,
            });
            
            // Also refresh calendar events
            queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
          }
        }, 2000); // Check every 2 seconds
        
        // Stop checking after 2 minutes if not completed
        setTimeout(() => {
          clearInterval(checkInterval);
          if (connecting === providerId) {
            setConnecting(null);
          }
        }, 120000);
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
      toast({
        title: 'Connection Failed',
        description: `Unable to connect to calendar. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setConnecting(null);
    }
  };
  
  const handleDisconnect = async (providerId: string) => {
    setDisconnecting(providerId);
    
    try {
      // Find the integration ID first
      const response = await fetch('/api/calendar/integrations');
      const integrations = await response.json();
      
      if (Array.isArray(integrations)) {
        const integration = integrations.find(i => i.provider === providerId.toLowerCase());
        
        if (integration) {
          await fetch(`/api/calendar/integrations/${integration.id}`, {
            method: 'DELETE'
          });
          
          toast({
            title: 'Calendar Disconnected',
            description: `Your calendar has been disconnected successfully.`,
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
        description: `Unable to disconnect calendar. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(null);
    }
  };
  
  return (
    <div className="grid gap-6 md:grid-cols-3 sm:grid-cols-2">
      {calendarProviders.map(provider => (
        <CalendarCard
          key={provider.id}
          provider={provider}
          isConnected={integrationStatus[provider.id] || false}
          isConnecting={connecting === provider.id}
          isDisconnecting={disconnecting === provider.id}
          isLoading={isLoading}
          onConnect={() => handleConnect(provider.id)}
          onDisconnect={() => handleDisconnect(provider.id)}
        />
      ))}
    </div>
  );
}

interface CalendarCardProps {
  provider: CalendarProvider;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function CalendarCard({ 
  provider, 
  isConnected, 
  isConnecting, 
  isDisconnecting, 
  isLoading, 
  onConnect, 
  onDisconnect 
}: CalendarCardProps) {
  const Icon = provider.icon;
  
  return (
    <Card className={`overflow-hidden bg-gray-900 border-gray-800 ${isConnected ? 'border-green-800' : 'border-gray-800'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="w-8 h-8" />
            <div>
              <CardTitle className="text-lg text-white">{provider.name}</CardTitle>
              {isConnected && <span className="text-xs text-green-400 font-medium">Connected</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <CardDescription className="text-gray-400">{provider.description}</CardDescription>
      </CardContent>
      <CardFooter className="bg-gray-950 pt-2 pb-3 px-6">
        {provider.comingSoon ? (
          <Button variant="outline" disabled className="w-full bg-gray-800 text-gray-400 border-gray-700">
            Coming Soon
          </Button>
        ) : isLoading ? (
          <Button variant="outline" disabled className="w-full bg-gray-800 text-gray-400 border-gray-700">
            Loading...
          </Button>
        ) : isConnected ? (
          <Button 
            variant="outline" 
            className="w-full bg-gray-900 border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300"
            onClick={onDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}