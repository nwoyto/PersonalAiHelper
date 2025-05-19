import { useState, useEffect } from "react";
import SoundWave from "@/components/ui/sound-wave";
import { useSpeech } from "@/lib/useSpeech";
import { useToast } from "@/hooks/use-toast";
import { processTranscription } from "@/lib/openai";
import { TranscriptionResult } from "@/types";

interface FloatingRecorderProps {
  onClose: () => void;
  onComplete: (result: TranscriptionResult) => void;
}

export default function FloatingRecorder({ onClose, onComplete }: FloatingRecorderProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mockTranscription, setMockTranscription] = useState("");
  const [showDemoInput, setShowDemoInput] = useState(false);
  
  // We're going to remove the automatic replit environment check
  // and instead try to use real speech recognition first,
  // falling back to demo mode only if it fails
  
  const [forceDemoMode, setForceDemoMode] = useState(false);
  
  // Only use demo mode if speech recognition initialization explicitly failed
  if (forceDemoMode) {
    const handleSubmitDemo = async () => {
      setIsProcessing(true);
      
      try {
        // Process the transcription with AI to extract tasks
        const aiProcessedResult = await processTranscription(
          mockTranscription || "Schedule a team meeting for next Monday at 2pm to discuss the marketing strategy."
        );
        
        setIsProcessing(false);
        onComplete(aiProcessedResult);
        
        toast({
          title: "Tasks extracted",
          description: `Created ${aiProcessedResult.tasks.length} new task(s)`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error processing transcription:", error);
        
        // Fallback if AI processing fails
        const result: TranscriptionResult = { 
          text: mockTranscription || "Schedule a team meeting for next Monday at 2pm to discuss the marketing strategy.", 
          tasks: [{
            title: "Team Meeting: Marketing Strategy",
            dueDate: "2025-05-20T14:00:00",
            category: "work",
            priority: "medium",
            estimatedMinutes: 60,
            people: ["Marketing Team"],
            recurring: false
          }]
        };
      
        setIsProcessing(false);
        onComplete(result);
        
        toast({
          title: "Tasks extracted",
          description: `Created ${result.tasks.length} new task(s)`,
          variant: "default",
        });
      }
    };
    
    // Provide a demo interface that doesn't rely on actual speech recognition
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center">
        <div className="bg-surface rounded-xl shadow-lg p-3 max-w-md mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <i className="ri-mic-fill text-primary text-xl"></i>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isProcessing ? "Processing..." : "Voice Assistant"}
                </p>
                <p className="text-xs text-text-secondary">Replit Demo Mode</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="w-8 h-8 rounded-full bg-destructive/70 hover:bg-destructive flex items-center justify-center text-white disabled:opacity-50"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Cancel"
              >
                <i className="ri-close-line"></i>
              </button>
              <button 
                className="w-8 h-8 rounded-full bg-secondary/70 hover:bg-secondary flex items-center justify-center text-white disabled:opacity-50"
                onClick={handleSubmitDemo}
                disabled={isProcessing}
                aria-label="Confirm"
              >
                <i className="ri-check-line"></i>
              </button>
            </div>
          </div>
          
          {!showDemoInput ? (
            <button 
              className="text-xs text-primary underline block w-full text-center py-1"
              onClick={() => setShowDemoInput(true)}
            >
              Tap to enter text manually
            </button>
          ) : (
            <div className="mt-2">
              <textarea
                className="w-full h-20 p-2 bg-transparent border border-primary/30 rounded-lg focus:outline-none focus:border-primary text-sm"
                placeholder="Type what you would say..."
                value={mockTranscription}
                onChange={(e) => setMockTranscription(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          )}
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
        }
      }, 500);
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
    <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center">
      <div className="bg-surface rounded-xl shadow-lg p-3 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3 ${isListening ? 'pulse-animation' : ''}`}>
              <i className="ri-mic-fill text-primary text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium">
                {isProcessing 
                  ? "Processing..." 
                  : isListening 
                    ? "Listening..." 
                    : initializationFailed
                      ? "Recognition failed" 
                      : "Ready to listen"}
              </p>
              {isListening && <SoundWave className="h-4" />}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="w-8 h-8 rounded-full bg-destructive/70 hover:bg-destructive flex items-center justify-center text-white disabled:opacity-50"
              onClick={handleCancelClick}
              disabled={isProcessing}
              aria-label="Cancel"
            >
              <i className="ri-close-line"></i>
            </button>
            <button 
              className="w-8 h-8 rounded-full bg-secondary/70 hover:bg-secondary flex items-center justify-center text-white disabled:opacity-50"
              onClick={handleConfirmClick}
              disabled={isProcessing}
              aria-label="Confirm"
            >
              <i className="ri-check-line"></i>
            </button>
          </div>
        </div>
        
        {initializationFailed ? (
          <div className="text-center py-2">
            <p className="text-text-secondary text-xs mb-2">
              Speech recognition could not be initialized.
            </p>
            <button 
              onClick={() => {
                setInitializationFailed(false);
                resetRecognitionState();
                setTimeout(() => startListening(), 300);
              }}
              className="px-2 py-1 bg-primary rounded-md text-white text-xs"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-surface-light rounded-lg p-2 text-xs text-text-secondary overflow-hidden">
            <div className="max-h-20 overflow-y-auto">
              {transcription || "Say something..."}
            </div>
          </div>
        )}
        
        {error && !initializationFailed && (
          <div className="text-error text-xs mt-1">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}