import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks, 
  parseISO, 
  isToday 
} from 'date-fns';
import { Button } from "@/components/ui/button";
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

export default function WeekView() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Get calendar events
  const { data, isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    refetchOnWindowFocus: false,
  });
  
  // Parse events into correct format
  const events: Event[] = Array.isArray(data) ? data : [];
  
  // Navigation functions
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());
  
  // Get days in current week view
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Group events by date (yyyy-MM-dd)
  const eventsByDate: Record<string, Event[]> = {};
  
  events.forEach(event => {
    if (!event.startTime) return;
    
    const startDate = format(parseISO(event.startTime), 'yyyy-MM-dd');
    
    if (!eventsByDate[startDate]) {
      eventsByDate[startDate] = [];
    }
    
    eventsByDate[startDate].push(event);
  });
  
  // Get events for a specific day
  const getEventsForDay = (day: Date): Event[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };
  
  // Sort and group events for display
  const getEventRowsForDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    
    // Sort events by start time
    return dayEvents.sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime();
    });
  };
  
  return (
    <div className="bg-gradient-to-b from-blue-950 to-indigo-950 border border-indigo-800/50 rounded-lg shadow-xl">
      {/* Calendar header */}
      <div className="p-4 flex items-center justify-between border-b border-indigo-800/30">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
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
            onClick={prevWeek}
            className="text-blue-300 hover:text-white hover:bg-indigo-900/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextWeek}
            className="text-blue-300 hover:text-white hover:bg-indigo-900/70"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-indigo-800/30 bg-indigo-900/30">
          {daysInWeek.map(day => (
            <div 
              key={day.toString()} 
              className={cn(
                "text-center py-3 flex flex-col items-center",
                isToday(day) ? "text-white" : "text-blue-300"
              )}
            >
              <div className="text-xs font-medium">{format(day, 'EEE')}</div>
              <div 
                className={cn(
                  "flex items-center justify-center mt-1 w-8 h-8 rounded-full",
                  isToday(day) && "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week grid */}
        <div className="grid grid-cols-7 min-h-[500px] divide-x divide-indigo-800/20">
          {daysInWeek.map(day => {
            const dayEvents = getEventRowsForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "min-h-full p-2 transition-colors",
                  isCurrentDay ? "bg-indigo-900/20" : "bg-transparent"
                )}
              >
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "text-xs p-2 rounded-md truncate shadow-sm",
                              event.provider === 'google' 
                                ? "bg-gradient-to-r from-blue-900/70 to-blue-800/70 text-blue-100 border-l-2 border-blue-500" 
                                : "bg-gradient-to-r from-purple-900/70 to-purple-800/70 text-purple-100 border-l-2 border-purple-500",
                              event.allDay && "border-l-2 border-green-500"
                            )}
                          >
                            <div className="font-medium">{event.title}</div>
                            {event.startTime && !event.allDay && (
                              <div className="mt-1 text-[10px] opacity-80">
                                {format(parseISO(event.startTime), 'h:mm a')}
                                {event.endTime && ` - ${format(parseISO(event.endTime), 'h:mm a')}`}
                              </div>
                            )}
                            {event.allDay && (
                              <div className="mt-1 text-[10px] opacity-80">All day</div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-indigo-950 border border-indigo-800">
                          <div className="space-y-1">
                            <p className="font-medium text-white">{event.title}</p>
                            {event.description && <p className="text-xs text-blue-200">{event.description}</p>}
                            {event.location && <p className="text-xs text-blue-300">{event.location}</p>}
                            {event.startTime && !event.allDay && (
                              <p className="text-xs text-blue-200">
                                {format(parseISO(event.startTime), 'h:mm a')}
                                {event.endTime && ` - ${format(parseISO(event.endTime), 'h:mm a')}`}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}