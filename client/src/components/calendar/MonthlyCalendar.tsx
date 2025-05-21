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
    <div className="bg-gradient-to-b from-navy-900 to-navy-950 border border-navy-800/50 rounded-lg shadow-xl">
      {/* Calendar header */}
      <div className="p-4 flex items-center justify-between border-b border-navy-800/30">
        <h2 className="text-xl font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className="text-white hover:text-white hover:bg-navy-800/70"
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="text-white hover:text-white hover:bg-navy-800/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className="text-white hover:text-white hover:bg-navy-800/70"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-navy-800/30 bg-navy-800/30">
          {weekdays.map(day => (
            <div key={day} className="text-center py-2 text-sm font-medium text-white">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t border-navy-800/30">
              {week.map((day, dayIndex) => {
                if (!day) {
                  // Empty cell
                  return <div key={`blank-${dayIndex}`} className="h-[4.5rem] p-1 border-r border-navy-800/20 last:border-r-0 bg-navy-950" />;
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
                      "h-[4.5rem] p-1 border-r border-navy-800/20 last:border-r-0 transition-colors",
                      isCurrentMonth ? "bg-navy-900" : "bg-navy-950 text-gray-400",
                      isSelectedDay && "bg-navy-800",
                      !isCurrentMonth && "opacity-60"
                    )}
                  >
                    <div className="flex flex-col h-full">
                      {/* Day number */}
                      <div 
                        className={cn(
                          "h-6 w-6 flex items-center justify-center text-sm rounded-full text-white",
                          isCurrentDay && "bg-gradient-to-r from-purple-700 to-blue-700 font-medium"
                        )}
                      >
                        {formattedDay}
                      </div>
                      
                      {/* Events */}
                      <div className="mt-1 space-y-1 overflow-y-auto max-h-[4rem]">
                        {dayEvents.slice(0, 2).map(event => (
                          <TooltipProvider key={event.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "text-xs py-1 px-2 rounded-md truncate shadow-sm",
                                    event.provider === 'google' 
                                      ? "bg-navy-800 text-white border-l-2 border-blue-500" 
                                      : "bg-navy-800 text-white border-l-2 border-purple-500",
                                    event.allDay && "border-l-2 border-green-500"
                                  )}
                                >
                                  {event.title}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-navy-900 border border-navy-800">
                                <div className="space-y-1">
                                  <p className="font-medium text-white">{event.title}</p>
                                  {event.description && <p className="text-xs text-white opacity-80">{event.description}</p>}
                                  {event.location && <p className="text-xs text-white opacity-70">{event.location}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {eventCount > 2 && (
                          <div className="text-xs font-medium py-1 px-2 rounded-md bg-navy-800 text-white">
                            +{eventCount - 2} more
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