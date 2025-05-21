import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Save, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types';

export default function RealVoiceTranscription() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedTranscripts, setSavedTranscripts] = useState<Array<{id: number, text: string, timestamp: string, tasks: Task[]}>>([]);
  
  // Reference to the Speech Recognition object
  const recognitionRef = useRef<any>(null);
  
  // Set up speech recognition when component mounts
  useEffect(() => {
    // Reset error state when component mounts
    setError(null);
    
    // Setup event listener for the global voice activation
    const handleStartRecording = () => {
      if (!isRecording) {
        console.log("Received start recording event");
        setIsRecording(true);
      }
    };
    
    // Add event listener
    document.addEventListener('startVoiceRecording', handleStartRecording);
    
    // Speech Recognition setup
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // Create a new instance
        recognitionRef.current = new SpeechRecognition();
        
        // Configure it
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          
          // Try different language codes to avoid language-not-supported error
          try {
            // Try to detect available languages
            const languages = ['en-US', 'en-GB', 'en', 'en-AU'];
            let languageSet = false;
            
            for (const lang of languages) {
              try {
                recognitionRef.current.lang = lang;
                languageSet = true;
                console.log(`Successfully set speech recognition language to: ${lang}`);
                break;
              } catch (langErr) {
                console.warn(`Failed to set language to ${lang}`, langErr);
              }
            }
            
            if (!languageSet) {
              // If no specific language worked, try with empty string to use browser default
              recognitionRef.current.lang = '';
              console.log('Using browser default speech recognition language');
            }
          } catch (err) {
            console.error('Error setting speech recognition language:', err);
          }
          
          // Set up event handlers
          recognitionRef.current.onresult = (event: any) => {
            let currentTranscript = '';
            
            // Process results
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              const text = result[0].transcript;
              
              if (result.isFinal) {
                currentTranscript += text + ' ';
              }
            }
            
            if (currentTranscript) {
              setTranscript(prev => prev + currentTranscript);
            }
          };
          
          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(`Microphone error: ${event.error}. Please check your microphone permissions.`);
            
            // If not allowed, stop recording
            if (event.error === 'not-allowed') {
              setIsRecording(false);
              toast({
                title: "Microphone access denied",
                description: "Please enable microphone access in your browser settings.",
                variant: "destructive"
              });
            }
          };
          
          recognitionRef.current.onend = () => {
            // If we're still supposed to be recording but recognition stopped,
            // try to restart it (common with webkitSpeechRecognition)
            if (isRecording) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.error('Failed to restart recognition:', err);
              }
            }
          };
        }
      } else {
        setError('Speech recognition is not supported in your browser. Please try using Chrome or Edge.');
      }
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);
  
  // Handle recording state changes
  useEffect(() => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      try {
        recognitionRef.current.start();
        console.log('Started recording');
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start speech recognition. Try refreshing the page.');
        setIsRecording(false);
      }
    } else {
      try {
        recognitionRef.current.stop();
        console.log('Stopped recording');
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, [isRecording]);
  
  const toggleRecording = () => {
    if (error) setError(null);
    
    if (!isRecording) {
      // Starting a new recording - clear previous transcript
      setTranscript('');
      setExtractedTasks([]);
    } else {
      // Stopping recording - if we have a transcript, process it
      if (transcript.trim()) {
        processTranscript();
      }
    }
    
    setIsRecording(!isRecording);
  };
  
  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Empty transcription",
        description: "Please speak or type something first",
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

  // Color utility functions
  const getCategoryColor = (category: string | undefined) => {
    if (!category) return 'bg-gray-700 hover:bg-gray-600';
    
    switch (category) {
      case 'work': return 'bg-blue-700 hover:bg-blue-600';
      case 'personal': return 'bg-green-700 hover:bg-green-600';
      case 'urgent': return 'bg-red-700 hover:bg-red-600';
      default: return 'bg-gray-700 hover:bg-gray-600';
    }
  };

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
      
      <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 mb-6 shadow-xl">
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg p-1">
              <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                <Mic className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div>
              <CardTitle className="text-white text-xl">Voice Assistant</CardTitle>
              <CardDescription className="text-gray-300">
                Click the Record button and speak clearly to transcribe your voice
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
          
          <div className="bg-gray-900/50 border border-blue-800/50 rounded-lg p-4 min-h-[150px] relative shadow-inner">
            {transcript ? (
              <p className="text-white whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-gray-400 italic">
                {isRecording ? "Listening... speak now" : "Press the Record button to start speaking"}
              </p>
            )}
            
            {isRecording && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={toggleRecording}
              className={isRecording 
                ? "bg-red-600 hover:bg-red-500 shadow-md" 
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md"}
              disabled={!!error && !isRecording}
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
            
            {transcript && !isRecording && (
              <>
                <Button
                  onClick={processTranscript}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-md"
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
                  className="border-blue-700/40 text-blue-300 hover:bg-blue-900/20 hover:text-blue-200 shadow-sm"
                >
                  Clear
                </Button>
              </>
            )}
            
            {extractedTasks.length > 0 && (
              <Button
                onClick={saveTranscription}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
          
          {/* Manual input option */}
          <div className="mt-4 pt-4 border-t border-blue-800/30">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Or type/paste text manually:</h3>
            <textarea
              className="w-full bg-gray-900/70 border border-blue-800/30 rounded-lg p-4 min-h-[100px] text-white shadow-inner focus:border-purple-500/30 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type or paste text here..."
            />
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 mb-6 p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg p-1">
              <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              </div>
            </div>
            <p className="text-white text-lg font-semibold">Analyzing your speech...</p>
            <p className="text-blue-300 text-sm mt-2">Extracting tasks and important information</p>
          </div>
        </Card>
      )}
      
      {extractedTasks.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 mb-6 shadow-xl">
          <CardHeader>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg p-1">
                <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">Extracted Tasks</CardTitle>
                <CardDescription className="text-gray-300">
                  {extractedTasks.length} task{extractedTasks.length !== 1 && 's'} found in your speech
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
            
            <div className="space-y-4 relative z-10">
              {extractedTasks.map((task, index) => (
                <Card key={index} className="bg-gray-900/50 border border-blue-800/50 shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{task.title}</CardTitle>
                      <div className="flex space-x-2">
                        {task.category && (
                          <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400">
                            {task.category}
                          </Badge>
                        )}
                        {task.priority && (
                          <Badge className={
                            task.priority === "high" 
                              ? "bg-gradient-to-r from-red-600 to-red-500"
                              : task.priority === "medium"
                                ? "bg-gradient-to-r from-yellow-600 to-amber-500"
                                : "bg-gradient-to-r from-green-600 to-emerald-500"
                          }>
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
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 shadow-xl">
          <CardHeader>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg p-1">
                <div className="bg-gray-900 rounded-full w-full h-full flex items-center justify-center">
                  <Save className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">Saved Transcriptions</CardTitle>
                <CardDescription className="text-gray-300">
                  Your recent transcriptions and extracted tasks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
            
            <div className="space-y-4 relative z-10">
              {savedTranscripts.map((item) => (
                <Card key={item.id} className="bg-gray-900/50 border border-blue-800/50 shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-white text-md flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Transcription {new Date(item.timestamp).toLocaleTimeString()}
                      </CardTitle>
                      <span className="text-blue-300 text-sm bg-blue-900/30 py-1 px-2 rounded-full border border-blue-800/30">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="mb-3">
                      <h4 className="text-blue-300 text-sm font-medium">Transcription:</h4>
                      <p className="text-white mt-1 bg-gray-900/30 p-3 rounded-lg border border-blue-900/20">{item.text}</p>
                    </div>
                    
                    {item.tasks.length > 0 && (
                      <div>
                        <h4 className="text-blue-300 text-sm font-medium mb-2">
                          Tasks ({item.tasks.length}):
                        </h4>
                        <div className="space-y-2">
                          {item.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="bg-gray-900/30 p-3 rounded-lg border border-blue-900/20">
                              <div className="flex justify-between">
                                <span className="text-white font-medium">{task.title}</span>
                                <div className="flex space-x-1">
                                  {task.category && (
                                    <Badge className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-xs">
                                      {task.category}
                                    </Badge>
                                  )}
                                  {task.priority && (
                                    <Badge className={
                                      task.priority === "high" 
                                        ? "bg-gradient-to-r from-red-600/80 to-red-500/80"
                                        : task.priority === "medium"
                                          ? "bg-gradient-to-r from-yellow-600/80 to-amber-500/80"
                                          : "bg-gradient-to-r from-green-600/80 to-emerald-500/80"
                                    }>
                                      {task.priority}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {task.dueDate && (
                                <div className="text-sm text-blue-300 mt-1">
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