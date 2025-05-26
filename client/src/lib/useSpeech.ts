import { useState, useCallback, useEffect, useRef } from 'react';
import { processTranscription } from './openai';
import { useSettings } from '@/lib/useSettings';

// Add type declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechOptions {
  onTranscriptionComplete?: (result: { text: string, tasks: any[] }) => void;
  onListening?: () => void;
  onError?: (error: string) => void;
  onWakeWordDetected?: () => void;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { settings } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [isActiveListening, setIsActiveListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition with maximum compatibility
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') {
      setError('Speech recognition not available in this environment');
      return false;
    }

    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    try {
      // Create new recognition instance
      const recognitionInstance = new SpeechRecognition();

      // Configure with minimal settings to avoid compatibility issues
      recognitionInstance.continuous = false; // Single session
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 1;

      // Don't set language at all - let browser choose
      // This avoids the "language-not-supported" error entirely

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started successfully');
        setIsListening(true);
        setIsActiveListening(true);
        setError(null);
        if (options.onListening) {
          options.onListening();
        }
      };

      recognitionInstance.onresult = (event: any) => {
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
        setTranscription(fullTranscript);
        console.log('Speech recognized:', fullTranscript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        let errorMessage = '';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'language-not-supported':
            // This shouldn't happen since we're not setting a language
            errorMessage = 'Language not supported by your browser.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setError(errorMessage);
        setIsListening(false);
        setIsActiveListening(false);

        if (options.onError) {
          options.onError(errorMessage);
        }
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setIsActiveListening(false);
      };

      recognitionRef.current = recognitionInstance;
      setRecognition(recognitionInstance);
      return true;

    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setError('Failed to initialize speech recognition. Please refresh and try again.');
      return false;
    }
  }, [options]);

  // Initialize on mount
  useEffect(() => {
    initializeRecognition();
  }, [initializeRecognition]);

  // Start listening function
  const startListening = useCallback(async () => {
    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access in your browser.');
      return;
    }

    // Initialize recognition if it doesn't exist
    if (!recognitionRef.current) {
      const initialized = initializeRecognition();
      if (!initialized) return;
    }

    // Prevent multiple starts
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }

    try {
      setTranscription('');
      setError(null);
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('Failed to start recognition:', err);

      if (err.message && err.message.includes('already started')) {
        // Recognition is already running
        setIsListening(true);
        setIsActiveListening(true);
      } else {
        setError('Failed to start voice recognition. Please try again.');
      }
    }
  }, [isListening, initializeRecognition]);

  // Stop listening and process
  const stopListening = useCallback(async () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }

      if (transcription.trim()) {
        try {
          const result = await processTranscription(transcription);
          if (options.onTranscriptionComplete) {
            options.onTranscriptionComplete(result);
          }
          return result;
        } catch (err) {
          const errorMsg = (err as Error).message;
          setError(errorMsg);
          if (options.onError) {
            options.onError(errorMsg);
          }
        }
      }
    }

    return { text: transcription, tasks: [] };
  }, [transcription, isListening, options]);

  // Cancel listening
  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error('Error aborting recognition:', err);
      }
    }
    setTranscription('');
    setIsListening(false);
    setIsActiveListening(false);
    setError(null);
  }, []);

  // Reset state
  const resetRecognitionState = useCallback(() => {
    setIsListening(false);
    setIsActiveListening(false);
    setTranscription('');
    setError(null);
  }, []);

  return {
    isListening,
    isBackgroundListening: false, // Simplified - no background listening for now
    transcription,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetRecognitionState,
    toggleAlwaysListening: () => {}, // Placeholder
  };
}