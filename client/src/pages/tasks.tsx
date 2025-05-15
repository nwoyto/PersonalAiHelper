import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/types";
import TaskItem from "@/components/tasks/TaskItem";
import TaskForm from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";

export default function Tasks() {
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "completed">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Fetch tasks
  const { 
    data: tasks, 
    isLoading,
    error
  } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter tasks based on selected filter
  const filteredTasks = tasks?.filter(task => {
    if (filter === "all") return true;
    if (filter === "completed") return task.completed;
    
    // For today/upcoming filters
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (filter === "today") {
      return dueDate >= today && dueDate < tomorrow;
    }
    
    if (filter === "upcoming") {
      return dueDate >= tomorrow;
    }
    
    return true;
  }) || [];
  
  // Group tasks by category
  const tasksByCategory: Record<string, Task[]> = {};
  
  filteredTasks.forEach(task => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = [];
    }
    tasksByCategory[task.category].push(task);
  });
  
  return (
    <div className="tasks-screen px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Header title="Tasks" />
        <Button 
          className="rounded-full bg-primary p-2 text-white h-auto w-auto"
          onClick={() => setIsFormOpen(true)}
        >
          <i className="ri-add-line text-xl"></i>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-4 ${
            filter === "all" 
              ? "bg-primary text-white"
              : "bg-surface text-text-secondary border-none"
          }`}
          onClick={() => setFilter("all")}
        >
          All Tasks
        </Button>
        <Button
          variant={filter === "today" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-4 ${
            filter === "today" 
              ? "bg-primary text-white"
              : "bg-surface text-text-secondary border-none"
          }`}
          onClick={() => setFilter("today")}
        >
          Today
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-4 ${
            filter === "upcoming" 
              ? "bg-primary text-white"
              : "bg-surface text-text-secondary border-none"
          }`}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-4 ${
            filter === "completed" 
              ? "bg-primary text-white"
              : "bg-surface text-text-secondary border-none"
          }`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Tasks by Category */}
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-6">
          {Array(2).fill(0).map((_, i) => (
            <section key={i}>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="space-y-3">
                {Array(2).fill(0).map((_, j) => (
                  <div key={j} className="bg-surface rounded-lg p-4">
                    <div className="flex items-start">
                      <Skeleton className="h-5 w-5 rounded-full mr-3" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-4/5 rounded mb-2" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : error ? (
        <div className="text-error text-center p-4">
          Failed to load tasks: {(error as Error).message}
        </div>
      ) : Object.keys(tasksByCategory).length === 0 ? (
        <div className="text-text-secondary text-center p-8 bg-surface rounded-lg">
          <div className="flex flex-col items-center">
            <i className="ri-checkbox-line text-4xl mb-2 text-muted-foreground"></i>
            <p className="mb-4">No tasks found</p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsFormOpen(true)}
            >
              Create New Task
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <section key={category}>
              <h3 className="text-sm font-medium text-text-secondary uppercase mb-3">
                {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryTasks.length})
              </h3>
              <div className="space-y-3">
                {categoryTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      
      {/* Task Form Modal */}
      {isFormOpen && (
        <TaskForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
