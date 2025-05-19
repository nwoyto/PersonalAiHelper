import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/types";
import TaskItem from "@/components/tasks/TaskItem";
import TaskForm from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckSquare, Clock, CalendarDays, CheckCheck } from "lucide-react";

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
    <div className="container mx-auto py-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <Button 
          className="rounded-full bg-purple-600 hover:bg-purple-700 p-3 text-white h-auto w-auto shadow-md"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-3 mb-8 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-5 py-2 flex items-center gap-2 ${
            filter === "all" 
              ? "bg-purple-600 hover:bg-purple-700 text-white border-none"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
          }`}
          onClick={() => setFilter("all")}
        >
          <CheckSquare size={16} />
          All Tasks
        </Button>
        <Button
          variant={filter === "today" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-5 py-2 flex items-center gap-2 ${
            filter === "today" 
              ? "bg-purple-600 hover:bg-purple-700 text-white border-none"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
          }`}
          onClick={() => setFilter("today")}
        >
          <Clock size={16} />
          Today
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-5 py-2 flex items-center gap-2 ${
            filter === "upcoming" 
              ? "bg-purple-600 hover:bg-purple-700 text-white border-none"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
          }`}
          onClick={() => setFilter("upcoming")}
        >
          <CalendarDays size={16} />
          Upcoming
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          className={`rounded-full text-sm whitespace-nowrap px-5 py-2 flex items-center gap-2 ${
            filter === "completed" 
              ? "bg-purple-600 hover:bg-purple-700 text-white border-none"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700"
          }`}
          onClick={() => setFilter("completed")}
        >
          <CheckCheck size={16} />
          Completed
        </Button>
      </div>

      {/* Tasks by Category */}
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-8">
          {Array(2).fill(0).map((_, i) => (
            <section key={i}>
              <Skeleton className="h-5 w-32 mb-4 bg-gray-700" />
              <div className="space-y-4">
                {Array(2).fill(0).map((_, j) => (
                  <div key={j} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-md">
                    <div className="flex items-start">
                      <Skeleton className="h-6 w-6 rounded-full mr-4 bg-gray-700" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-4/5 rounded mb-3 bg-gray-700" />
                        <Skeleton className="h-4 w-2/3 rounded bg-gray-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-400 text-center p-6 bg-gray-800 border border-red-900/30 rounded-xl shadow-md">
          Failed to load tasks: {(error as Error).message}
        </div>
      ) : Object.keys(tasksByCategory).length === 0 ? (
        <div className="text-gray-300 text-center p-10 bg-gray-800 border border-gray-700 rounded-xl shadow-md">
          <div className="flex flex-col items-center">
            <CheckSquare className="h-12 w-12 text-gray-500 mb-4" />
            <p className="mb-5">No tasks found</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 rounded-lg px-5 py-2 shadow-md"
              onClick={() => setIsFormOpen(true)}
            >
              Create New Task
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <section key={category}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full mr-2 bg-purple-500"></span>
                {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryTasks.length})
              </h3>
              <div className="space-y-4">
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
