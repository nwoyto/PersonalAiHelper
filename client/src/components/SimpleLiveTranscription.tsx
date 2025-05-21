import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Save, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types';

export default function SimpleLiveTranscription() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedTranscripts, setSavedTranscripts] = useState<Array<{id: number, text: string, timestamp: string, tasks: Task[]}>>([]);
  
  // Simulated recording function - in a real app this would use the Web Speech API
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Ready to analyze your text",
      });
    } else {
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Since speech recognition requires microphone permissions, please type your text below instead.",
      });
    }
  };
  
  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Empty transcription",
        description: "Please enter some text first",
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
        description: `Found ${data.tasks?.length || 0} tasks in your text`,
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
            Type or paste your text below for analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-md p-4 min-h-[150px] text-white"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or paste your text here..."
          />
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={toggleRecording}
              className={isRecording ? "bg-red-700 hover:bg-red-600" : "bg-purple-700 hover:bg-purple-600"}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Simulate Recording
                </>
              )}
            </Button>
            
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
              disabled={!transcript.trim()}
            >
              Clear
            </Button>
            
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
              {extractedTasks.length} task(s) extracted from your text
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
                      <h4 className="text-gray-400 text-sm">Text:</h4>
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