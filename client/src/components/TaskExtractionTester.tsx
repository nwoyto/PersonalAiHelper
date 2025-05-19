import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSpeech } from '@/lib/useSpeech';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Mic, MicOff, Save, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TranscriptionResult } from '@/types';

// Modified to make some fields optional for compatibility with API
interface TaskType {
  title: string;
  description?: string;
  dueDate?: string;
  category?: "work" | "personal" | "urgent";
  priority?: "high" | "medium" | "low";
  estimatedMinutes?: number;
  location?: string;
  people?: string[];
  recurring?: boolean;
  recurringPattern?: string;
}

interface TestResult {
  id: number;
  transcription: string;
  extractedTasks: TaskType[];
  timestamp: string;
}

export default function TaskExtractionTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingResult, setProcessingResult] = useState<TranscriptionResult | null>(null);
  
  const { 
    isListening, 
    transcription, 
    startListening, 
    stopListening, 
    cancelListening 
  } = useSpeech({
    onTranscriptionComplete: (result) => {
      setProcessingResult(result);
      setIsProcessing(false);
    }
  });

  // Update current transcription when transcription changes
  useEffect(() => {
    if (isListening) {
      setCurrentTranscription(transcription);
    }
  }, [transcription, isListening]);

  // Start recording
  const handleStartRecording = () => {
    setCurrentTranscription('');
    setProcessingResult(null);
    startListening();
  };

  // Stop recording and process
  const handleStopRecording = async () => {
    if (!currentTranscription) {
      alert('No speech detected. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    const result = await stopListening();
    
    // onTranscriptionComplete will set the processingResult
  };

  // Save the test result
  const handleSaveResult = () => {
    if (!processingResult) {
      alert('No processed transcription to save');
      return;
    }
    
    const newResult: TestResult = {
      id: Date.now(),
      transcription: processingResult.text,
      extractedTasks: processingResult.tasks,
      timestamp: new Date().toISOString()
    };
    
    setTestResults(prev => [...prev, newResult]);
    
    // Clear for next test
    setCurrentTranscription('');
    setProcessingResult(null);
  };

  // Export test results as JSON
  const handleExportResults = () => {
    if (testResults.length === 0) {
      alert('No test results to export');
      return;
    }
    
    const dataStr = JSON.stringify(testResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `task-extraction-tests-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all test results
  const handleResetTests = () => {
    if (testResults.length > 0 && window.confirm('Are you sure you want to reset all test results?')) {
      setTestResults([]);
    }
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
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-xl">Task Extraction Testing Tool</CardTitle>
          <CardDescription className="text-gray-400">
            Test how well the AI extracts tasks from your spoken input
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transcription" className="text-white">Transcription</Label>
            <div className="relative">
              <Textarea 
                id="transcription" 
                value={currentTranscription || transcription} 
                readOnly 
                placeholder={isListening ? "Listening to your speech..." : "Speak about things you need to do. Include deadlines, priorities, categories, etc."}
                className={`bg-gray-800 border-gray-700 text-white min-h-[120px] ${isListening ? 'border-purple-500' : ''}`}
              />
              {isListening && (
                <div className="absolute right-3 top-3 animate-pulse">
                  <Mic className="h-5 w-5 text-purple-500" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            {!isListening ? (
              <Button
                onClick={handleStartRecording}
                className="bg-purple-700 hover:bg-purple-600"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                variant="destructive"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Stop & Extract Tasks
              </Button>
            )}
            
            {processingResult && (
              <Button
                onClick={handleSaveResult}
                className="bg-green-700 hover:bg-green-600"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Results
              </Button>
            )}
            
            {testResults.length > 0 && (
              <>
                <Button
                  onClick={handleExportResults}
                  variant="outline"
                  className="border-blue-700 text-blue-400 hover:bg-blue-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                
                <Button
                  onClick={handleResetTests}
                  variant="outline"
                  className="border-orange-700 text-orange-400 hover:bg-orange-900"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Tests
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <Card className="bg-gray-900 border-gray-800 mb-6 p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-4" />
            <p className="text-white text-lg">Extracting tasks from your speech...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        </Card>
      )}
      
      {processingResult && processingResult.tasks.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl">Extracted Tasks</CardTitle>
            <CardDescription className="text-gray-400">
              {processingResult.tasks.length} task(s) extracted from your speech
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingResult.tasks.map((task, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{task.title}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className={getCategoryColor(task.category)}>
                          {task.category}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
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
      
      {processingResult && processingResult.tasks.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 mb-6 p-6">
          <div className="text-center">
            <p className="text-white text-lg">No tasks were extracted from your speech.</p>
            <p className="text-gray-400 mt-2">
              Try speaking about specific tasks with deadlines, priorities, or other details.
            </p>
          </div>
        </Card>
      )}
      
      {testResults.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Test History</CardTitle>
            <CardDescription className="text-gray-400">
              Your saved test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={result.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-white text-md">Test #{index + 1}</CardTitle>
                      <span className="text-gray-400 text-sm">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="mb-3">
                      <Label className="text-gray-400 text-sm">Transcription:</Label>
                      <p className="text-white mt-1">{result.transcription}</p>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400 text-sm">
                        Extracted {result.extractedTasks.length} task(s):
                      </Label>
                      <div className="mt-2 space-y-2">
                        {result.extractedTasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="bg-gray-900 p-2 rounded">
                            <div className="flex justify-between">
                              <span className="text-white font-medium">{task.title}</span>
                              <div className="flex space-x-1">
                                <Badge className={getCategoryColor(task.category)} variant="outline">
                                  {task.category}
                                </Badge>
                                <Badge className={getPriorityColor(task.priority)} variant="outline">
                                  {task.priority}
                                </Badge>
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