import { Note } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { FileText, CheckSquare } from "lucide-react";

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };
  
  const getCategoryClasses = (category: string) => {
    switch (category) {
      case "work":
        return "bg-blue-900/30 text-blue-400 border border-blue-800/40";
      case "personal":
        return "bg-green-900/30 text-green-400 border border-green-800/40";
      default:
        return "bg-blue-900/30 text-blue-400 border border-blue-800/40";
    }
  };
  
  return (
    <div className="bg-blue-950 border border-blue-800 rounded-xl p-5 shadow-md transition-all hover:shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-white">{note.title}</h4>
        <span className="text-xs text-gray-400">{formatTimestamp(note.timestamp)}</span>
      </div>
      <p className="text-sm text-gray-300 mb-4 line-clamp-3">{note.content}</p>
      <div className="flex items-center justify-between pt-3 border-t border-blue-800">
        <span className={`text-xs px-2.5 py-1 rounded-full ${getCategoryClasses(note.category)}`}>
          {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
        </span>
        {note.extractedTasks > 0 && (
          <div className="flex items-center text-purple-400 text-xs">
            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            {note.extractedTasks} task{note.extractedTasks !== 1 ? 's' : ''} extracted
          </div>
        )}
      </div>
    </div>
  );
}
