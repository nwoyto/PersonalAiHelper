import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
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

export default function MonthlyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get calendar events
  const { data, isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    refetchOnWindowFocus: false,
  });
  
  // Parse events into correct format
  const events: Event[] = Array.isArray(data) ? data : [];
  
  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());
  
  // Get days in current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Determine the day of week the month starts on (0 = Sunday, 6 = Saturday)
  const startDay = monthStart.getDay();
  
  // Generate the week day headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
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
  
  // Create blank days at the beginning to align with the correct day of week
  const blanks = Array(startDay).fill(null);
  
  // Combine blanks and days into the calendar grid
  const calendarDays = [...blanks, ...daysInMonth];
  
  // Split the days into weeks
  const weeks: Array<Array<Date | null>> = [];
  let week: Array<Date | null> = [];
  
  calendarDays.forEach((day, index) => {
    if (index % 7 === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
    
    // Add the last week if we've reached the end
    if (index === calendarDays.length - 1) {
      // Fill out the rest of the week with nulls if needed
      const remainingDays = 7 - week.length;
      if (remainingDays > 0) {
        week.push(...Array(remainingDays).fill(null));
      }
      weeks.push(week);
    }
  });
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg">
      {/* Calendar header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-800">
          {weekdays.map(day => (
            <div key={day} className="text-center py-2 text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="border-b border-gray-800">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t border-gray-800">
              {week.map((day, dayIndex) => {
                if (!day) {
                  // Empty cell
                  return <div key={`blank-${dayIndex}`} className="h-24 p-1 border-r border-gray-800 last:border-r-0 bg-gray-950" />;
                }
                
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelectedDay = false; // For future implementation of day selection
                const dayEvents = getEventsForDay(day);
                const eventCount = dayEvents.length;
                const formattedDay = format(day, 'd');
                const isCurrentDay = isToday(day);
                
                return (
                  <div 
                    key={day.toString()}
                    className={cn(
                      "min-h-24 p-1 border-r border-gray-800 last:border-r-0 transition-colors",
                      isCurrentMonth ? "bg-gray-900" : "bg-gray-950 text-gray-600",
                      isSelectedDay && "bg-gray-800",
                      !isCurrentMonth && "opacity-50"
                    )}
                  >
                    <div className="flex flex-col h-full">
                      {/* Day number */}
                      <div 
                        className={cn(
                          "h-6 w-6 flex items-center justify-center text-sm rounded-full",
                          isCurrentDay && "bg-purple-700 text-white font-medium"
                        )}
                      >
                        {formattedDay}
                      </div>
                      
                      {/* Events */}
                      <div className="mt-1 space-y-1 overflow-y-auto max-h-[100px]">
                        {dayEvents.slice(0, 3).map(event => (
                          <TooltipProvider key={event.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "text-xs p-1 rounded truncate",
                                    event.provider === 'google' ? "bg-blue-900/50 text-blue-200" : "bg-purple-900/50 text-purple-200",
                                    event.allDay && "border-l-2 border-green-500"
                                  )}
                                >
                                  {event.title}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{event.title}</p>
                                  {event.description && <p className="text-xs opacity-80">{event.description}</p>}
                                  {event.location && <p className="text-xs">{event.location}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {eventCount > 3 && (
                          <div className="text-xs text-gray-400 pl-1">
                            +{eventCount - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}