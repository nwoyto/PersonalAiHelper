import { useState, useCallback, useEffect, useRef } from 'react';
import { processTranscription } from './openai';
import { useSettings } from '@/lib/useSettings';

// Add type declarations for the Web Speech API since TypeScript doesn't include them by default
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (event: any) => void;
  onresult: (event: {
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
      };
    };
  }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
};

interface UseSpeechOptions {
  onTranscriptionComplete?: (result: { text: string, tasks: any[] }) => void;
  onListening?: () => void;
  onError?: (error: string) => void;
  onWakeWordDetected?: () => void;
}

// Wake word detector that listens for specific phrases
class WakeWordDetector {
  private wakeWord: string;
  private onDetected: () => void;
  private lastResult = '';
  private sensitivityThreshold = 0.7; // Higher means more exact match required

  constructor(wakeWord: string, onDetected: () => void) {
    this.wakeWord = wakeWord.toLowerCase();
    this.onDetected = onDetected;
  }

  processTranscript(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase();
    
    // Skip if we've already processed this text (to avoid multiple triggers)
    if (lowerTranscript === this.lastResult) {
      return false;
    }
    
    this.lastResult = lowerTranscript;
    
    // Calculate how close the transcript is to containing our wake word
    // Simple implementation: just check if the wake word is contained
    // A more sophisticated implementation would use fuzzy matching
    if (lowerTranscript.includes(this.wakeWord)) {
      console.log('Wake word detected:', this.wakeWord);
      this.onDetected();
      return true;
    }
    
    return false;
  }

