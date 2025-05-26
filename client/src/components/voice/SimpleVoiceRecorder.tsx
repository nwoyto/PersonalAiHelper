
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Send, X, Loader2 } from 'lucide-react';
import { TranscriptionResult } from '@/types';
import { processTranscription } from '@/lib/openai';
import { toast } from '@/hooks/use-toast';

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
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  
  // Check if speech recognition is supported
  const checkSpeechSupport = () => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  };
  
  // Request microphone access
  const requestMicrophoneAccess = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Test that we actually got audio
      const tracks = stream.getAudioTracks();
      if (tracks.length === 0) {
        throw new Error('No audio tracks available');
      }
      
      console.log('Microphone access granted, tracks:', tracks.length);
      
      // Clean up the test stream
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setErrorMessage(null);
      return true;
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setHasPermission(false);
      
      let errorMsg = 'Microphone access denied. ';
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Please click the microphone icon in your browser address bar and allow access.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No microphone found. Please connect a microphone and try again.';
      } else {
        errorMsg += 'Please check your microphone settings and try again.';
      }
      
      setErrorMessage(errorMsg);
      return false;
    }
  };
  
  // Initialize speech recognition with extensive error handling
  const initializeSpeechRecognition = async () => {
    if (isInitializedRef.current) {
      console.log('Speech recognition already initialized');
      return recognitionRef.current !== null;
    }
    
    console.log('Initializing speech recognition...');
    
    // Check support first
    if (!checkSpeechSupport()) {
      setIsSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }
    
    setIsSupported(true);
    
    // Get microphone permission
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) {
      return false;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Very basic configuration to avoid compatibility issues
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // Don't set language at all - let browser handle it
      console.log('Creating speech recognition with default settings');
      
      recognition.onstart = () => {
        console.log('✓ Speech recognition started successfully');
        setIsRecording(true);
        setErrorMessage(null);
      };
      
      recognition.onresult = (event: any) => {
        console.log('Speech recognition result received');
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
        
        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error, event);
        
        let errorMsg = '';
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'audio-capture':
            errorMsg = 'Microphone could not capture audio. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone access was denied. Please allow microphone access and refresh the page.';
            setHasPermission(false);
            break;
          case 'network':
            errorMsg = 'Network error occurred. Please check your internet connection.';
            break;
          case 'language-not-supported':
            errorMsg = 'Language not supported. Please try typing your message instead.';
            break;
          case 'service-not-allowed':
            errorMsg = 'Speech service not allowed. Please try typing your message instead.';
            break;
          default:
            errorMsg = `Speech recognition failed (${event.error}). Please try typing your message instead.`;
        }
        
        setErrorMessage(errorMsg);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
      isInitializedRef.current = true;
      
      console.log('✓ Speech recognition initialized successfully');
      return true;
      
    } catch (err: any) {
      console.error('❌ Failed to initialize speech recognition:', err);
      setErrorMessage('Failed to initialize speech recognition. Please use the text input below.');
      isInitializedRef.current = true; // Mark as attempted
      return false;
    }
  };
  
  // Initialize on mount
  useEffect(() => {
    initializeSpeechRecognition();
    
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
    console.log('Start recording button clicked');
    
    // Check if we need to initialize
    if (!isInitializedRef.current) {
      console.log('Initializing speech recognition...');
      const initialized = await initializeSpeechRecognition();
      if (!initialized) {
        console.log('Failed to initialize speech recognition');
        return;
      }
    }
    
    // Check if recognition is available
    if (!recognitionRef.current) {
      console.log('No recognition instance available');
      setErrorMessage('Speech recognition is not available. Please use the text input below.');
      return;
    }
    
    // Check permissions
    if (hasPermission === false) {
      console.log('Requesting microphone permission...');
      const hasAccess = await requestMicrophoneAccess();
      if (!hasAccess) {
        return;
      }
    }
    
    // Prevent multiple starts
    if (isRecording) {
      console.log('Already recording, ignoring start request');
      return;
    }
    
    try {
      console.log('Starting speech recognition...');
      setTranscript('');
      setErrorMessage(null);
      recognitionRef.current.start();
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (err: any) {
      console.error('❌ Failed to start recording:', err);
      
      if (err.message && err.message.includes('already started')) {
        console.log('Recognition already running');
        setIsRecording(true);
      } else {
        setErrorMessage('Failed to start recording. Please try the text input below.');
      }
    }
  };
  
  const stopRecording = () => {
    console.log('Stop recording button clicked');
    
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        console.log('✓ Speech recognition stopped');
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
      console.log('Processing transcription:', text);
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
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          )}
          
          {isSupported === false && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or use the text input below.
              </p>
            </div>
          )}
          
          {hasPermission === false && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Microphone access is required for voice recording.
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
          
          {isSupported !== false && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voice Recording</span>
                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={isProcessing || hasPermission === false || isSupported === false}
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
          )}
          
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
