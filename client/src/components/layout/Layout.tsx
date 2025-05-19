import { ReactNode } from "react";
import NavBar from "./NavBar";
import Header from "./Header";
import FloatingRecorder from "../voice/FloatingRecorder";
import { TranscriptionResult } from "@/types";

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
  const handleVoiceClick = () => {
    setIsVoiceModalOpen(true);
  };

  const handleVoiceClose = () => {
    setIsVoiceModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text-primary">
      {/* Add Header component with voice button */}
      <Header onVoiceClick={handleVoiceClick} />
      
      <main className="flex-1 overflow-y-auto pb-20" id="main-content">
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
