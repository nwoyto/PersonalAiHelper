import { Link, useLocation } from "wouter";
import { Home, ListTodo, Calendar, FileText, Settings, Radio } from "lucide-react";

interface NavBarProps {}

export default function NavBar({}: NavBarProps) {
  const [location] = useLocation();
  
  return (
    <>
      {/* Bottom Navigation - hidden on login page */}
      {location !== '/login' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-10 shadow-lg">
          <div className="max-w-screen-lg mx-auto flex justify-around items-center px-2 py-3">
            <Link href="/">
              <div className={`flex flex-col items-center justify-center pt-1 pb-1 px-3 rounded-lg transition-colors ${
                location === '/' 
                  ? 'text-purple-400 bg-purple-900/20 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
                <Home className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Home</span>
              </div>
            </Link>
            
            <Link href="/tasks">
              <div className={`flex flex-col items-center justify-center pt-1 pb-1 px-3 rounded-lg transition-colors ${
                location === '/tasks' 
                  ? 'text-purple-400 bg-purple-900/20 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
                <ListTodo className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Tasks</span>
              </div>
            </Link>
            
            <Link href="/calendar">
              <div className={`flex flex-col items-center justify-center pt-1 pb-1 px-3 rounded-lg transition-colors ${
                location === '/calendar' 
                  ? 'text-purple-400 bg-purple-900/20 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
                <Calendar className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Calendar</span>
              </div>
            </Link>
            
            <Link href="/notes">
              <div className={`flex flex-col items-center justify-center pt-1 pb-1 px-3 rounded-lg transition-colors ${
                location === '/notes' 
                  ? 'text-purple-400 bg-purple-900/20 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Notes</span>
              </div>
            </Link>
            
            <Link href="/settings">
              <div className={`flex flex-col items-center justify-center pt-1 pb-1 px-3 rounded-lg transition-colors ${
                location === '/settings' 
                  ? 'text-purple-400 bg-purple-900/20 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
                <Settings className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Settings</span>
              </div>
            </Link>
            
            <Link href="/voice-test">
              <div className={`flex flex-col items-center justify-center pt-1 pb-1 px-3 rounded-lg transition-colors ${
                location === '/voice-test' 
                  ? 'text-purple-400 bg-purple-900/20 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
                <Radio className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Agent</span>
              </div>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
