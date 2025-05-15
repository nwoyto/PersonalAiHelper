import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Note } from "@/types";
import TaskItem from "@/components/tasks/TaskItem";
import NoteItem from "@/components/notes/NoteItem";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [greeting, setGreeting] = useState("Good day");
  
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
    <div className="home-screen px-4 py-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold">VoiceFlow</h1>
          <p className="text-text-secondary text-sm">Your AI Assistant</p>
        </div>
        <button className="rounded-full bg-surface p-2">
          <i className="ri-user-line text-text-primary text-xl"></i>
        </button>
      </header>

      {/* Greeting & Assistant Status */}
      <section className="mb-8 slide-up">
        <div className="bg-surface rounded-xl p-5 flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <i className="ri-robot-line text-primary text-2xl"></i>
          </div>
          <h2 className="text-lg font-medium mb-1">{greeting}, User</h2>
          <p className="text-text-secondary text-sm mb-3">I'm listening and ready to help</p>
          <div className="flex items-center text-xs text-primary font-medium">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            Active and listening
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8 slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-sm font-medium text-text-secondary uppercase mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center transition">
            <i className="ri-mic-line text-primary text-xl mb-2"></i>
            <span className="text-sm">New Voice Note</span>
          </button>
          <button className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center transition">
            <i className="ri-calendar-line text-accent text-xl mb-2"></i>
            <span className="text-sm">Schedule Meeting</span>
          </button>
          <button className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center transition">
            <i className="ri-add-line text-secondary text-xl mb-2"></i>
            <span className="text-sm">New Task</span>
          </button>
          <button className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center transition">
            <i className="ri-search-line text-warning text-xl mb-2"></i>
            <span className="text-sm">Find Notes</span>
          </button>
        </div>
      </section>

      {/* Recent Tasks */}
      <section className="mb-8 slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-text-secondary uppercase">Your Tasks</h3>
          <Link href="/tasks" className="text-primary text-sm">View All</Link>
        </div>
        
        {/* Task List */}
        <div className="space-y-3">
          {isTasksLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg p-4">
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
            <div className="text-error text-center p-4">
              Failed to load tasks
            </div>
          ) : incompleteTasks.length === 0 ? (
            <div className="text-text-secondary text-center p-4 bg-surface rounded-lg">
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
      <section className="mb-8 slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-text-secondary uppercase">Recent Conversations</h3>
          <Link href="/notes" className="text-primary text-sm">View All</Link>
        </div>
        
        <div className="space-y-3">
          {isNotesLoading ? (
            // Loading skeletons
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg p-4">
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
            <div className="text-error text-center p-4">
              Failed to load notes
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-text-secondary text-center p-4 bg-surface rounded-lg">
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
    </div>
  );
}
