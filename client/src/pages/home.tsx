import { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Note } from "@/types";
import TaskItem from "@/components/tasks/TaskItem";
import NoteItem from "@/components/notes/NoteItem";
import TaskForm from "@/components/tasks/TaskForm";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Calendar, Plus, Search } from "lucide-react";
import { VoiceModalContext } from "@/App";

export default function Home() {
  const [greeting, setGreeting] = useState("Good day");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { setIsVoiceModalOpen } = useContext(VoiceModalContext);
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);
  
  // Fetch tasks
  const { 
    data: tasks, 
    isLoading: isTasksLoading,
    error: tasksError
  } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch notes
  const { 
    data: notes, 
    isLoading: isNotesLoading,
    error: notesError
  } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });
  
  const incompleteTasks = tasks?.filter(task => !task.completed) || [];
  const recentNotes = notes?.slice(0, 2) || [];
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Jibe AI</h1>

      {/* Greeting & Assistant Status */}
      <section className="mb-8">
        <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M8 16l8-8M16 16L8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-white mb-2">{greeting}, User</h2>
          <p className="text-gray-300 mb-4">I'm listening and ready to help</p>
          
          <div className="flex items-center text-sm text-purple-400 font-medium mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
            Active and listening for wake word
          </div>
          
          {typeof window !== 'undefined' && window.location.hostname.includes('replit') && (
            <div className="text-sm text-amber-500 max-w-md text-center mt-2">
              <p>In the Replit environment, use the microphone button to activate the voice assistant.</p>
              <p className="mt-1">In production, the assistant listens continuously for the wake word.</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">QUICK ACTIONS</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsVoiceModalOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-purple-900/20 rounded-full flex items-center justify-center mb-3">
              <Mic size={24} className="text-purple-500" />
            </div>
            <span className="text-white">New Voice Note</span>
          </button>
          
          <Link href="/calendar">
            <div className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                <Calendar size={24} className="text-blue-500" />
              </div>
              <span className="text-white">Schedule Meeting</span>
            </div>
          </Link>
          
          <button
            onClick={() => setIsTaskFormOpen(true)} 
            className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mb-3">
              <Plus size={24} className="text-green-500" />
            </div>
            <span className="text-white">New Task</span>
          </button>
          
          <Link href="/notes">
            <div className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-5 flex flex-col items-center">
              <div className="w-12 h-12 bg-amber-900/20 rounded-full flex items-center justify-center mb-3">
                <Search size={24} className="text-amber-500" />
              </div>
              <span className="text-white">Find Notes</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Tasks */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase">YOUR TASKS</h3>
          <Link href="/tasks" className="text-purple-400 text-sm">View All</Link>
        </div>
        
        {/* Task List */}
        <div className="space-y-3">
          {isTasksLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Skeleton className="h-5 w-5 rounded-full mr-3" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-4/5 rounded mb-2" />
                    <Skeleton className="h-4 w-2/3 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : tasksError ? (
            <div className="text-red-400 text-center p-4 bg-gray-800 rounded-lg">
              Failed to load tasks
            </div>
          ) : incompleteTasks.length === 0 ? (
            <div className="text-gray-400 text-center p-4 bg-gray-800 rounded-lg">
              No tasks to display
            </div>
          ) : (
            // Actual tasks
            incompleteTasks.slice(0, 3).map(task => (
              <TaskItem key={task.id} task={task} />
            ))
          )}
        </div>
      </section>

      {/* Recent Conversations */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase">RECENT CONVERSATIONS</h3>
          <Link href="/notes" className="text-purple-400 text-sm">View All</Link>
        </div>
        
        <div className="space-y-3">
          {isNotesLoading ? (
            // Loading skeletons
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <Skeleton className="h-5 w-3/4 rounded mb-2" />
                <Skeleton className="h-4 w-full rounded mb-2" />
                <Skeleton className="h-4 w-full rounded mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              </div>
            ))
          ) : notesError ? (
            <div className="text-red-400 text-center p-4 bg-gray-800 rounded-lg">
              Failed to load notes
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-gray-400 text-center p-4 bg-gray-800 rounded-lg">
              No conversations to display
            </div>
          ) : (
            // Actual notes
            recentNotes.map(note => (
              <NoteItem key={note.id} note={note} />
            ))
          )}
        </div>
      </section>
      
      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm 
          isOpen={isTaskFormOpen} 
          onClose={() => setIsTaskFormOpen(false)} 
        />
      )}
    </div>
  );
}
