import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, LinkIcon, ListIcon, Clock } from "lucide-react";
import CalendarEventsList from '../components/calendar/CalendarEventsList';
import CalendarConnections from '../components/calendar/CalendarConnections';
import MonthlyCalendar from '../components/calendar/MonthlyCalendar';

export default function CalendarPage() {
  // Check if any calendars are connected
  const { data: integrationStatus } = useQuery({
    queryKey: ['/api/calendar/integration-status'],
    refetchOnWindowFocus: false,
  });
  
  // Get calendar events
  const { data: calendarEvents } = useQuery({
    queryKey: ['/api/calendar/events'],
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
          <TabsList className="grid w-full max-w-md grid-cols-5 bg-gray-900/60 border border-blue-800/30 rounded-xl overflow-hidden shadow-lg">
            <TabsTrigger value="day" className="flex items-center data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-900 data-[state=active]:to-blue-800 data-[state=active]:text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Day</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-900 data-[state=active]:to-blue-800 data-[state=active]:text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Week</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-900 data-[state=active]:to-blue-800 data-[state=active]:text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Month</span>
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
          
          <TabsContent value="day" className="mt-6">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl border border-blue-800 shadow-xl p-4">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">Day View</h3>
                <p className="text-blue-300">Day view will be available in the next update.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl border border-blue-800 shadow-xl p-4">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">Week View</h3>
                <p className="text-blue-300">Week view will be available in the next update.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl border border-blue-800 shadow-xl p-4">
              <MonthlyCalendar />
              
              {/* Additional features below calendar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Quick calendar stats - More translucent */}
                <Card className="bg-gradient-to-br from-indigo-950/70 to-blue-950/70 border border-blue-800/30 shadow-lg backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-300">Calendar Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {Array.isArray(calendarEvents) ? calendarEvents.length : 0} Events
                      </div>
                      <div className="w-9 h-9 rounded-full bg-indigo-900/30 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-blue-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Today's events summary - More translucent */}
                <Card className="bg-gradient-to-br from-indigo-950/70 to-blue-950/70 border border-blue-800/30 shadow-lg col-span-1 md:col-span-2 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-300">Today's Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(calendarEvents) && calendarEvents.length > 0 ? (
                      <div className="space-y-2">
                        {calendarEvents.slice(0, 2).map(event => (
                          <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-indigo-900/20 border border-indigo-800/20">
                            <div>
                              <div className="text-sm font-medium text-white">{event.title}</div>
                              {event.startTime && (
                                <div className="text-xs text-blue-300 mt-1">
                                  {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-indigo-800/30 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-blue-300" />
                            </div>
                          </div>
                        ))}
                        {calendarEvents.length > 2 && (
                          <div className="text-xs text-center text-blue-300 mt-2">
                            +{calendarEvents.length - 2} more events
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-blue-300 text-center py-4">No events scheduled today</div>
                    )}
                  </CardContent>
                </Card>
              </div>
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