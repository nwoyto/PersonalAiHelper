import { ReactNode } from "react";
import NavBar from "./NavBar";
import SimpleVoiceRecorder from "../voice/SimpleVoiceRecorder";
import { TranscriptionResult } from "@/types";
import { Mic } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

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
    // Simply open the voice recorder modal
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
              className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full transition-all flex items-center justify-center shadow-lg"
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
      
      {/* Simple voice recorder modal */}
      {isVoiceModalOpen && (
        <SimpleVoiceRecorder 
          onClose={handleVoiceClose} 
          onComplete={(result: TranscriptionResult) => {
            console.log("Transcription complete:", result);
            handleVoiceClose();
            
            // Show success message
            toast({
              title: "Voice recorded successfully",
              description: `Created task from your voice input`,
            });
          }}
        />
      )}
    </div>
  );
}
