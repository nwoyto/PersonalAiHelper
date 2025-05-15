import React, { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import { Task } from "../types";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter tasks for the selected date
  const tasksForSelectedDate = date 
    ? tasks.filter(task => {
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
          );
        }
        return false;
      })
    : [];
  
  // Get dates that have tasks
  const taskDates = tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.dueDate) {
      const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
      acc[dateStr] = (acc[dateStr] || 0) + 1;
    }
    return acc;
  }, {});
  
  return (
    <div>
      <Header title="Calendar" />
      
      <div className="p-4">
        <ContentCard>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full"
                modifiers={{
                  hasTask: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return !!taskDates[dateStr];
                  }
                }}
                modifiersStyles={{
                  hasTask: {
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                    borderRadius: '100%'
                  }
                }}
              />
            </div>
            
            <div className="md:w-1/2">
              <h2 className="text-xl font-semibold mb-4">
                {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
              </h2>
              
              {tasksForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Tasks</h3>
                  <div className="space-y-3">
                    {tasksForSelectedDate.map(task => (
                      <div key={task.id} className="p-3 border rounded-md bg-surface-light">
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
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-text-secondary border rounded-md bg-surface-light">
                  <i className="ri-calendar-event-line text-3xl mb-2"></i>
                  <p>{date ? 'No tasks on this date' : 'Select a date to view tasks'}</p>
                </div>
              )}
            </div>
          </div>
        </ContentCard>
      </div>
    </div>
  );
}