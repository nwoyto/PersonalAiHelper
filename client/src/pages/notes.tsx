import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Note } from "@/types";
import NoteItem from "@/components/notes/NoteItem";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, X, FileText } from "lucide-react";

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
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Notes</h1>
        <button 
          className="rounded-full bg-gray-800 p-2 hover:bg-gray-700 transition-colors"
          onClick={() => {
            const searchInput = document.getElementById("search-notes") as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }}
        >
          <Search className="h-5 w-5 text-purple-400" />
        </button>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            id="search-notes"
            type="text"
            placeholder="Search notes..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <Skeleton className="h-5 w-24 mx-3 bg-gray-700" />
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>
          
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-start mb-3">
                <Skeleton className="h-6 w-1/3 rounded bg-gray-700" />
                <Skeleton className="h-5 w-20 rounded bg-gray-700" />
              </div>
              <Skeleton className="h-4 w-full rounded mb-2 bg-gray-700" />
              <Skeleton className="h-4 w-full rounded mb-2 bg-gray-700" />
              <Skeleton className="h-4 w-4/5 rounded mb-4 bg-gray-700" />
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <Skeleton className="h-5 w-24 rounded bg-gray-700" />
                <Skeleton className="h-5 w-28 rounded bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-400 text-center p-6 bg-gray-800 border border-red-900/30 rounded-xl shadow-md">
          Failed to load notes: {(error as Error).message}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-gray-300 text-center p-10 bg-gray-800 border border-gray-700 rounded-xl shadow-md">
          <div className="flex flex-col items-center">
            <FileText className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-lg">
              {searchQuery 
                ? `No notes matching "${searchQuery}"` 
                : "No notes yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(notesByDate).map(([date, dateNotes]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center mb-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="px-4 text-gray-400 text-sm font-medium">{date}</span>
                <div className="flex-1 h-px bg-gray-700"></div>
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
