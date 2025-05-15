import { useState, useEffect } from "react";
import SoundWave from "@/components/ui/sound-wave";
import { useSpeech } from "@/lib/useSpeech";
import { useToast } from "@/hooks/use-toast";

interface VoiceModalProps {
  onClose: () => void;
  onComplete: (result: { text: string, tasks: any[] }) => void;
}

export default function VoiceModal({ onClose, onComplete }: VoiceModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    isListening,
    transcription,
    error,
    startListening,
    stopListening,
    cancelListening
  } = useSpeech({
    onTranscriptionComplete: (result) => {
      setIsProcessing(false);
      onComplete(result);
      
      if (result.tasks.length > 0) {
        toast({
          title: "Tasks extracted",
          description: `Created ${result.tasks.length} new task${result.tasks.length !== 1 ? 's' : ''}`,
          variant: "default",
        });
      }
    },
    onError: (errorMsg) => {
      toast({
        title: "Speech recognition error",
        description: errorMsg,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });
  
  useEffect(() => {
    // We need to use a ref to track if we've already started listening
    // to avoid the effect running multiple times
    const timeoutId = setTimeout(() => {
      startListening();
    }, 500);
    
    return () => {
      // Clean up when component unmounts
      clearTimeout(timeoutId);
      cancelListening();
    };
  }, []); // Empty dependency array to run only once
  
  const handleCancelClick = () => {
    cancelListening();
    onClose();
  };
  
  const handleConfirmClick = async () => {
    if (transcription.trim()) {
      setIsProcessing(true);
      await stopListening();
    } else {
      toast({
        title: "No speech detected",
        description: "Please say something before confirming",
        variant: "default",
      });
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
      <div className="voice-input-screen px-4 py-8 h-full flex flex-col w-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`w-24 h-24 rounded-full bg-primary/20 mb-6 flex items-center justify-center ${isListening ? 'pulse-animation' : ''}`}>
            <i className="ri-mic-fill text-4xl text-primary"></i>
          </div>
          
          <div className="mb-6">
            <p className="text-xl font-medium mb-2">
              {isProcessing 
                ? "Processing..." 
                : isListening 
                  ? "Listening..." 
                  : "Ready to listen"}
            </p>
            {isListening && <SoundWave />}
          </div>
          
          <div className="w-full max-w-md bg-surface rounded-xl p-5 mb-6">
            <p className="text-text-secondary text-sm italic">
              {transcription || "Say something..."}
            </p>
          </div>
          
          {error && (
            <div className="text-error text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="flex space-x-4">
            <button 
              className="rounded-full p-4 bg-destructive/90 hover:bg-destructive text-white disabled:opacity-50"
              onClick={handleCancelClick}
              disabled={isProcessing}
              aria-label="Cancel"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
            <button 
              className="rounded-full p-4 bg-secondary/90 hover:bg-secondary text-white disabled:opacity-50"
              onClick={handleConfirmClick}
              disabled={isProcessing}
              aria-label="Confirm"
            >
              <i className="ri-check-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
