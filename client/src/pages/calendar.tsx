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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg p-1">
              <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Calendar</h1>
          </div>
        </div>
        
        <Tabs defaultValue={hasConnectedCalendars ? "monthly" : "connections"} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-900/60 border border-blue-800/30 rounded-xl overflow-hidden shadow-lg">
            <TabsTrigger value="monthly" className="flex items-center data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-900 data-[state=active]:to-blue-800 data-[state=active]:text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Monthly</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-900 data-[state=active]:to-blue-800 data-[state=active]:text-white">
              <ListIcon className="w-4 h-4 mr-2" />
              <span>List</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-900 data-[state=active]:to-blue-800 data-[state=active]:text-white">
              <LinkIcon className="w-4 h-4 mr-2" />
              <span>Connections</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-6">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl border border-blue-800 shadow-xl p-4">
              <MonthlyCalendar />
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 shadow-xl">
              <CardHeader className="border-b border-blue-800/50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-md p-1">
                    <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                      <ListIcon className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                  <CardTitle className="text-white">Upcoming Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
                <div className="relative z-10">
                  <CalendarEventsList />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections" className="mt-6">
            <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 shadow-xl">
              <CardHeader className="border-b border-blue-800/50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-md p-1">
                    <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                      <LinkIcon className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                  <CardTitle className="text-white">Calendar Connections</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
                <div className="relative z-10">
                  <CalendarConnections />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}