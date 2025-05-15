import { useState, useCallback, useEffect } from 'react';
import { processTranscription } from './openai';

interface UseSpeechOptions {
  onTranscriptionComplete?: (result: { text: string, tasks: any[] }) => void;
  onListening?: () => void;
  onError?: (error: string) => void;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Set up speech recognition
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
      setError(null);
      if (options.onListening) {
        options.onListening();
      }
    };
    
    recognitionInstance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      setTranscription(transcript);
    };
    
    recognitionInstance.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Ignore "no speech" errors
        return;
      }
      
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      
      if (options.onError) {
        options.onError(event.error);
      }
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
    };
    
    setRecognition(recognitionInstance);
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [options]);

  // Start listening
  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        // If already started, ignore
        if ((err as Error).message !== 'Failed to execute \'start\' on \'SpeechRecognition\': recognition has already started.') {
          setError((err as Error).message);
          if (options.onError) {
            options.onError((err as Error).message);
          }
        }
      }
    }
  }, [recognition, options]);

  // Stop listening and process transcription
  const stopListening = useCallback(async () => {
    if (recognition) {
      recognition.stop();
      
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
      recognition.abort();
      setTranscription('');
    }
  }, [recognition]);

  return {
    isListening,
    transcription,
    error,
    startListening,
    stopListening,
    cancelListening,
  };
}
