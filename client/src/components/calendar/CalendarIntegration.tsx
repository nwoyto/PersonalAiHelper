import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ContentCard } from "@/components/ui/content-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      // This would be replaced with actual API calls to initiate OAuth flows
      await apiRequest("POST", "/api/calendar/connect", { providers: enabledProviders });
      
      toast({
        title: "Calendars connected",
        description: "Your calendars are now being synchronized",
      });
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

        <div className="space-y-4 py-2">
          {(Object.keys(providerDetails) as CalendarProvider[]).map(provider => (
            <div key={provider} className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3">
                <i className={`${providerDetails[provider].icon} text-xl ${providerDetails[provider].color}`}></i>
                <span className="font-medium">{providerDetails[provider].name}</span>
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

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting || Object.values(selectedProviders).every(v => !v)}
          >
            {isConnecting ? (
              <>
                <i className="ri-loader-2-line animate-spin mr-2"></i>
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