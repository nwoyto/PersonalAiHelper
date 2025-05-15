import React, { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, ExternalCalendarEvent, CalendarIntegrationState } from "../types";
import CalendarIntegration from "@/components/calendar/CalendarIntegration";
import ExternalCalendarEventItem from "@/components/calendar/ExternalCalendarEvent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Get tasks from the API
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Get synchronized external calendar events (mock data for demo)
  const { data: externalEvents = [], isError: isExternalEventsError } = useQuery<ExternalCalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    // Mock external events - in a real app, this would come from the backend
    initialData: [
      {
        id: "ext-1",
        title: "Weekly Team Meeting",
        description: "Discuss project progress and roadmap",
        startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
        location: "Conference Room A",
        provider: "outlook",
        externalId: "outlook-123",
      },
      {
        id: "ext-2",
        title: "Dentist Appointment",
        startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).setHours(14, 30, 0, 0).toString(),
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).setHours(15, 30, 0, 0).toString(),
        location: "123 Medical Plaza",
        provider: "google",
        externalId: "google-456",
      },
      {
        id: "ext-3",
        title: "Annual Company Picnic",
        description: "Bring the family! Food and games provided.",
        allDay: true,
        startTime: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        location: "Central Park",
        provider: "apple",
        externalId: "apple-789",
      }
    ],
    enabled: false, // Disabled until backend implementation
  });

  // Get integration status (mock data for demo)
  const { data: integrationState = { google: false, outlook: false, apple: false } } = useQuery<CalendarIntegrationState>({
    queryKey: ["/api/calendar/integration-status"],
    initialData: { google: true, outlook: true, apple: false }, // Mock data
    enabled: false, // Disabled until backend implementation
  });

  // Filter tasks for the selected date
  const tasksForSelectedDate = date 
    ? tasks.filter(task => {
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
          );
        }
        return false;
      })
    : [];
  
  // Filter external events for the selected date
  const eventsForSelectedDate = date
    ? externalEvents.filter(event => {
        const eventDate = new Date(event.startTime || "");
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      })
    : [];
  
  // Get dates that have tasks or events
  const markedDates = [...tasks, ...externalEvents].reduce<Record<string, { tasks: number, events: number }>>((acc, item) => {
    let dateStr;
    
    if ('dueDate' in item && item.dueDate) {
      dateStr = format(new Date(item.dueDate), 'yyyy-MM-dd');
      acc[dateStr] = acc[dateStr] || { tasks: 0, events: 0 };
      acc[dateStr].tasks++;
    } else if ('startTime' in item && item.startTime) {
      dateStr = format(new Date(item.startTime), 'yyyy-MM-dd');
      acc[dateStr] = acc[dateStr] || { tasks: 0, events: 0 };
      acc[dateStr].events++;
    }
    
    return acc;
  }, {});

  // Count total items for the selected date
  const totalItems = tasksForSelectedDate.length + eventsForSelectedDate.length;
  
  // Filter events based on active tab
  const filteredEvents = eventsForSelectedDate.filter(event => {
    if (activeTab === "all") return true;
    return event.provider === activeTab;
  });
  
  const anyIntegrationsEnabled = Object.values(integrationState).some(state => state);
  
  return (
    <div>
      <Header title="Calendar">
        <div className="flex">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsIntegrationModalOpen(true)}
          >
            <i className="ri-link mr-1"></i>
            Sync Calendars
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
        
        {/* Calendar and Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContentCard>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full"
              modifiers={{
                hasItems: (date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return !!markedDates[dateStr];
                }
              }}
              modifiersStyles={{
                hasItems: {
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                  borderRadius: '100%'
                }
              }}
            />
            
            {anyIntegrationsEnabled && (
              <div className="mt-4 flex flex-wrap gap-2">
                {integrationState.google && (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    <i className="ri-google-fill mr-1"></i> Google
                  </Badge>
                )}
                {integrationState.outlook && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    <i className="ri-microsoft-fill mr-1"></i> Outlook
                  </Badge>
                )}
                {integrationState.apple && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                    <i className="ri-apple-fill mr-1"></i> Apple
                  </Badge>
                )}
              </div>
            )}
          </ContentCard>
          
          <ContentCard>
            <h2 className="text-xl font-semibold mb-4">
              {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
            </h2>
            
            {totalItems > 0 ? (
              <div className="space-y-4">
                {/* External Calendar Events */}
                {eventsForSelectedDate.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">Calendar Events</h3>
                      
                      {eventsForSelectedDate.length > 0 && Object.values(integrationState).filter(v => v).length > 1 && (
                        <Tabs defaultValue="all" className="w-auto" value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            {integrationState.google && <TabsTrigger value="google">Google</TabsTrigger>}
                            {integrationState.outlook && <TabsTrigger value="outlook">Outlook</TabsTrigger>}
                            {integrationState.apple && <TabsTrigger value="apple">Apple</TabsTrigger>}
                          </TabsList>
                        </Tabs>
                      )}
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {filteredEvents.map(event => (
                        <ExternalCalendarEventItem key={event.id} event={event} />
                      ))}
                      
                      {filteredEvents.length === 0 && activeTab !== "all" && (
                        <div className="p-3 text-center text-text-secondary border rounded-md bg-surface-light">
                          No events from {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Calendar
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tasks */}
                {tasksForSelectedDate.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tasks</h3>
                    <div className="space-y-3">
                      {tasksForSelectedDate.map(task => (
                        <div key={task.id} className="p-3 border rounded-md bg-surface-light">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={task.completed} 
                                className="h-5 w-5 rounded border-gray-300"
                                readOnly
                              />
                              <span className={task.completed ? "line-through text-text-secondary" : ""}>
                                {task.title}
                              </span>
                            </div>
                            <Badge variant={
                              task.category === "urgent" ? "destructive" : 
                              task.category === "work" ? "default" : 
                              "secondary"
                            }>
                              {task.category}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-text-secondary mt-2 ml-8">{task.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-text-secondary border rounded-md bg-surface-light">
                <i className="ri-calendar-event-line text-3xl mb-2"></i>
                <p>{date ? 'No items on this date' : 'Select a date to view items'}</p>
              </div>
            )}
            
            {isExternalEventsError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load external calendar events. Please check your calendar integrations.
                </AlertDescription>
              </Alert>
            )}
          </ContentCard>
        </div>
      </div>
    </div>
  );
}