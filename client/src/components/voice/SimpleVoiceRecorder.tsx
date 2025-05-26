
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Send, X, Loader2 } from 'lucide-react';
import { TranscriptionResult } from '@/types';
import { processTranscription } from '@/lib/openai';
import { toast } from '@/hooks/use-toast';

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SimpleVoiceRecorderProps {
  onClose: () => void;
  onComplete: (result: TranscriptionResult) => void;
}

export default function SimpleVoiceRecorder({ onClose, onComplete }: SimpleVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Reference to the recognition object
  const recognitionRef = useRef<any>(null);
  
  // Request microphone access
  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately since we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setErrorMessage(null);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      setHasPermission(false);
      setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.');
      return false;
    }
  };
  
  // Initialize speech recognition with better browser compatibility
  const initializeSpeechRecognition = async () => {
    if (typeof window === 'undefined') return false;
    
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }
    
    // Request microphone permission first
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) {
      return false;
    }
    
    try {
      // Create new recognition instance
      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = false; // Single recognition session
      recognition.interimResults = true; // Show results as user speaks
      recognition.maxAlternatives = 1;
      
      // Don't set language initially - let browser use default
      // This avoids the "language-not-supported" error
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setErrorMessage(null);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcript with both final and interim results
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMsg = '';
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMsg = 'Microphone not available. Please check your microphone connection.';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone access denied. Please allow microphone access and try again.';
            setHasPermission(false);
            break;
          case 'network':
            errorMsg = 'Network error occurred. Please check your internet connection.';
            break;
          case 'language-not-supported':
            errorMsg = 'Language not supported. Trying with browser default...';
            // Try to restart with no language specified
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.lang = '';
                  startRecording();
                } catch (err) {
                  setErrorMessage('Speech recognition failed. Please try typing your message instead.');
                }
              }
            }, 500);
            break;
          default:
            errorMsg = `Speech recognition error: ${event.error}`;
        }
        
        if (event.error !== 'language-not-supported') {
          setErrorMessage(errorMsg);
          setIsRecording(false);
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
      return true;
      
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setErrorMessage('Failed to initialize speech recognition. Please refresh the page and try again.');
      return false;
    }
  };
  
  // Initialize speech recognition on component mount
  useEffect(() => {
    initializeSpeechRecognition();
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.error('Error cleaning up recognition:', err);
        }
      }
    };
  }, []);
  
  const startRecording = async () => {
    if (!recognitionRef.current) {
      const initialized = await initializeSpeechRecognition();
      if (!initialized) return;
    }
    
    if (hasPermission === false) {
      const hasAccess = await requestMicrophoneAccess();
      if (!hasAccess) return;
    }
    
    try {
      setTranscript('');
      setErrorMessage(null);
      recognitionRef.current.start();
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      
      if (err.message.includes('already started')) {
        // Recognition is already running, just update state
        setIsRecording(true);
      } else {
        setErrorMessage('Failed to start recording. Please try again.');
      }
    }
  };
  
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  };
  
  const handleProcessTranscript = async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "No text to process",
        description: "Please record some speech or type a message first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await processTranscription(text);
      onComplete(result);
      
      if (result.tasks.length > 0) {
        toast({
          title: "Tasks extracted",
          description: `Created ${result.tasks.length} new task${result.tasks.length !== 1 ? 's' : ''}`,
        });
      }
    } catch (error) {
      console.error('Error processing transcription:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process the transcription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSendTranscript = () => {
    const textToProcess = transcript.trim() || textInput.trim();
    handleProcessTranscript(textToProcess);
  };
  
  const handleSendTextInput = () => {
    handleProcessTranscript(textInput);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Voice Assistant</CardTitle>
              <CardDescription>
                Record your voice or type your message
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          )}
          
          {/* Microphone permission status */}
          {hasPermission === false && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Microphone access is required for voice recording. Please allow access and try again.
              </p>
              <Button
                onClick={requestMicrophoneAccess}
                size="sm"
                className="mt-2"
              >
                Grant Permission
              </Button>
            </div>
          )}
          
          {/* Voice recording section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Voice Recording</span>
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={isProcessing || hasPermission === false}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MicOff className="h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </div>
            
            {/* Transcript display */}
            <div className="min-h-[80px] p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
              {isRecording && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recording...</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">
                {transcript || "Click 'Start Recording' and speak your message..."}
              </p>
            </div>
            
            {transcript && (
              <Button
                onClick={handleSendTranscript}
                disabled={isProcessing}
                className="w-full flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Process Voice Recording
              </Button>
            )}
          </div>
          
          {/* Text input alternative */}
          <div className="space-y-3 border-t pt-4">
            <span className="text-sm font-medium">Or Type Your Message</span>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full min-h-[80px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            
            {textInput && (
              <Button
                onClick={handleSendTextInput}
                disabled={isProcessing}
                className="w-full flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Process Text Message
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
