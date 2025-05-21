import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Save, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types';

export default function LiveTranscription() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedTranscripts, setSavedTranscripts] = useState<Array<{id: number, text: string, timestamp: string, tasks: Task[]}>>([]); 
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Try using Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone access to use this feature.');
          setIsRecording(false);
        }
      };

      recognitionRef.current.onend = () => {
        // Only restart if still recording (user didn't press stop)
        if (isRecording && recognitionRef.current) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        
        if (isRecording) {
          recognitionRef.current.stop();
        }
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (error) setError(null);
    
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setTranscript('');
      setExtractedTasks([]);
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please refresh the page and try again.');
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Transcription complete",
      });
      
      // Auto-process if we have transcript
      if (transcript.trim()) {
        processTranscript();
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Empty transcription",
        description: "Please record some speech first",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcript }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setExtractedTasks(data.tasks || []);
      
      toast({
        title: "Analysis complete",
        description: `Found ${data.tasks?.length || 0} tasks in your transcription`,
      });
    } catch (error) {
      console.error('Failed to process transcript:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveTranscription = () => {
    const newSavedItem = {
      id: Date.now(),
      text: transcript,
      timestamp: new Date().toISOString(),
      tasks: extractedTasks
    };
    
    setSavedTranscripts(prev => [newSavedItem, ...prev]);
    
    toast({
      title: "Transcription saved",
      description: "Your transcription and tasks have been saved",
    });
  };

  const clearTranscript = () => {
    setTranscript('');
    setExtractedTasks([]);
  };

  // Get category badge color
  const getCategoryColor = (category: string | undefined) => {
    if (!category) return 'bg-gray-700 hover:bg-gray-600';
    
    switch (category) {
      case 'work': return 'bg-blue-700 hover:bg-blue-600';
      case 'personal': return 'bg-green-700 hover:bg-green-600';
      case 'urgent': return 'bg-red-700 hover:bg-red-600';
      default: return 'bg-gray-700 hover:bg-gray-600';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return 'bg-gray-700 hover:bg-gray-600';
    
    switch (priority) {
      case 'high': return 'bg-red-700 hover:bg-red-600';
      case 'medium': return 'bg-yellow-700 hover:bg-yellow-600';
      case 'low': return 'bg-green-700 hover:bg-green-600';
      default: return 'bg-gray-700 hover:bg-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {error && (
        <Alert className="mb-6 bg-red-900/30 border-red-800 text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-xl">Live Transcription</CardTitle>
          <CardDescription className="text-gray-400">
            Speak clearly into your microphone and your speech will be converted to text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-md p-4 min-h-[150px] relative">
            {transcript ? (
              <p className="text-white whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-gray-500 italic">
                {isRecording ? "Listening... speak now" : "Press the Record button to start"}
              </p>
            )}
            
            {isRecording && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={toggleRecording}
              className={isRecording ? "bg-red-700 hover:bg-red-600" : "bg-purple-700 hover:bg-purple-600"}
              disabled={!!error}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
            
            {!isRecording && transcript && (
              <>
                <Button
                  onClick={processTranscript}
                  className="bg-blue-700 hover:bg-blue-600"
                  disabled={isProcessing || !transcript.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Analyze Text
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={clearTranscript}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Clear
                </Button>
              </>
            )}
            
            {extractedTasks.length > 0 && (
              <Button
                onClick={saveTranscription}
                className="bg-green-700 hover:bg-green-600"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <Card className="bg-gray-900 border-gray-800 mb-6 p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-4" />
            <p className="text-white text-lg">Analyzing text and extracting tasks...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        </Card>
      )}
      
      {extractedTasks.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl">Extracted Tasks</CardTitle>
            <CardDescription className="text-gray-400">
              {extractedTasks.length} task(s) extracted from your speech
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {extractedTasks.map((task, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{task.title}</CardTitle>
                      <div className="flex space-x-2">
                        {task.category && (
                          <Badge className={getCategoryColor(task.category)}>
                            {task.category}
                          </Badge>
                        )}
                        {task.priority && (
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    {task.description && (
                      <p className="text-gray-300 mb-3">{task.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {task.dueDate && (
                        <div>
                          <span className="text-gray-400">Due: </span>
                          <span className="text-white">{task.dueDate}</span>
                        </div>
                      )}
                      
                      {task.estimatedMinutes && (
                        <div>
                          <span className="text-gray-400">Time: </span>
                          <span className="text-white">{task.estimatedMinutes} min</span>
                        </div>
                      )}
                      
                      {task.location && (
                        <div>
                          <span className="text-gray-400">Location: </span>
                          <span className="text-white">{task.location}</span>
                        </div>
                      )}
                      
                      {task.recurring && (
                        <div>
                          <span className="text-gray-400">Recurring: </span>
                          <span className="text-white">{task.recurringPattern || 'Yes'}</span>
                        </div>
                      )}
                      
                      {task.people && task.people.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-400">People: </span>
                          <span className="text-white">{task.people.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {savedTranscripts.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Saved Transcriptions</CardTitle>
            <CardDescription className="text-gray-400">
              Your recent transcriptions and extracted tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedTranscripts.map((item) => (
                <Card key={item.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-white text-md">
                        Transcription {new Date(item.timestamp).toLocaleTimeString()}
                      </CardTitle>
                      <span className="text-gray-400 text-sm">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="mb-3">
                      <h4 className="text-gray-400 text-sm">Speech:</h4>
                      <p className="text-white mt-1">{item.text}</p>
                    </div>
                    
                    {item.tasks.length > 0 && (
                      <div>
                        <h4 className="text-gray-400 text-sm mb-2">
                          Tasks ({item.tasks.length}):
                        </h4>
                        <div className="space-y-2">
                          {item.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="bg-gray-900 p-2 rounded">
                              <div className="flex justify-between">
                                <span className="text-white font-medium">{task.title}</span>
                                <div className="flex space-x-1">
                                  {task.category && (
                                    <Badge className={getCategoryColor(task.category)} variant="outline">
                                      {task.category}
                                    </Badge>
                                  )}
                                  {task.priority && (
                                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                                      {task.priority}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {task.dueDate && (
                                <div className="text-sm text-gray-400 mt-1">
                                  Due: <span className="text-gray-300">{task.dueDate}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}