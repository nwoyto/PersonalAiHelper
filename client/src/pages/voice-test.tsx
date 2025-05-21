import RealVoiceTranscription from "@/components/RealVoiceTranscription";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Mic, BrainCircuit, PanelLeftClose } from "lucide-react";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header with animated gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-navy-950 to-navy-900 p-6 mb-8 shadow-lg border border-navy-800/50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-5 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-5 -ml-20 -mb-20"></div>
        </div>
        
        <div className="relative flex items-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mr-5 shadow-lg">
            <div className="w-12 h-12 bg-navy-950 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-white">Voice Assistant</h1>
            <p className="text-gray-300 mt-1">
              Your intelligent AI companion that can understand your voice commands
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-navy-900/50 border-navy-800/50 shadow-md">
            <CardContent className="p-4 flex items-center">
              <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                <Mic className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Voice Recognition</h3>
                <p className="text-gray-400 text-sm">Advanced speech-to-text</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-navy-900/50 border-navy-800/50 shadow-md">
            <CardContent className="p-4 flex items-center">
              <div className="w-10 h-10 bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                <BrainCircuit className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">AI Processing</h3>
                <p className="text-gray-400 text-sm">Analyzes your requests</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-navy-900/50 border-navy-800/50 shadow-md">
            <CardContent className="p-4 flex items-center">
              <div className="w-10 h-10 bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                <PanelLeftClose className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Task Extraction</h3>
                <p className="text-gray-400 text-sm">Turns speech into actions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Voice transcription component */}
      <RealVoiceTranscription />
    </div>
  );
}