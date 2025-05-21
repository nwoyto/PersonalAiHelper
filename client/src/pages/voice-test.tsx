import LiveTranscription from "@/components/LiveTranscription";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Live Transcription</h1>
      <p className="text-gray-300 mb-6">
        Speak naturally into your microphone and your speech will be transcribed in real-time. The system will automatically analyze
        your speech for any tasks or actions you mention, and extract them as actionable items you can save.
      </p>
      <LiveTranscription />
    </div>
  );
}