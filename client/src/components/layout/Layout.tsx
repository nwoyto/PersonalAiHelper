import { ReactNode } from "react";
import NavBar from "./NavBar";
import VoiceModal from "../voice/VoiceModal";

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
      <main className="flex-1 overflow-y-auto pb-28" id="main-content">
        {children}
      </main>
      
      <NavBar onVoiceClick={handleVoiceClick} />
      
      {isVoiceModalOpen && (
        <VoiceModal 
          onClose={handleVoiceClose} 
          onComplete={(result) => {
            console.log("Transcription complete:", result);
            handleVoiceClose();
          }}
        />
      )}
    </div>
  );
}
