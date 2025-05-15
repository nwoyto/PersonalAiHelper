import React from "react";
import { ExternalCalendarEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ExternalCalendarEventProps {
  event: ExternalCalendarEvent;
}

export default function ExternalCalendarEventItem({ event }: ExternalCalendarEventProps) {
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "google":
        return "bg-red-100 text-red-800 border-red-200";
      case "outlook":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "apple":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-primary-100 text-primary-800 border-primary-200";
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return "ri-google-fill";
      case "outlook":
        return "ri-microsoft-fill";
      case "apple":
        return "ri-apple-fill";
      default:
        return "ri-calendar-event-fill";
    }
  };

  const getTimeString = () => {
    if (event.allDay) {
      return "All day";
    }
    
    if (event.startTime && event.endTime) {
      return `${format(new Date(event.startTime), "h:mm a")} - ${format(new Date(event.endTime), "h:mm a")}`;
    }
    
    return "";
  };

  return (
    <div className="p-3 border rounded-md bg-surface-light mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium">{event.title}</div>
          {event.location && (
            <div className="text-sm text-text-secondary flex items-center mt-1">
              <i className="ri-map-pin-line mr-1"></i>
              {event.location}
            </div>
          )}
          {(event.startTime || event.allDay) && (
            <div className="text-sm text-text-secondary flex items-center mt-1">
              <i className="ri-time-line mr-1"></i>
              {getTimeString()}
            </div>
          )}
        </div>
        
        <Badge 
          variant="outline" 
          className={`ml-2 flex items-center ${getProviderColor(event.provider)}`}
        >
          <i className={`${getProviderIcon(event.provider)} mr-1`}></i>
          {event.provider.charAt(0).toUpperCase() + event.provider.slice(1)}
        </Badge>
      </div>
      
      {event.description && (
        <div className="mt-2 text-sm text-text-secondary line-clamp-2">
          {event.description}
        </div>
      )}
    </div>
  );
}