import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Mic, MicOff, Save, RotateCcw, CheckCircle2 } from 'lucide-react';

interface TestCase {
  id: number;
  expected: string;
  actual: string;
  accuracy: number;
  timestamp: string;
}

export default function VoiceTestingTool() {
  const [expected, setExpected] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);
  const [averageAccuracy, setAverageAccuracy] = useState<number>(0);
  
  const { 
    isListening, 
    transcription, 
    startListening, 
    stopListening, 
    cancelListening 
  } = useSpeech({
    onTranscriptionComplete: (result) => {
      // When transcription is complete
      console.log('Transcription complete:', result);
    }
  });

  // Update current test when transcription changes
  useEffect(() => {
    if (isListening) {
      setCurrentTest(transcription);
    }
  }, [transcription, isListening]);

  // Calculate similarity between two strings (0-100%)
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Simple implementation: character-based Levenshtein distance
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 100; // Both strings are empty
    }
    
    // Calculate edit distance
    const costs: number[] = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
            newValue = Math.min(
              newValue,
              lastValue,
              costs[j]
            ) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[shorter.length] = lastValue;
      }
    }
    
    // Convert edit distance to percentage
    const similarity = (1 - costs[shorter.length] / longer.length) * 100;
    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  };

  // Start a test
  const handleStartTest = () => {
    if (!expected) {
      alert('Please enter an expected phrase first');
      return;
    }
    
    setCurrentTest('');
    startListening();
  };

  // Save the test results
  const handleSaveTest = async () => {
    if (!currentTest) {
      alert('No transcription to save');
      return;
    }
    
    const accuracy = calculateSimilarity(
      expected.toLowerCase().trim(), 
      currentTest.toLowerCase().trim()
    );
    
    const newTestCase: TestCase = {
      id: Date.now(),
      expected: expected,
      actual: currentTest,
      accuracy,
      timestamp: new Date().toISOString()
    };
    
    setTestCases(prev => [...prev, newTestCase]);
    
    // Calculate average accuracy
    const newAverage = [...testCases, newTestCase].reduce(
      (sum, test) => sum + test.accuracy, 0
    ) / ([...testCases, newTestCase].length);
    
    setAverageAccuracy(Math.round(newAverage * 100) / 100);
    
    // Clear for next test
    setExpected('');
    setCurrentTest('');
    setShowResults(true);
  };

  // Export test results as CSV
  const handleExportResults = () => {
    if (testCases.length === 0) {
      alert('No test cases to export');
      return;
    }
    
    const headers = ['ID', 'Expected', 'Actual', 'Accuracy (%)', 'Timestamp'];
    const csvRows = [
      headers.join(','),
      ...testCases.map(test => [
        test.id,
        `"${test.expected.replace(/"/g, '""')}"`, // Escape quotes
        `"${test.actual.replace(/"/g, '""')}"`,
        test.accuracy,
        test.timestamp
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `voice-test-results-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all test cases
  const handleResetTests = () => {
    if (testCases.length > 0 && window.confirm('Are you sure you want to reset all test cases?')) {
      setTestCases([]);
      setAverageAccuracy(0);
      setShowResults(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-xl">Voice-to-Text Testing Tool</CardTitle>
          <CardDescription className="text-gray-400">
            Test the accuracy of voice recognition by comparing expected phrases with actual transcriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expected" className="text-white">Expected Phrase</Label>
            <Textarea 
              id="expected" 
              value={expected} 
              onChange={(e) => setExpected(e.target.value)}
              placeholder="Enter the phrase you're going to say..."
              className="bg-gray-800 border-gray-700 text-white" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="actual" className="text-white">Transcription Result</Label>
            <div className="relative">
              <Textarea 
                id="actual" 
                value={currentTest || transcription} 
                readOnly 
                placeholder={isListening ? "Listening..." : "Your speech will appear here..."}
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
                onClick={handleStartTest}
                className="bg-purple-700 hover:bg-purple-600"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={() => stopListening()}
                variant="destructive"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
            
            <Button
              onClick={handleSaveTest}
              className="bg-green-700 hover:bg-green-600"
              disabled={isListening || !currentTest}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Results
            </Button>
            
            {testCases.length > 0 && (
              <>
                <Button
                  onClick={handleExportResults}
                  variant="outline"
                  className="border-blue-700 text-blue-400 hover:bg-blue-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Export CSV
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
      
      {showResults && testCases.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Test Results</CardTitle>
            <CardDescription className="text-gray-400">
              Average Accuracy: <span className="text-white font-bold">{averageAccuracy}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Voice-to-text test results</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Expected</TableHead>
                  <TableHead className="text-gray-400">Actual</TableHead>
                  <TableHead className="text-gray-400 text-right">Accuracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="text-white">{test.expected}</TableCell>
                    <TableCell className="text-white">{test.actual}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      test.accuracy >= 90 ? 'text-green-400' :
                      test.accuracy >= 70 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {test.accuracy}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}