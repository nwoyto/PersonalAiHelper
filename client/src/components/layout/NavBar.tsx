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
          <a className={`flex flex-col items-center w-1/4 pt-1 pb-1 ${location === '/' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-home-5-line text-xl"></i>
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/tasks">
          <a className={`flex flex-col items-center w-1/4 pt-1 pb-1 ${location === '/tasks' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-task-line text-xl"></i>
            <span className="text-xs mt-1">Tasks</span>
          </a>
        </Link>
        <Link href="/notes">
          <a className={`flex flex-col items-center w-1/4 pt-1 pb-1 ${location === '/notes' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-file-list-line text-xl"></i>
            <span className="text-xs mt-1">Notes</span>
          </a>
        </Link>
        <Link href="/settings">
          <a className={`flex flex-col items-center w-1/4 pt-1 pb-1 ${location === '/settings' ? 'text-primary' : 'text-text-secondary'}`}>
            <i className="ri-settings-4-line text-xl"></i>
            <span className="text-xs mt-1">Settings</span>
          </a>
        </Link>
      </nav>
    </>
  );
}
