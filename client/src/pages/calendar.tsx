import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, ExternalCalendarEvent, CalendarIntegrationState } from "../types";
import CalendarIntegration from "@/components/calendar/CalendarIntegration";
import CalendarViews from "@/components/calendar/CalendarViews";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar as CalendarIcon, Loader2 } from "lucide-react";

type CalendarViewType = "day" | "week" | "month" | "year";

export default function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewType, setViewType] = useState<CalendarViewType>("month");
  
  // Get tasks from the API
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Get synchronized external calendar events
  const { data: externalEvents = [], isError: isExternalEventsError, isLoading: isLoadingEvents } = useQuery<ExternalCalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
  });

  // Get integration status from API
  const { data: integrationState = { google: false, outlook: false, apple: false }, isLoading: isLoadingIntegrationState } = useQuery<CalendarIntegrationState>({
    queryKey: ["/api/calendar/integration-status"],
  });

  // Convert tasks with dueDate to events for appropriate display
  const eventsForSelectedDate = externalEvents.filter(event => {
    if (!event.startTime) return false;
    
    try {
      const eventDate = new Date(event.startTime);
      return eventDate instanceof Date && !isNaN(eventDate.getTime());
    } catch (e) {
      return false;
    }
  });
  
  const anyIntegrationsEnabled = Object.values(integrationState).some(state => state);
  
  return (
    <div>
      <Header title="Calendar">
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={viewType} onValueChange={(value) => value && setViewType(value as CalendarViewType)}>
            <ToggleGroupItem value="day" aria-label="Day view">Day</ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">Week</ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Month view">Month</ToggleGroupItem>
            <ToggleGroupItem value="year" aria-label="Year view">Year</ToggleGroupItem>
          </ToggleGroup>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsIntegrationModalOpen(true)}
          >
            <i className="ri-link mr-1"></i>
            Sync
          </Button>
        </div>
      </Header>
      
      <div className="p-4">
        {/* Integration Modal */}
        {isIntegrationModalOpen && (
          <div className="mb-4">
            <CalendarIntegration onComplete={() => setIsIntegrationModalOpen(false)} />
          </div>
        )}
        
        {/* Calendar View */}
        <CalendarViews
          viewType={viewType}
          date={date}
          onDateChange={setDate}
          events={eventsForSelectedDate}
          tasks={tasks}
          activeTab={activeTab}
        />
        
        {/* Connected Calendar Services */}
        {anyIntegrationsEnabled && (
          <ContentCard className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Connected Calendars</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setActiveTab(activeTab === "all" ? "google" : "all")}
              >
                Filter: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {integrationState.google && (
                <Badge 
                  variant="outline" 
                  className={`bg-red-100 text-red-800 border-red-200 ${activeTab === "google" ? "ring-2 ring-red-400" : ""}`}
                  onClick={() => setActiveTab(activeTab === "google" ? "all" : "google")}
                >
                  <i className="ri-google-fill mr-1"></i> Google
                </Badge>
              )}
              {integrationState.outlook && (
                <Badge 
                  variant="outline" 
                  className={`bg-blue-100 text-blue-800 border-blue-200 ${activeTab === "outlook" ? "ring-2 ring-blue-400" : ""}`}
                  onClick={() => setActiveTab(activeTab === "outlook" ? "all" : "outlook")}
                >
                  <i className="ri-microsoft-fill mr-1"></i> Outlook
                </Badge>
              )}
              {integrationState.apple && (
                <Badge 
                  variant="outline" 
                  className={`bg-gray-100 text-gray-800 border-gray-200 ${activeTab === "apple" ? "ring-2 ring-gray-400" : ""}`}
                  onClick={() => setActiveTab(activeTab === "apple" ? "all" : "apple")}
                >
                  <i className="ri-apple-fill mr-1"></i> Apple
                </Badge>
              )}
            </div>
          </ContentCard>
        )}
        
        {isExternalEventsError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load external calendar events. Please check your calendar integrations.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}