  setWakeWord(wakeWord: string) {
    this.wakeWord = wakeWord.toLowerCase();
  }
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { settings } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [isActiveListening, setIsActiveListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [backgroundTranscription, setBackgroundTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [backgroundRecognition, setBackgroundRecognition] = useState<SpeechRecognition | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  
  // Initialize wake word detector
  useEffect(() => {
    if (!wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current = new WakeWordDetector(
        settings?.wakeWord || 'Hey Assistant',
        () => {
          // Stop background listening and start active listening
          if (options.onWakeWordDetected) {
            options.onWakeWordDetected();
          }
          startActiveListening();
        }
      );
    } else if (settings?.wakeWord) {
      wakeWordDetectorRef.current.setWakeWord(settings.wakeWord);
    }
  }, [settings?.wakeWord]);

  // Set up background speech recognition (for wake word detection)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!settings?.alwaysListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    const backgroundRecognitionInstance = new SpeechRecognition();
    backgroundRecognitionInstance.continuous = true;
    backgroundRecognitionInstance.interimResults = true;
    backgroundRecognitionInstance.lang = 'en-US';
    
    backgroundRecognitionInstance.onstart = () => {
      console.log('Background listening started');
    };
    
    backgroundRecognitionInstance.onresult = (event: any) => {
      const results = event.results as SpeechRecognitionResultList;
      const transcript = Array.from(results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      setBackgroundTranscription(transcript);
      
      // Check for wake word
      if (wakeWordDetectorRef.current?.processTranscript(transcript)) {
        // Wake word detected, handled by the detector
        backgroundRecognitionInstance.stop();
      }
    };
    
    backgroundRecognitionInstance.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Ignore "no speech" errors
        return;
      }
      
      console.error(`Background speech recognition error: ${event.error}`);
      
      // Try to restart background recognition after a short delay
      setTimeout(() => {
        try {
          backgroundRecognitionInstance.start();
        } catch (err) {
          console.error('Failed to restart background recognition:', err);
        }
      }, 1000);
    };
    
    backgroundRecognitionInstance.onend = () => {
      // Restart background recognition if it's not because we're actively listening
      if (!isActiveListening && settings?.alwaysListening) {
        // Add a slightly longer delay to make sure the system is ready
        setTimeout(() => {
          try {
            if (!isActiveListening) {
              backgroundRecognitionInstance.start();
            }
          } catch (err) {
            console.error('Failed to restart background recognition:', err);
          }
        }, 1000);
      }
    };
    
    setBackgroundRecognition(backgroundRecognitionInstance);
    
    // Start background listening immediately if always-listening is enabled
    if (settings?.alwaysListening) {
      try {
        backgroundRecognitionInstance.start();
      } catch (err) {
        console.error('Failed to start background recognition:', err);
      }
    }
    
    return () => {
      if (backgroundRecognitionInstance) {
        backgroundRecognitionInstance.abort();
      }
    };
  }, [settings?.alwaysListening]);

  // Set up active speech recognition (for transcription)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    recognitionInstance.onstart = () => {
      setIsListening(true);
      setIsActiveListening(true);
      setError(null);
      if (options.onListening) {
        options.onListening();
      }
    };
    
    recognitionInstance.onresult = (event: any) => {
      const results = event.results as SpeechRecognitionResultList;
      const transcript = Array.from(results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      setTranscription(transcript);
    };
    
    recognitionInstance.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Ignore "no speech" errors
        return;
      }
      
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setIsActiveListening(false);
      
      if (options.onError) {
        options.onError(event.error);
      }
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
      setIsActiveListening(false);
      
      // Restart background listening if always-listening is enabled
      if (settings?.alwaysListening && backgroundRecognition) {
        // Add a longer delay to ensure recognition has fully ended
        setTimeout(() => {
          try {
            if (!isListening) {
              backgroundRecognition.start();
            }
          } catch (err) {
            console.error('Failed to restart background recognition after active listening:', err);
          }
        }, 1500);
      }
    };
    
    setRecognition(recognitionInstance);
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [options, backgroundRecognition, settings?.alwaysListening]);

  // Start active listening (for conversation transcription)
  const startActiveListening = useCallback(() => {
    // First check if recognition is already running
    if (isListening) {
      console.log('Recognition already active, no need to start again');
      return;
    }
    
    // Stop background recognition first
    if (backgroundRecognition) {
      try {
        backgroundRecognition.stop();
      } catch (err) {
        console.error('Error stopping background recognition:', err);
      }
    }
    
    // Start active recognition
    if (recognition) {
      // Add a slight delay to ensure the previous recognition has fully stopped
      setTimeout(() => {
        try {
          setTranscription(''); // Clear previous transcription
          recognition.start();
        } catch (err) {
          console.error('Failed to start recognition:', err);
          // If already started, ignore
          if ((err as Error).message !== 'Failed to execute \'start\' on \'SpeechRecognition\': recognition has already started.') {
            setError((err as Error).message);
            if (options.onError) {
              options.onError((err as Error).message);
            }
          }
        }
      }, 300);
    }
  }, [recognition, backgroundRecognition, options, isListening]);

  // Start manually triggered listening
  const startListening = useCallback(() => {
    startActiveListening();
  }, [startActiveListening]);

  // Stop listening and process transcription
  const stopListening = useCallback(async () => {
    if (recognition) {
      recognition.stop();
      setIsActiveListening(false);
      
      if (transcription.trim()) {
        try {
          const result = await processTranscription(transcription);
          
          if (options.onTranscriptionComplete) {
            options.onTranscriptionComplete(result);
          }
          
          return result;
        } catch (err) {
          setError((err as Error).message);
          if (options.onError) {
            options.onError((err as Error).message);
          }
        }
      }
    }
    
    return { text: transcription, tasks: [] };
  }, [recognition, transcription, options]);

  // Cancel listening without processing
  const cancelListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.abort();
      } catch (err) {
        console.error('Error aborting recognition:', err);
      } finally {
        setTranscription('');
        setIsActiveListening(false);
        setIsListening(false);
      }
    }
  }, [recognition]);

  // Reset recognition state if needed (can be called manually if issues occur)
  const resetRecognitionState = useCallback(() => {
    setIsListening(false);
    setIsActiveListening(false);
    setTranscription('');
    setError(null);
  }, []);

  // Toggle always-listening mode
  const toggleAlwaysListening = useCallback(() => {
    if (settings?.alwaysListening) {
      // Currently enabled, so disable
      if (backgroundRecognition) {
        backgroundRecognition.abort();
      }
    } else {
      // Currently disabled, so enable
      if (backgroundRecognition) {
        try {
          backgroundRecognition.start();
        } catch (err) {
          console.error('Failed to start background recognition:', err);
        }
      }
    }
  }, [backgroundRecognition, settings?.alwaysListening]);

  return {
    isListening,                // Currently in active listening mode
    isBackgroundListening: settings?.alwaysListening && !isActiveListening, // Listening for wake word
    transcription,              // Current transcription text
    error,                      // Any error message
    startListening,             // Manually start active listening
    stopListening,              // Stop and process transcription
    cancelListening,            // Cancel without processing
    resetRecognitionState,      // Reset the recognition state if issues occur
    toggleAlwaysListening,      // Toggle always-listening mode
  };
}
