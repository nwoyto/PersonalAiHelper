import { ReactNode, useEffect, useState } from "react";
import NavBar from "./NavBar";
import FloatingRecorder from "../voice/FloatingRecorder";
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
  const [location, navigate] = useLocation();
  const [shouldStartRecording, setShouldStartRecording] = useState(false);
  
  const handleVoiceClick = () => {
    // If already on the agent page, just open the voice modal
    if (location === '/voice-test') {
      setIsVoiceModalOpen(true);
      // Signal that recording should start automatically
      setShouldStartRecording(true);
    } else {
      // Navigate to the agent page and open voice modal there
      navigate('/voice-test');
      
      // Show toast
      toast({
        title: "Agent activated",
        description: "Opening voice assistant...",
      });
      
      // Slight delay to ensure navigation completes before opening modal
      setTimeout(() => {
        setIsVoiceModalOpen(true);
        // Signal that recording should start automatically
        setShouldStartRecording(true);
      }, 300);
    }
  };

  const handleVoiceClose = () => {
    setIsVoiceModalOpen(false);
    setShouldStartRecording(false);
  };
  
  // Pass the recording signal to the Agent page via a custom event
  useEffect(() => {
    if (shouldStartRecording && location === '/voice-test') {
      // Custom event to trigger recording in the Agent component
      const startRecordingEvent = new CustomEvent('startVoiceRecording');
      document.dispatchEvent(startRecordingEvent);
      
      // Reset the flag after triggering
      setShouldStartRecording(false);
    }
  }, [shouldStartRecording, location]);

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
