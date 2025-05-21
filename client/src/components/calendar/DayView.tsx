import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, subDays, parseISO, isToday, isSameDay } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  provider: string;
  externalId: string;
  url?: string;
}

export default function DayView() {
  const [currentDay, setCurrentDay] = useState(new Date());
  
  // Get calendar events
  const { data, isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    refetchOnWindowFocus: false,
  });
  
  // Parse events into correct format
  const events: Event[] = Array.isArray(data) ? data : [];
  
  // Filter events for the current day
  const dayEvents = events.filter(event => {
    if (!event.startTime) return false;
    return isSameDay(parseISO(event.startTime), currentDay);
  });
  
  // Sort events by start time
  const sortedEvents = [...dayEvents].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime();
  });
  
  // Navigation functions
  const nextDay = () => setCurrentDay(addDays(currentDay, 1));
  const prevDay = () => setCurrentDay(subDays(currentDay, 1));
  const goToToday = () => setCurrentDay(new Date());
  
  // Generate time slots (hourly from 6am to 9pm)
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 6);
  
  // Format time (24h to 12h)
  const formatTimeSlot = (hour: number) => {
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };
  
  // Map events to time slots
  const getEventsForTimeSlot = (hour: number) => {
    return sortedEvents.filter(event => {
      if (!event.startTime || event.allDay) return false;
      const eventHour = parseISO(event.startTime).getHours();
      return eventHour === hour;
    });
  };
  
  // Get all-day events
  const allDayEvents = sortedEvents.filter(event => event.allDay);
  
  return (
    <div className="bg-gradient-to-b from-blue-950 to-indigo-950 border border-indigo-800/50 rounded-lg shadow-xl">
      {/* Calendar header */}
      <div className="p-4 flex items-center justify-between border-b border-indigo-800/30">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {format(currentDay, 'EEEE, MMMM d, yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className="text-blue-300 hover:text-white hover:bg-indigo-900/70"
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevDay}
            className="text-blue-300 hover:text-white hover:bg-indigo-900/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextDay}
            className="text-blue-300 hover:text-white hover:bg-indigo-900/70"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b border-indigo-800/30 bg-indigo-900/20">
          <h3 className="text-sm font-medium text-blue-300 mb-2">All-day</h3>
          <div className="space-y-2">
            {allDayEvents.map(event => (
              <div 
                key={event.id}
                className={cn(
                  "p-2 rounded-md text-sm",
                  event.provider === 'google' 
                    ? "bg-gradient-to-r from-blue-900/70 to-blue-800/70 text-blue-100 border-l-2 border-blue-500" 
                    : "bg-gradient-to-r from-purple-900/70 to-purple-800/70 text-purple-100 border-l-2 border-purple-500"
                )}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && (
                  <div className="text-xs mt-1 opacity-80">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Hourly schedule */}
      <div className="overflow-y-auto max-h-[600px]">
        {timeSlots.map(hour => {
          const eventsForSlot = getEventsForTimeSlot(hour);
          
          return (
            <div key={hour} className="grid grid-cols-12 border-b border-indigo-800/20">
              {/* Time column */}
              <div className="col-span-2 p-3 border-r border-indigo-800/20 bg-indigo-900/20 flex items-start justify-center">
                <div className="text-sm text-blue-300 font-medium">
                  {formatTimeSlot(hour)}
                </div>
              </div>
              
              {/* Events column */}
              <div className="col-span-10 min-h-[70px] p-2">
                {eventsForSlot.length > 0 ? (
                  <div className="space-y-2">
                    {eventsForSlot.map(event => (
                      <TooltipProvider key={event.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={cn(
                                "p-2 rounded-md text-sm",
                                event.provider === 'google' 
                                  ? "bg-gradient-to-r from-blue-900/70 to-blue-800/70 text-blue-100 border-l-2 border-blue-500" 
                                  : "bg-gradient-to-r from-purple-900/70 to-purple-800/70 text-purple-100 border-l-2 border-purple-500"
                              )}
                            >
                              <div className="font-medium">{event.title}</div>
                              {event.startTime && event.endTime && (
                                <div className="flex items-center text-xs mt-1 opacity-80">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}
                                </div>
                              )}
                              {event.location && (
                                <div className="text-xs mt-1 opacity-80">{event.location}</div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-indigo-950 border border-indigo-800">
                            <div className="space-y-1">
                              <p className="font-medium text-white">{event.title}</p>
                              {event.description && <p className="text-xs text-blue-200">{event.description}</p>}
                              {event.location && <p className="text-xs text-blue-300">{event.location}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}