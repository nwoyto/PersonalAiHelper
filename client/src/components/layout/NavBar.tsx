import { Link, useLocation } from "wouter";

interface NavBarProps {
  onVoiceClick: () => void;
}

export default function NavBar({ onVoiceClick }: NavBarProps) {
  const [location] = useLocation();
  
  return (
    <>
      {/* Floating Voice Button */}
      <button 
        onClick={onVoiceClick}
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10 bg-primary w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Voice input"
      >
        <i className="ri-mic-line text-white text-2xl"></i>
      </button>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-light flex justify-around items-center px-2 py-3 z-10">
        <Link href="/">
          <div className={`flex flex-col items-center w-1/5 pt-1 pb-1 ${location === '/' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-home-5-line text-xl"></i>
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        <Link href="/tasks">
          <div className={`flex flex-col items-center w-1/5 pt-1 pb-1 ${location === '/tasks' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-task-line text-xl"></i>
            <span className="text-xs mt-1">Tasks</span>
          </div>
        </Link>
        <Link href="/calendar">
          <div className={`flex flex-col items-center w-1/5 pt-1 pb-1 ${location === '/calendar' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-calendar-line text-xl"></i>
            <span className="text-xs mt-1">Calendar</span>
          </div>
        </Link>
        <Link href="/notes">
          <div className={`flex flex-col items-center w-1/5 pt-1 pb-1 ${location === '/notes' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-file-list-line text-xl"></i>
            <span className="text-xs mt-1">Notes</span>
          </div>
        </Link>
        <Link href="/settings">
          <div className={`flex flex-col items-center w-1/5 pt-1 pb-1 ${location === '/settings' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-settings-4-line text-xl"></i>
            <span className="text-xs mt-1">Settings</span>
          </div>
        </Link>
      </nav>
    </>
  );
}
