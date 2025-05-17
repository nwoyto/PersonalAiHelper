import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, LinkIcon } from "lucide-react";
import CalendarEventsList from '../components/calendar/CalendarEventsList';
import CalendarConnections from '../components/calendar/CalendarConnections';

export default function CalendarPage() {
  // Check if any calendars are connected
  const { data: integrationStatus } = useQuery({
    queryKey: ['/api/calendar/integration-status'],
    refetchOnWindowFocus: false,
  });
  
  // Check if at least one calendar is connected
  const hasConnectedCalendars = 
    integrationStatus && 
    typeof integrationStatus === 'object' && 
    Object.values(integrationStatus).some(v => v === true);
  
  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Calendar</h1>
        </div>
        
        <Tabs defaultValue={hasConnectedCalendars ? "events" : "connections"} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events" className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Events</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center">
              <LinkIcon className="w-4 h-4 mr-2" />
              <span>Connections</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarEventsList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarConnections />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}