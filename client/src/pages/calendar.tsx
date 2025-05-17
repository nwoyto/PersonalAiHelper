import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, LinkIcon, ListIcon } from "lucide-react";
import CalendarEventsList from '../components/calendar/CalendarEventsList';
import CalendarConnections from '../components/calendar/CalendarConnections';
import MonthlyCalendar from '../components/calendar/MonthlyCalendar';

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
    <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Calendar</h1>
        </div>
        
        <Tabs defaultValue={hasConnectedCalendars ? "monthly" : "connections"} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-900 border border-gray-800">
            <TabsTrigger value="monthly" className="flex items-center data-[state=active]:bg-gray-800">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Monthly</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center data-[state=active]:bg-gray-800">
              <ListIcon className="w-4 h-4 mr-2" />
              <span>List</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center data-[state=active]:bg-gray-800">
              <LinkIcon className="w-4 h-4 mr-2" />
              <span>Connections</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-6">
            <MonthlyCalendar />
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-white">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <CalendarEventsList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-white">Calendar Connections</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <CalendarConnections />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}