import RealVoiceTranscription from "@/components/RealVoiceTranscription";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Agent</h1>
      <p className="text-gray-300 mb-6">
        Your AI voice assistant. Speak into your microphone and the agent will transcribe your voice,
        analyze your speech, and extract any tasks or actions you mention as actionable items.
      </p>
      <RealVoiceTranscription />
    </div>
  );
}