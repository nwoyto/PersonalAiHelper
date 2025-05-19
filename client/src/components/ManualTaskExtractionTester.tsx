import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Save, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Task {
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
  extractedTasks: Task[];
  timestamp: string;
}

export default function ManualTaskExtractionTester() {
  const [inputText, setInputText] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<{ text: string, tasks: Task[] } | null>(null);
  
  // Process the text for task extraction
  const handleProcessText = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text first');
      return;
    }
    
    setIsProcessing(true);
    setCurrentResult(null);
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCurrentResult({ 
        text: inputText,
        tasks: data.tasks || []
      });
    } catch (error) {
      console.error('Failed to process text:', error);
      alert(`Error processing text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save the test result
  const handleSaveResult = () => {
    if (!currentResult) {
      alert('No processed text to save');
      return;
    }
    
    const newResult: TestResult = {
      id: Date.now(),
      transcription: currentResult.text,
      extractedTasks: currentResult.tasks,
      timestamp: new Date().toISOString()
    };
    
    setTestResults(prev => [...prev, newResult]);
    setInputText('');
    setCurrentResult(null);
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
          <CardTitle className="text-white text-xl">Manual Task Extraction Testing</CardTitle>
          <CardDescription className="text-gray-400">
            Test how well the AI extracts tasks from your text input
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inputText" className="text-white">Enter text to analyze</Label>
            <Textarea 
              id="inputText" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type phrases like 'I need to finish the quarterly report by next Friday' or 'Remember to call John about the project tomorrow'"
              className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={handleProcessText}
              className="bg-purple-700 hover:bg-purple-600"
              disabled={isProcessing || !inputText.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Extract Tasks
                </>
              )}
            </Button>
            
            {currentResult && currentResult.tasks.length > 0 && (
              <Button
                onClick={handleSaveResult}
                className="bg-green-700 hover:bg-green-600"
              >
                <Save className="h-4 w-4 mr-2" />
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
            <p className="text-white text-lg">Analyzing text and extracting tasks...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        </Card>
      )}
      
      {currentResult && currentResult.tasks.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl">Extracted Tasks</CardTitle>
            <CardDescription className="text-gray-400">
              {currentResult.tasks.length} task(s) extracted from your text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentResult.tasks.map((task, index) => (
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
      
      {currentResult && currentResult.tasks.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 mb-6 p-6">
          <div className="text-center">
            <p className="text-white text-lg">No tasks were extracted from your text.</p>
            <p className="text-gray-400 mt-2">
              Try typing phrases that clearly indicate tasks with details like deadlines, priorities, or categories.
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
                      <Label className="text-gray-400 text-sm">Text Input:</Label>
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