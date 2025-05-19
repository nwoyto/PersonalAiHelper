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
  const [mockTranscription, setMockTranscription] = useState("");
  
  // We're going to remove the automatic replit environment check
  // and instead try to use real speech recognition first,
  // falling back to demo mode only if it fails
  
  const [forceDemoMode, setForceDemoMode] = useState(false);
  
  // Only use demo mode if speech recognition initialization explicitly failed
  if (forceDemoMode) {
    const handleSubmitDemo = () => {
      setIsProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        const result = { 
          text: mockTranscription || "Schedule a team meeting for next Monday at 2pm to discuss the marketing strategy.", 
          tasks: [{
            title: "Team Meeting: Marketing Strategy",
            dueDate: "2025-05-20T14:00:00",
            category: "work"
          }]
        };
        
        setIsProcessing(false);
        onComplete(result);
        
        toast({
          title: "Tasks extracted",
          description: `Created ${result.tasks.length} new task(s)`,
          variant: "default",
        });
      }, 1500);
    };
    
    // Provide a demo interface that doesn't rely on actual speech recognition
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
        <div className="voice-input-screen px-4 py-8 h-full flex flex-col w-full">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 mb-6 flex items-center justify-center">
              <i className="ri-mic-fill text-4xl text-primary"></i>
            </div>
            
            <div className="mb-6">
              <p className="text-xl font-medium mb-2">
                {isProcessing 
                  ? "Processing..." 
                  : "Voice Assistant"}
              </p>
              <div className="flex flex-col items-center">
                <p className="text-sm text-text-secondary mb-1">
                  Replit Demo Environment
                </p>
                <p className="text-xs text-amber-500 max-w-xs text-center">
                  Note: In production, this would use always-on speech recognition with wake word detection. 
                  Type your command below for the demo.
                </p>
              </div>
            </div>
            
            <div className="w-full max-w-md bg-surface rounded-xl p-5 mb-6">
              <textarea
                className="w-full h-24 p-2 bg-transparent border border-primary/30 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Type what you would say..."
                value={mockTranscription}
                onChange={(e) => setMockTranscription(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div className="flex space-x-4">
              <button 
                className="rounded-full p-4 bg-destructive/90 hover:bg-destructive text-white disabled:opacity-50"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Cancel"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
              <button 
                className="rounded-full p-4 bg-secondary/90 hover:bg-secondary text-white disabled:opacity-50"
                onClick={handleSubmitDemo}
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
  
  // For actual speech recognition in browsers that support it
  const [initializationFailed, setInitializationFailed] = useState(false);
  
  const {
    isListening,
    transcription,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetRecognitionState
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
  
  // Start listening when component mounts
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    // Only try to start listening if we haven't detected initialization problems
    if (!initializationFailed) {
      timeoutId = setTimeout(() => {
        try {
          startListening();
        } catch (err) {
          console.error('Failed to start listening:', err);
          setInitializationFailed(true);
          // Fall back to demo mode if speech recognition fails
          setForceDemoMode(true);
        }
      }, 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        cancelListening();
      } catch (err) {
        console.error('Error cleaning up:', err);
      }
    };
  }, []);
  
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
                  : initializationFailed
                    ? "Recognition failed" 
                    : "Ready to listen"}
            </p>
            {isListening && <SoundWave />}
          </div>
          
          <div className="w-full max-w-md bg-surface rounded-xl p-5 mb-6">
            {initializationFailed ? (
              <div className="text-center">
                <p className="text-text-secondary text-sm italic mb-4">
                  Speech recognition could not be initialized. This might be due to browser permissions or compatibility issues.
                </p>
                <button 
                  onClick={() => {
                    setInitializationFailed(false);
                    resetRecognitionState();
                    setTimeout(() => startListening(), 300);
                  }}
                  className="px-4 py-2 bg-primary rounded-md text-white text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <p className="text-text-secondary text-sm italic">
                {transcription || "Say something..."}
              </p>
            )}
          </div>
          
          {error && !initializationFailed && (
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
