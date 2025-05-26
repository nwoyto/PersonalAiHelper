import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your browser permissions.');
      toast({
        title: "Recording failed",
        description: "Please allow microphone access and try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({
        title: "Recording stopped",
        description: "Processing your audio...",
      });
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.text) {
        onTranscriptionComplete(data.text);
        toast({
          title: "Transcription complete",
          description: "Your audio has been converted to text successfully!",
        });
        
        // Reset state
        setAudioBlob(null);
        setRecordingTime(0);
      } else {
        throw new Error('No transcription text returned');
      }

    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Transcription failed');
      toast({
        title: "Transcription failed",
        description: "Please try recording again.",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-br from-navy-950 to-navy-900 border border-navy-800 shadow-xl">
      <CardHeader>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white text-xl">Audio Voice Assistant</CardTitle>
            <CardDescription className="text-gray-300">
              Record your voice and get intelligent task extraction
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-900/20 border-red-800/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Recording status */}
        <div className="bg-navy-800/50 border border-navy-700/50 rounded-lg p-4 min-h-[100px] relative">
          {isRecording ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mb-2"></div>
              <p className="text-white font-medium">Recording...</p>
              <p className="text-gray-300 text-sm">{formatTime(recordingTime)}</p>
            </div>
          ) : audioBlob ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-white font-medium">Audio recorded ({formatTime(recordingTime)})</p>
              <p className="text-gray-300 text-sm">Ready to transcribe</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Mic className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-400">Click "Start Recording" to begin</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 flex-1"
              disabled={isTranscribing}
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-500 flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button
                onClick={transcribeAudio}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 flex-1"
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Transcribe Audio
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setAudioBlob(null);
                  setRecordingTime(0);
                  setError(null);
                }}
                variant="outline"
                className="border-navy-700 text-gray-300 hover:bg-navy-800"
                disabled={isTranscribing}
              >
                Record Again
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}