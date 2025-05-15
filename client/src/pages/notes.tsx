import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Note } from "@/types";
import NoteItem from "@/components/notes/NoteItem";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import Header from "@/components/layout/Header";

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch notes
  const { 
    data: notes, 
    isLoading,
    error
  } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });
  
  // Filter notes based on search query
  const filteredNotes = notes?.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query)
    );
  }) || [];
  
  // Group notes by date
  const getNoteDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };
  
  const notesByDate: Record<string, Note[]> = {};
  
  filteredNotes.forEach(note => {
    const dateGroup = getNoteDate(note.timestamp);
    if (!notesByDate[dateGroup]) {
      notesByDate[dateGroup] = [];
    }
    notesByDate[dateGroup].push(note);
  });
  
  return (
    <div className="notes-screen px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <Header title="Notes" showUserIcon={false} />
        </div>
        <button 
          className="rounded-full bg-surface p-2"
          onClick={() => {
            const searchInput = document.getElementById("search-notes") as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }}
        >
          <i className="ri-search-line text-xl"></i>
        </button>
      </div>
      
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
          <input
            id="search-notes"
            type="text"
            placeholder="Search notes..."
            className="w-full bg-surface border-surface-light rounded-lg py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              onClick={() => setSearchQuery("")}
            >
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-4">
          <div className="flex items-center mb-2">
            <div className="flex-1 h-px bg-surface-light"></div>
            <Skeleton className="h-4 w-20 mx-3" />
            <div className="flex-1 h-px bg-surface-light"></div>
          </div>
          
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-5 w-1/3 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-4 w-full rounded mb-1" />
              <Skeleton className="h-4 w-full rounded mb-1" />
              <Skeleton className="h-4 w-4/5 rounded mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-error text-center p-4">
          Failed to load notes: {(error as Error).message}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-text-secondary text-center p-8 bg-surface rounded-lg">
          <div className="flex flex-col items-center">
            <i className="ri-file-list-line text-4xl mb-2 text-muted-foreground"></i>
            <p>
              {searchQuery 
                ? `No notes matching "${searchQuery}"` 
                : "No notes yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(notesByDate).map(([date, dateNotes]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center mb-2">
                <div className="flex-1 h-px bg-surface-light"></div>
                <span className="px-3 text-text-secondary text-xs">{date}</span>
                <div className="flex-1 h-px bg-surface-light"></div>
              </div>
              
              {/* Notes for this date */}
              <div className="space-y-4">
                {dateNotes.map(note => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
