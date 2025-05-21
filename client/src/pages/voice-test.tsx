import SimpleLiveTranscription from "@/components/SimpleLiveTranscription";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Live Transcription</h1>
      <p className="text-gray-300 mb-6">
        Type or paste text to analyze for task extraction. The system will automatically analyze
        your text for any tasks or actions you mention, and extract them as actionable items you can save.
      </p>
      <SimpleLiveTranscription />
    </div>
  );
}