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
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
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
      
      // If we get an error during speech recognition, switch to demo mode
      if (!useDemoMode && initializationAttempted) {
        setUseDemoMode(true);
        setInitializationFailed(true);
      }
    }
  });
  
  // Handle demo mode submission
  const handleSubmitDemo = () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const result = { 
        text: mockTranscription || "Schedule a team meeting for next Monday at 2pm to discuss the marketing strategy.", 
        tasks: [{
          title: "Team Meeting: Marketing Strategy",
          dueDate: "2025-05-20T14:00:00",
          category: "work",
          priority: "medium",
          estimatedMinutes: 60
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
  
  // Start listening when component mounts
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (!initializationAttempted) {
      timeoutId = setTimeout(() => {
        try {
          startListening();
          setInitializationAttempted(true);
        } catch (err) {
          console.error('Failed to start listening:', err);
          setInitializationFailed(true);
          setUseDemoMode(true);
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
  }, [initializationAttempted]);
  
  const handleCancelClick = () => {
    if (!useDemoMode) {
      cancelListening();
    }
    onClose();
  };
  
  const handleConfirmClick = async () => {
    if (useDemoMode) {
      handleSubmitDemo();
    } else if (transcription.trim()) {
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
  
  const tryAgainWithMicrophone = () => {
    setUseDemoMode(false);
    setInitializationFailed(false);
    resetRecognitionState();
    setTimeout(() => {
      try {
        startListening();
      } catch (err) {
        console.error('Failed to restart listening:', err);
        setInitializationFailed(true);
        setUseDemoMode(true);
      }
    }, 300);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
      <div className="voice-input-screen px-4 py-8 h-full flex flex-col w-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`w-24 h-24 rounded-full bg-primary/20 mb-6 flex items-center justify-center ${!useDemoMode && isListening ? 'pulse-animation' : ''}`}>
            <i className="ri-mic-fill text-4xl text-primary"></i>
          </div>
          
          <div className="mb-6">
            <p className="text-xl font-medium mb-2">
              {isProcessing 
                ? "Processing..." 
                : useDemoMode
                  ? "Voice Assistant (Demo Mode)"
                  : isListening 
                    ? "Listening..." 
                    : initializationFailed
                      ? "Recognition failed" 
                      : "Ready to listen"}
            </p>
            {!useDemoMode && isListening && <SoundWave />}
          </div>
          
          {useDemoMode ? (
            <div className="w-full max-w-md bg-surface rounded-xl p-5 mb-6">
              <textarea
                className="w-full h-24 p-2 bg-transparent border border-primary/30 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Type what you would say..."
                value={mockTranscription}
                onChange={(e) => setMockTranscription(e.target.value)}
                disabled={isProcessing}
              />
              <div className="mt-2 text-center">
                <button 
                  className="text-xs text-primary underline"
                  onClick={tryAgainWithMicrophone}
                >
                  Try with microphone instead
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md bg-surface rounded-xl p-5 mb-6">
              {initializationFailed ? (
                <div className="text-center">
                  <p className="text-text-secondary text-sm italic mb-4">
                    Speech recognition could not be initialized. This might be due to browser permissions or compatibility issues.
                  </p>
                  <div className="flex justify-center space-x-2">
                    <button 
                      onClick={tryAgainWithMicrophone}
                      className="px-4 py-2 bg-primary rounded-md text-white text-sm"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setUseDemoMode(true)}
                      className="px-4 py-2 bg-secondary rounded-md text-white text-sm"
                    >
                      Use Demo Mode
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary text-sm italic">
                  {transcription || "Say something..."}
                </p>
              )}
            </div>
          )}
          
          {error && !initializationFailed && !useDemoMode && (
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
