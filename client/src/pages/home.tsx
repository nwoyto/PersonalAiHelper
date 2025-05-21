import { useState, useEffect, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Note } from "@/types";
import TaskItem from "@/components/tasks/TaskItem";
import NoteItem from "@/components/notes/NoteItem";
import TaskForm from "@/components/tasks/TaskForm";
import InstacartModal from "@/components/integrations/InstacartModal";
import AmazonModal from "@/components/integrations/AmazonModal";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Calendar, Plus, Search, Clock, BellRing, Sparkles } from "lucide-react";
import { VoiceModalContext } from "@/App";

export default function Home() {
  const [greeting, setGreeting] = useState("Good day");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isInstacartOpen, setIsInstacartOpen] = useState(false);
  const [isAmazonOpen, setIsAmazonOpen] = useState(false);
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
      </div>

      {/* Compact Header with Assistant Status */}
      <section className="mb-6">
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 rounded-xl p-4 shadow-lg border border-navy-800/60 flex items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-10 -ml-20 -mb-20"></div>
          
          <div className="flex-shrink-0 mr-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg p-0.5">
              <div className="bg-navy-800 rounded-full w-full h-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative z-10">
            <h2 className="text-xl font-bold text-white">{greeting}, User</h2>
            <div className="flex items-center mt-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse shadow-sm shadow-purple-500/50"></span>
              <span className="text-white text-sm">Assistant ready and listening</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="ml-auto bg-navy-800 hover:bg-navy-700 rounded-full p-3 text-white shadow-md transition-colors"
            aria-label="Activate Voice Assistant"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Favorite Automations */}
      <section className="mb-10">
        <h3 className="flex items-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          <Sparkles size={16} className="mr-2" />
          FAVORITE AUTOMATIONS
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setIsInstacartOpen(true)}
            className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-4 flex flex-col items-center shadow-lg transition-all duration-300 border border-navy-800/50 hover:border-green-500/30"
          >
            <div className="w-14 h-14 bg-navy-800 rounded-full flex items-center justify-center mb-3 transform transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-400">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <span className="text-white font-medium text-sm">Instacart Order</span>
          </button>
          
          <button
            onClick={() => setIsAmazonOpen(true)}
            className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-4 flex flex-col items-center shadow-lg transition-all duration-300 border border-navy-800/50 hover:border-green-500/30"
          >
            <div className="w-14 h-14 bg-navy-800 rounded-full flex items-center justify-center mb-3 transform transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-orange-500">
                <path d="M12.5 2.5L5.5 6v7.5L7 14l5.5 2.5L18 14l1.5-1V6l-7-3.5zm0 2.1l5.5 2.4-5.5 2.4-5.5-2.4 5.5-2.4zm-6 3.4l5.5 2.4v5.1L6.5 13V8zm7 0v5l5.5-2.4V8l-5.5 2.5z" />
              </svg>
            </div>
            <span className="text-white font-medium text-sm">Amazon Shopping</span>
          </button>
          
          <div className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-4 flex flex-col items-center shadow-lg transition-all duration-300 border border-navy-800/50 hover:border-blue-500/30">
            <div className="w-14 h-14 bg-navy-800 rounded-full flex items-center justify-center mb-3 transform transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-400">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <span className="text-white font-medium text-sm">Outlook Mail</span>
          </div>
          
          <div className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-4 flex flex-col items-center shadow-lg transition-all duration-300 border border-navy-800/50 hover:border-blue-500/30">
            <div className="w-14 h-14 bg-navy-800 rounded-full flex items-center justify-center mb-3 transform transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-500">
                <path d="M19 5.5a1 1 0 0 0-1-1h-1V3H7v1.5H6a1 1 0 0 0-1 1v12.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V5.5zm-6 11c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                <path d="M13 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
              </svg>
            </div>
            <span className="text-white font-medium text-sm">Kayak Flights</span>
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
            className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-purple-500/10 hover:border-purple-500/30"
          >
            <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Mic size={28} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
            <span className="text-white font-medium">New Voice Note</span>
          </button>
          
          <Link href="/calendar">
            <div className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-blue-500/10 hover:border-blue-500/30">
              <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Calendar size={28} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <span className="text-white font-medium">Schedule Meeting</span>
            </div>
          </Link>
          
          <button
            onClick={() => setIsTaskFormOpen(true)} 
            className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-green-500/10 hover:border-green-500/30"
          >
            <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Plus size={28} className="text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
            <span className="text-white font-medium">New Task</span>
          </button>
          
          <Link href="/notes">
            <div className="group bg-gradient-to-br from-navy-950 to-navy-900 hover:from-navy-900 hover:to-navy-800 rounded-xl p-6 flex flex-col items-center shadow-lg transition-all duration-300 border border-amber-500/10 hover:border-amber-500/30">
              <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
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
              <div key={i} className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-5 shadow-md border border-blue-800">
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
            <div className="text-red-400 text-center p-6 bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl shadow-md border border-red-900/30">
              Failed to load tasks
            </div>
          ) : incompleteTasks.length === 0 ? (
            <div className="text-gray-400 text-center p-6 bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl shadow-md border border-blue-800">
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
              <div key={i} className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-5 shadow-md border border-blue-800">
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
            <div className="text-red-400 text-center p-6 bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl shadow-md border border-red-900/30">
              Failed to load notes
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-gray-400 text-center p-6 bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl shadow-md border border-blue-800">
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
      
      {/* Integration Modals */}
      <InstacartModal
        isOpen={isInstacartOpen}
        onClose={() => setIsInstacartOpen(false)}
      />
      
      <AmazonModal
        isOpen={isAmazonOpen}
        onClose={() => setIsAmazonOpen(false)}
      />
    </div>
  );
}
