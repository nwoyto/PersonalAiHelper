import { Link, useLocation } from "wouter";

interface NavBarProps {
  onVoiceClick: () => void;
}

export default function NavBar({ onVoiceClick }: NavBarProps) {
  const [location] = useLocation();
  
  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-10">
        <button 
          onClick={onVoiceClick}
          className="bg-primary w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:bg-primary/90 transition-colors border-4 border-white"
          aria-label="Voice input"
        >
          <i className="ri-mic-line text-white text-2xl"></i>
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-light z-10">
        <div className="max-w-screen-md mx-auto flex justify-evenly items-center px-2 py-3">
          <Link href="/">
            <div className={`flex flex-col items-center justify-center pt-1 pb-1 ${location === '/' ? 'text-primary' : 'text-text-secondary'}`}>
              <i className="ri-home-5-line text-xl"></i>
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          <Link href="/tasks">
            <div className={`flex flex-col items-center justify-center pt-1 pb-1 ${location === '/tasks' ? 'text-primary' : 'text-text-secondary'}`}>
              <i className="ri-task-line text-xl"></i>
              <span className="text-xs mt-1">Tasks</span>
            </div>
          </Link>
          <Link href="/calendar">
            <div className={`flex flex-col items-center justify-center pt-1 pb-1 ${location === '/calendar' ? 'text-primary' : 'text-text-secondary'}`}>
              <i className="ri-calendar-line text-xl"></i>
              <span className="text-xs mt-1">Calendar</span>
            </div>
          </Link>
          <Link href="/notes">
            <div className={`flex flex-col items-center justify-center pt-1 pb-1 ${location === '/notes' ? 'text-primary' : 'text-text-secondary'}`}>
              <i className="ri-file-list-line text-xl"></i>
              <span className="text-xs mt-1">Notes</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className={`flex flex-col items-center justify-center pt-1 pb-1 ${location === '/settings' ? 'text-primary' : 'text-text-secondary'}`}>
              <i className="ri-settings-4-line text-xl"></i>
              <span className="text-xs mt-1">Settings</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}
