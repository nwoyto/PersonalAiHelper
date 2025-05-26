import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, CheckCircle, X, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TranscriptionResult } from '@/types';

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
  
  // Reference to the recognition object
  const recognitionRef = useRef<any>(null);
  
  // Request microphone access
  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      setErrorMessage('Please allow microphone access to use voice recording');
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access in your browser settings',
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Initialize speech recognition with better browser compatibility
  const initializeSpeechRecognition = () => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in your browser');
      return false;
    }
    
    try {
      // Create new recognition instance
      recognitionRef.current = new SpeechRecognition();
      
      // Configure with better compatibility settings
      recognitionRef.current.continuous = false; // Better compatibility
      recognitionRef.current.interimResults = true;
      
      // Don't set language at all to use browser default
      // This avoids the language-not-supported error entirely
      
      // Set up event handlers
      recognitionRef.current.onstart = () => {
        console.log('Recognition started');
        setIsRecording(true);
        setErrorMessage(null);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result[0]) {
            currentTranscript += result[0].transcript + ' ';
          }
        }
        
        if (currentTranscript) {
          setTranscript(prev => {
            // Only append if it's new content
            if (!prev.includes(currentTranscript.trim())) {
              return prev + currentTranscript;
            }
            return prev;
          });
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        
        if (event.error === 'language-not-supported') {
          setErrorMessage('Speech recognition had a technical issue. Please use the text input below instead.');
        } else if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please try speaking again or use the text input below.');
        } else {
          setErrorMessage(`Speech recognition error (${event.error}). Please use the text input below.`);
        }
        
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        console.log('Recognition ended');
        setIsRecording(false);
      };
      
      return true;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setErrorMessage('Failed to initialize speech recognition');
      return false;
    }
  };
  
  // Start recording with better error handling
  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript(''); // Clear any previous transcript
    
    // Check microphone access first
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) {
      setErrorMessage('Microphone access is required. Please allow microphone access and try again.');
      return;
    }
    
    // Always reinitialize recognition for a fresh start
    const initialized = initializeSpeechRecognition();
    if (!initialized) {
      setErrorMessage('Speech recognition is not available in your browser. Please use the text input below.');
      return;
    }
    
    // Start recording
    try {
      recognitionRef.current.start();
      console.log('Starting speech recognition...');
      
      toast({
        title: 'Recording started',
        description: 'Speak clearly into your microphone',
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      setErrorMessage('Could not start recording. Please try using the text input below.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    setIsRecording(false);
  };
  
  // Process the transcription
  const processTranscription = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'No speech detected',
        description: 'Please say something before submitting',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      onComplete(result);
      
      toast({
        title: 'Analysis complete',
        description: `Found ${result.tasks?.length || 0} tasks in your speech`,
      });
    } catch (err) {
      console.error('Failed to process transcript:', err);
      
      // Fallback result if API fails
      const fallbackResult: TranscriptionResult = {
        text: transcript,
        tasks: [{
          title: "Task from voice input",
          description: transcript,
          category: "personal",
          priority: "medium",
        }]
      };
      
      onComplete(fallbackResult);
      
      toast({
        title: 'Basic processing complete',
        description: 'Created a simple task from your speech',
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  // Handle text input submission
  const handleTextSubmit = async () => {
    const textToProcess = textInput.trim();
    if (!textToProcess) {
      setErrorMessage('Please enter some text to process.');
      return;
    }

    setIsProcessing(true);

    try {
      const result: TranscriptionResult = {
        text: textToProcess,
        tasks: [] // Will be populated by the server
      };

      onComplete(result);
      toast({
        title: 'Text processed',
        description: 'Your request has been submitted',
      });
      onClose();
    } catch (error) {
      console.error('Error processing text:', error);
      setErrorMessage('Failed to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clean up on unmount only - don't auto-start recording
  useEffect(() => {
    // Just set up cleanup, let user manually start recording
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-navy-950 to-navy-900 rounded-xl border border-navy-800 shadow-xl max-w-md w-full p-5 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-navy-800'}`}>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Voice Assistant</h3>
                <p className="text-gray-300 text-sm">
                  {isProcessing ? 'Processing your voice...' : 
                   isRecording ? 'Listening - speak now!' : 
                   errorMessage ? 'Use text input below' :
                   'Click "Start Recording" to begin'}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-navy-700 transition-colors"
              disabled={isProcessing}
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-4 text-red-200 text-sm">
              {errorMessage}
            </div>
          )}
          
          {/* Transcript display */}
          <div className="bg-navy-800/50 border border-navy-700/50 rounded-lg p-4 min-h-[100px] mb-4 text-white shadow-inner relative overflow-hidden">
            <div className="max-h-[120px] overflow-y-auto pr-2 scrollbar-hide">
              {transcript ? (
                <p className="whitespace-pre-wrap">{transcript}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {isRecording ? "Speak now..." : "Click Start Recording to begin"}
                </p>
              )}
            </div>
            
            {isRecording && (
              <div className="absolute top-3 right-3 flex space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-200"></div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-between">
            <div>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                  disabled={isProcessing}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-500 text-white"
                  disabled={isProcessing}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>
            
            <Button
              onClick={processTranscription}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white"
              disabled={isProcessing || !transcript.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
          
          {/* Text input option */}
          <div className="mt-4 border-t border-navy-800/50 pt-4">
            <label className="block text-sm text-gray-300 mb-2">
              Or type your request:
            </label>
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-navy-800/50 border border-navy-700/50 rounded-lg p-3 min-h-[80px] text-white shadow-inner focus:border-purple-500/40 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type what you would say..."
                disabled={isProcessing}
              />
              <Button
                onClick={handleTextSubmit}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white self-end"
                disabled={isProcessing || !textInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}