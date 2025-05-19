import { ReactNode } from "react";
import NavBar from "./NavBar";
import FloatingRecorder from "../voice/FloatingRecorder";
import { TranscriptionResult } from "@/types";
import { Mic } from "lucide-react";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (isOpen: boolean) => void;
}

export default function Layout({ 
  children, 
  isVoiceModalOpen, 
  setIsVoiceModalOpen 
}: LayoutProps) {
  const [location] = useLocation();
  
  const handleVoiceClick = () => {
    setIsVoiceModalOpen(true);
  };

  const handleVoiceClose = () => {
    setIsVoiceModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text-primary">
      <main className="flex-1 overflow-y-auto pb-20" id="main-content">
        {/* Floating voice button in top-right corner */}
        {location !== '/login' && (
          <div className="fixed top-4 right-4 z-30">
            <button
              onClick={handleVoiceClick}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center justify-center shadow-lg"
              aria-label="Voice Assistant"
            >
              <Mic size={20} />
            </button>
          </div>
        )}
        
        {children}
      </main>
      
      {/* Keep bottom navigation for other links */}
      <NavBar />
      
      {isVoiceModalOpen && (
        <FloatingRecorder 
          onClose={handleVoiceClose} 
          onComplete={(result: TranscriptionResult) => {
            console.log("Transcription complete:", result);
            handleVoiceClose();
          }}
        />
      )}
    </div>
  );
}
