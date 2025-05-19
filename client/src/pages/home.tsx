import { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Note } from "@/types";
import TaskItem from "@/components/tasks/TaskItem";
import NoteItem from "@/components/notes/NoteItem";
import TaskForm from "@/components/tasks/TaskForm";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Calendar, Plus, Search, Clock, BellRing, Sparkles } from "lucide-react";
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
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Jibe AI
        </h1>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-800 p-2 rounded-full">
            <BellRing size={18} className="text-purple-400" />
          </div>
        </div>
      </div>

      {/* Greeting & Assistant Status */}
      <section className="mb-10">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-10 -ml-20 -mb-20"></div>
          
          <div className="relative flex flex-col items-center text-center z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg p-1">
              <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">{greeting}, User</h2>
            <p className="text-gray-300 mb-5 text-lg">I'm listening and ready to help</p>
            
            <div className="flex items-center py-2 px-4 bg-gray-800/50 rounded-full mb-5 border border-purple-500/20 shadow-inner">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse shadow-lg shadow-purple-500/50"></span>
              <span className="text-purple-300 font-medium">Active and listening for wake word</span>
            </div>
            
            {typeof window !== 'undefined' && window.location.hostname.includes('replit') && (
              <div className="text-sm text-amber-400 max-w-md text-center mt-2 py-3 px-4 rounded-lg bg-amber-900/20 border border-amber-800/30">
                <p>In the Replit environment, use the microphone button to activate the voice assistant.</p>
                <p className="mt-1">In production, the assistant listens continuously for the wake word.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-10">
        <h3 className="flex items-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          <Clock size={16} className="mr-2" />
          QUICK ACTIONS
        </h3>
        
        <div className="grid grid-cols-2 gap-5">
          <button 
            onClick={() => setIsVoiceModalOpen(true)}
            className="group bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-purple-500/10 hover:border-purple-500/30"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-800/20 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Mic size={28} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
            <span className="text-white font-medium">New Voice Note</span>
          </button>
          
          <Link href="/calendar">
            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-blue-500/10 hover:border-blue-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-800/20 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Calendar size={28} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <span className="text-white font-medium">Schedule Meeting</span>
            </div>
          </Link>
          
          <button
            onClick={() => setIsTaskFormOpen(true)} 
            className="group bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-green-500/10 hover:border-green-500/30"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-800/20 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Plus size={28} className="text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
            <span className="text-white font-medium">New Task</span>
          </button>
          
          <Link href="/notes">
            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-amber-500/10 hover:border-amber-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-800/20 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Search size={28} className="text-amber-400 group-hover:text-amber-300 transition-colors" />
              </div>
              <span className="text-white font-medium">Find Notes</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Tasks */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="flex items-center text-sm font-semibold text-gray-400 uppercase tracking-wider">
            <Clock size={16} className="mr-2" />
            YOUR TASKS
          </h3>
          <Link href="/tasks" className="text-purple-400 text-sm hover:text-purple-300 transition-colors font-medium flex items-center">
            View All
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        {/* Task List */}
        <div className="space-y-4">
          {isTasksLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 shadow-md border border-gray-700">
                <div className="flex items-start">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-4/5 rounded mb-2" />
                    <Skeleton className="h-4 w-2/3 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : tasksError ? (
            <div className="text-red-400 text-center p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md border border-red-900/30">
              Failed to load tasks
            </div>
          ) : incompleteTasks.length === 0 ? (
            <div className="text-gray-400 text-center p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md border border-gray-700">
              No tasks to display
            </div>
          ) : (
            // Actual tasks - TaskItem component might need styling updates
            incompleteTasks.slice(0, 3).map(task => (
              <TaskItem key={task.id} task={task} />
            ))
          )}
        </div>
      </section>

      {/* Recent Conversations */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-5">
          <h3 className="flex items-center text-sm font-semibold text-gray-400 uppercase tracking-wider">
            <Clock size={16} className="mr-2" />
            RECENT CONVERSATIONS
          </h3>
          <Link href="/notes" className="text-purple-400 text-sm hover:text-purple-300 transition-colors font-medium flex items-center">
            View All
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        <div className="space-y-4">
          {isNotesLoading ? (
            // Loading skeletons
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 shadow-md border border-gray-700">
                <Skeleton className="h-6 w-3/4 rounded mb-3" />
                <Skeleton className="h-4 w-full rounded mb-2" />
                <Skeleton className="h-4 w-full rounded mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            ))
          ) : notesError ? (
            <div className="text-red-400 text-center p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md border border-red-900/30">
              Failed to load notes
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-gray-400 text-center p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md border border-gray-700">
              No conversations to display
            </div>
          ) : (
            // Actual notes - NoteItem component might need styling updates
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
