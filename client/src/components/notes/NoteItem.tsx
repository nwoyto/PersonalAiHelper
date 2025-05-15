import { Note } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ContentCard } from "@/components/ui/content-card";

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
        return "bg-accent/20 text-accent";
      case "personal":
        return "bg-secondary/20 text-secondary";
      default:
        return "bg-accent/20 text-accent";
    }
  };
  
  return (
    <ContentCard>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium">{note.title}</h4>
        <span className="text-xs text-text-secondary">{formatTimestamp(note.timestamp)}</span>
      </div>
      <p className="text-sm text-text-secondary mb-3 line-clamp-3">{note.content}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryClasses(note.category)}`}>
          {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
        </span>
        {note.extractedTasks > 0 && (
          <div className="flex items-center text-primary text-xs">
            <i className="ri-checkbox-line mr-1"></i>
            {note.extractedTasks} task{note.extractedTasks !== 1 ? 's' : ''} extracted
          </div>
        )}
      </div>
    </ContentCard>
  );
}
