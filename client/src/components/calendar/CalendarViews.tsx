import React from "react";
import { ContentCard } from "@/components/ui/content-card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Task, ExternalCalendarEvent } from "@/types";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, 
         startOfMonth, endOfMonth, getDay, isSameDay, 
         addMonths, subMonths, addYears, subYears } from "date-fns";
import { Badge } from "@/components/ui/badge";
import ExternalCalendarEventItem from "./ExternalCalendarEvent";

type CalendarViewType = "day" | "week" | "month" | "year";

interface CalendarViewsProps {
  viewType: CalendarViewType;
  date: Date;
  onDateChange: (date: Date) => void;
  events: ExternalCalendarEvent[];
  tasks: Task[];
  activeTab: string;
}

export default function CalendarViews({ 
  viewType, 
  date, 
  onDateChange, 
  events, 
  tasks,
  activeTab
}: CalendarViewsProps) {
  
  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (activeTab === "all") return true;
    return event.provider === activeTab;
  });
  
  // Generate events for a specific date
  const getEventsForDate = (day: Date) => {
    return [...events, ...tasks.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      startTime: task.dueDate,
      provider: "task" as any,
      externalId: `task-${task.id}`,
      isTask: true,
      completed: task.completed,
      category: task.category
    }))].filter(event => {
      if (!event.startTime) return false;
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, day);
    });
  };
  
  // Handle navigation between periods
  const navigatePrevious = () => {
    switch (viewType) {
      case "day":
        onDateChange(new Date(date.getTime() - 24 * 60 * 60 * 1000));
        break;
      case "week":
        onDateChange(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case "month":
        onDateChange(subMonths(date, 1));
        break;
      case "year":
        onDateChange(subYears(date, 1));
        break;
    }
  };
  
  const navigateNext = () => {
    switch (viewType) {
      case "day":
        onDateChange(new Date(date.getTime() + 24 * 60 * 60 * 1000));
        break;
      case "week":
        onDateChange(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000));
        break;
      case "month":
        onDateChange(addMonths(date, 1));
        break;
      case "year":
        onDateChange(addYears(date, 1));
        break;
    }
  };
  
  // Format header based on view
  const getPeriodHeader = () => {
    switch (viewType) {
      case "day":
        return format(date, "EEEE, MMMM d, yyyy");
      case "week":
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "month":
        return format(date, "MMMM yyyy");
      case "year":
        return format(date, "yyyy");
      default:
        return "";
    }
  };
  
  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(date);
    
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium">Events & Tasks</div>
        
        {dayEvents.length > 0 ? (
          <div className="space-y-3">
            {dayEvents.map(event => {
              if ('isTask' in event) {
                const task = tasks.find(t => t.id === parseInt(event.externalId.split('-')[1]));
                if (!task) return null;
                return (
                  <div key={event.id} className="p-3 border rounded-md bg-surface-light">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={task.completed} 
                          className="h-5 w-5 rounded border-gray-300"
                          readOnly
                        />
                        <span className={task.completed ? "line-through text-text-secondary" : ""}>
                          {task.title}
                        </span>
                      </div>
                      <Badge variant={
                        task.category === "urgent" ? "destructive" : 
                        task.category === "work" ? "default" : 
                        "secondary"
                      }>
                        {task.category}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-text-secondary mt-2 ml-8">{task.description}</p>
                    )}
                  </div>
                );
              } else {
                // Only show events that match the active tab or "all"
                if (activeTab !== "all" && event.provider !== activeTab) return null;
                return <ExternalCalendarEventItem key={event.id} event={event} />;
              }
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-text-secondary border rounded-md bg-surface-light">
            <i className="ri-calendar-event-line text-3xl mb-2"></i>
            <p>No events or tasks scheduled for today</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center font-medium border-b pb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div key={i} className="text-xs md:text-sm">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 auto-rows-fr">
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toString()} 
                className={`border rounded-md p-2 min-h-[100px] ${
                  isToday ? "bg-primary-50 border-primary" : ""
                }`}
                onClick={() => onDateChange(day)}
              >
                <div className="text-right text-xs mb-1 font-medium">
                  {format(day, "d")}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id} 
                      className={`text-xs truncate p-1 rounded-sm ${
                        'isTask' in event 
                          ? `bg-gray-100 ${(event as any).completed ? "line-through opacity-60" : ""}`
                          : event.provider === "google" ? "bg-red-100" :
                            event.provider === "outlook" ? "bg-blue-100" :
                            event.provider === "apple" ? "bg-gray-100" : "bg-primary-100"
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-center text-text-secondary">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center font-medium border-b pb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div key={i} className="text-xs">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 auto-rows-fr">
          {days.map(day => {
            const isCurrentMonth = day.getMonth() === date.getMonth();
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDate(day);
            
            return (
              <div 
                key={day.toString()} 
                className={`border rounded-md p-1 min-h-[70px] ${
                  !isCurrentMonth ? "opacity-30 bg-gray-50" : ""
                } ${
                  isToday ? "bg-primary-50 border-primary" : ""
                }`}
                onClick={() => onDateChange(day)}
              >
                <div className="text-right text-xs font-medium">
                  {format(day, "d")}
                </div>
                <div className="space-y-1 overflow-hidden max-h-[45px]">
                  {dayEvents.slice(0, 2).map(event => (
                    <div 
                      key={event.id} 
                      className={`text-xs truncate p-0.5 rounded-sm ${
                        'isTask' in event 
                          ? `bg-gray-100 ${(event as any).completed ? "line-through opacity-60" : ""}`
                          : event.provider === "google" ? "bg-red-100" :
                            event.provider === "outlook" ? "bg-blue-100" :
                            event.provider === "apple" ? "bg-gray-100" : "bg-primary-100"
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-center text-text-secondary">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render year view
  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(date.getFullYear(), i, 1));
    
    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map(month => {
          const isCurrentMonth = new Date().getMonth() === month.getMonth() && 
                                new Date().getFullYear() === month.getFullYear();
          
          // Count events in this month
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const monthEvents = [...events, ...tasks.map(task => ({
            startTime: task.dueDate
          }))].filter(event => {
            if (!event.startTime) return false;
            const eventDate = new Date(event.startTime);
            return eventDate >= monthStart && eventDate <= monthEnd;
          });
          
          return (
            <div 
              key={month.toString()} 
              className={`border rounded-md p-3 cursor-pointer hover:bg-surface-light ${
                isCurrentMonth ? "bg-primary-50 border-primary" : ""
              }`}
              onClick={() => {
                onDateChange(month);
              }}
            >
              <div className="font-medium mb-1">{format(month, "MMMM")}</div>
              <div className="text-text-secondary text-sm">
                {monthEvents.length} {monthEvents.length === 1 ? "item" : "items"}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <ContentCard>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{getPeriodHeader()}</h2>
        
        <div className="flex gap-2">
          <button 
            className="p-1 rounded hover:bg-surface" 
            onClick={navigatePrevious}
            aria-label="Previous"
          >
            <i className="ri-arrow-left-s-line text-xl"></i>
          </button>
          <button 
            className="p-1 rounded hover:bg-surface"
            onClick={() => onDateChange(new Date())}
            aria-label="Today"
          >
            <i className="ri-calendar-event-line text-xl"></i>
          </button>
          <button 
            className="p-1 rounded hover:bg-surface" 
            onClick={navigateNext}
            aria-label="Next"
          >
            <i className="ri-arrow-right-s-line text-xl"></i>
          </button>
        </div>
      </div>
      
      {viewType === "day" && renderDayView()}
      {viewType === "week" && renderWeekView()}
      {viewType === "month" && renderMonthView()}
      {viewType === "year" && renderYearView()}
    </ContentCard>
  );
}