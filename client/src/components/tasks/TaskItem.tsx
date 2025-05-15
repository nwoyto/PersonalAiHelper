import { useState } from "react";
import { Task } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ContentCard } from "@/components/ui/content-card";

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isPast = date < now && !isToday;
    
    const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else if (isPast) {
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return `Overdue by ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${timeString}`;
    }
  };
  
  const getDueDateClass = (dateString?: string) => {
    if (!dateString) return "text-text-secondary";
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (date < now && date.toDateString() !== now.toDateString()) {
      return "text-warning";
    }
    
    return "text-text-secondary";
  };
  
  const getCategoryClasses = (category: string) => {
    switch (category) {
      case "work":
        return "bg-accent/20 text-accent";
      case "personal":
        return "bg-secondary/20 text-secondary";
      case "urgent":
        return "bg-warning/20 text-warning";
      default:
        return "bg-accent/20 text-accent";
    }
  };
  
  const toggleTaskCompletion = async () => {
    setIsLoading(true);
    try {
      await apiRequest("PATCH", `/api/tasks/${task.id}`, {
        completed: !task.completed
      });
      
      // Invalidate tasks query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: task.completed ? "Task marked as incomplete" : "Task marked as complete",
        description: task.title,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to update task",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ContentCard className={task.completed ? "opacity-80" : ""}>
      <div className="flex items-start">
        <button 
          className={`shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex-none ${
            task.completed 
              ? "border-secondary bg-secondary flex items-center justify-center" 
              : task.category === "work" 
                ? "border-accent" 
                : task.category === "personal" 
                  ? "border-secondary" 
                  : "border-warning"
          }`}
          onClick={toggleTaskCompletion}
          disabled={isLoading}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && (
            <i className="ri-check-line text-xs text-background"></i>
          )}
        </button>
        <div className="flex-1">
          <h4 className={`font-medium mb-1 ${task.completed ? "text-text-secondary line-through" : "text-text-primary"}`}>
            {task.title}
          </h4>
          <div className="flex items-center justify-between">
            <div className={`flex items-center text-xs ${
              task.completed ? "text-text-secondary" : getDueDateClass(task.dueDate)
            }`}>
              <i className="ri-time-line mr-1"></i>
              {task.completed 
                ? "Completed" 
                : formatDueDate(task.dueDate)}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryClasses(task.category)}`}>
              {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </ContentCard>
  );
}
