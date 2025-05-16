import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ContentCard } from "@/components/ui/content-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type CalendarProvider = "google" | "outlook" | "apple";

interface CalendarIntegrationProps {
  onComplete: () => void;
}

export default function CalendarIntegration({ onComplete }: CalendarIntegrationProps) {
  const { toast } = useToast();
  const [selectedProviders, setSelectedProviders] = useState<Record<CalendarProvider, boolean>>({
    google: false,
    outlook: false,
    apple: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Get current integration status
  const { data: integrationStatus, isLoading: isLoadingStatus } = useQuery<Record<CalendarProvider, boolean>>({
    queryKey: ["/api/calendar/integration-status"],
  });
  
  // Update selected providers when integration status loads
  useEffect(() => {
    if (integrationStatus) {
      setSelectedProviders({
        google: integrationStatus.google || false,
        outlook: integrationStatus.outlook || false,
        apple: integrationStatus.apple || false
      });
    }
  }, [integrationStatus]);

  const handleProviderToggle = (provider: CalendarProvider) => {
    setSelectedProviders({
      ...selectedProviders,
      [provider]: !selectedProviders[provider]
    });
  };

  const handleConnect = async () => {
    const enabledProviders = Object.entries(selectedProviders)
      .filter(([_, enabled]) => enabled)
      .map(([provider]) => provider);

    if (enabledProviders.length === 0) {
      toast({
        title: "No calendars selected",
        description: "Please select at least one calendar provider to connect",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Connect to selected calendar providers
      const response = await apiRequest("POST", "/api/calendar/connect", { providers: enabledProviders });
      const data = await response.json();
      
      // Show connection results
      if (data.success && data.connections && data.connections.length > 0) {
        // Calculate total events synced
        const totalEvents = data.connections.reduce((total: number, conn: any) => total + (conn.eventCount || 0), 0);
        
        toast({
          title: "Calendars connected",
          description: `Successfully synchronized ${totalEvents} events from ${data.connections.length} calendar(s)`,
        });
        
        // Invalidate calendar-related queries to refresh data
        queryClient.invalidateQueries({queryKey: ["/api/calendar/events"]});
        queryClient.invalidateQueries({queryKey: ["/api/calendar/integration-status"]});
      } else {
        toast({
          title: "Connection partially completed",
          description: "Some calendar providers could not be connected. Please try again.",
        });
      }
      
      onComplete();
    } catch (error) {
      console.error("Failed to connect calendars:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect calendar accounts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const providerDetails = {
    google: {
      name: "Google Calendar",
      icon: "ri-google-fill",
      color: "text-red-500"
    },
    outlook: {
      name: "Outlook Calendar",
      icon: "ri-microsoft-fill",
      color: "text-blue-500"
    },
    apple: {
      name: "Apple Calendar",
      icon: "ri-apple-fill",
      color: "text-gray-700"
    }
  };

  return (
    <ContentCard>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Connect Calendar Accounts</h2>
          <p className="text-text-secondary mb-4">
            Sync your tasks and events with external calendar services. 
            Your account will be connected via secure OAuth, and Jibe AI will only access your calendar data.
          </p>
        </div>

        {isLoadingStatus ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading calendar status...</span>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {(Object.keys(providerDetails) as CalendarProvider[]).map(provider => (
              <div key={provider} className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <i className={`${providerDetails[provider].icon} text-xl ${providerDetails[provider].color}`}></i>
                  <div>
                    <span className="font-medium">{providerDetails[provider].name}</span>
                    {integrationStatus && integrationStatus[provider] && (
                      <div className="text-xs text-green-600 mt-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                        Connected
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id={`${provider}-switch`} 
                    checked={selectedProviders[provider]}
                    onCheckedChange={() => handleProviderToggle(provider)}
                  />
                  <Label htmlFor={`${provider}-switch`}>
                    {selectedProviders[provider] ? "On" : "Off"}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting || isLoadingStatus || Object.values(selectedProviders).every(v => !v)}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect Calendars</>
            )}
          </Button>
        </div>
      </div>
    </ContentCard>
  );
}