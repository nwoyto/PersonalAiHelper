import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, MapPinIcon, ClockIcon, ExternalLinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

function formatEventTime(startTime?: string, endTime?: string, allDay?: boolean) {
  if (allDay) return 'All day';
  if (!startTime) return '';
  
  const start = parseISO(startTime);
  const formattedStart = format(start, 'h:mm a');
  
  if (endTime) {
    const end = parseISO(endTime);
    const formattedEnd = format(end, 'h:mm a');
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  return formattedStart;
}

function getRelativeDay(dateStr?: string) {
  if (!dateStr) return '';
  
  const date = parseISO(dateStr);
  
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  
  return format(date, 'EEEE, MMMM d');
}

export default function CalendarEventsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/calendar/events'],
    refetchOnWindowFocus: false,
  });
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[120px] w-full rounded-md bg-gray-800" />
        <Skeleton className="h-[120px] w-full rounded-md bg-gray-800" />
        <Skeleton className="h-[120px] w-full rounded-md bg-gray-800" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-4 text-red-400">
        Failed to load calendar events
      </div>
    );
  }
  
  // Parse events into correct format
  const events: Event[] = Array.isArray(data) ? data : [];
  
  if (events.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No calendar events found</p>
        <p className="text-sm mt-1">Connect your calendar to see events here</p>
      </div>
    );
  }
  
  // Group events by date
  const groupedEvents: Record<string, Event[]> = {};
  
  events.forEach((event) => {
    if (!event.startTime) return;
    
    const startDate = format(parseISO(event.startTime), 'yyyy-MM-dd');
    
    if (!groupedEvents[startDate]) {
      groupedEvents[startDate] = [];
    }
    
    groupedEvents[startDate].push(event);
  });
  
  // Get upcoming dates in the next 7 days
  const upcoming: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(now, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (groupedEvents[dateKey]) {
      upcoming.push(dateKey);
    }
  }

  // Sort dates chronologically  
  upcoming.sort();
  
  return (
    <div className="space-y-6">
      {upcoming.length > 0 ? (
        upcoming.map(dateKey => (
          <div key={dateKey}>
            <h3 className="text-md font-medium mb-2 text-white">
              {getRelativeDay(dateKey)}
            </h3>
            <div className="space-y-3">
              {groupedEvents[dateKey].map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-4 text-gray-400">
          <p>No upcoming events in the next 7 days</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const providerColor = event.provider === 'google' ? 'border-blue-800 bg-blue-950/50' : 'border-purple-800 bg-purple-950/50';
  
  return (
    <Card className={cn("border bg-gray-900", providerColor)}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-md text-white">{event.title}</CardTitle>
        {event.description && (
          <CardDescription className="line-clamp-2 text-gray-300">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="py-0 px-4">
        <div className="flex items-center text-sm text-gray-300">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>{formatEventTime(event.startTime, event.endTime, event.allDay)}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center mt-1 text-sm text-gray-300">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{event.location}</span>
          </div>
        )}
      </CardContent>
      
      {event.url && (
        <CardFooter className="py-2 px-4 border-t border-gray-800">
          <a 
            href={event.url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs flex items-center text-blue-400 hover:text-blue-300 hover:underline"
          >
            <ExternalLinkIcon className="h-3 w-3 mr-1" />
            Open in {event.provider === 'google' ? 'Google Calendar' : 'Calendar'}
          </a>
        </CardFooter>
      )}
    </Card>
  );
}