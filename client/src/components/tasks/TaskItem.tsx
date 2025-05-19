import { useState } from "react";
import { Task } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock } from "lucide-react";

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
    if (!dateString) return "text-gray-400";
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (date < now && date.toDateString() !== now.toDateString()) {
      return "text-amber-400";
    }
    
    return "text-gray-400";
  };
  
  const getCategoryClasses = (category: string) => {
    switch (category) {
      case "work":
        return "bg-blue-900/30 text-blue-400 border border-blue-800/40";
      case "personal":
        return "bg-green-900/30 text-green-400 border border-green-800/40";
      case "urgent":
        return "bg-amber-900/30 text-amber-400 border border-amber-800/40";
      default:
        return "bg-blue-900/30 text-blue-400 border border-blue-800/40";
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
    <div className={`bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-md transition-all duration-200 ${task.completed ? "opacity-75" : ""}`}>
      <div className="flex items-start">
        <button 
          className={`shrink-0 w-6 h-6 rounded-full border-2 mt-0.5 mr-3 flex-none ${
            task.completed 
              ? "border-purple-500 bg-purple-500 flex items-center justify-center" 
              : task.category === "work" 
                ? "border-blue-500" 
                : task.category === "personal" 
                  ? "border-green-500" 
                  : "border-amber-500"
          }`}
          onClick={toggleTaskCompletion}
          disabled={isLoading}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && (
            <Check className="h-3 w-3 text-white" />
          )}
        </button>
        <div className="flex-1">
          <h4 className={`font-medium mb-2 ${task.completed ? "text-gray-500 line-through" : "text-white"}`}>
            {task.title}
          </h4>
          <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center text-sm ${
              task.completed ? "text-gray-500" : getDueDateClass(task.dueDate)
            }`}>
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {task.completed 
                ? "Completed" 
                : formatDueDate(task.dueDate)}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${getCategoryClasses(task.category)}`}>
              {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
