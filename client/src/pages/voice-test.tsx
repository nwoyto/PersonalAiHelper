import RealVoiceTranscription from "@/components/RealVoiceTranscription";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Voice Transcription</h1>
      <p className="text-gray-300 mb-6">
        Speak into your microphone to record and transcribe your voice. The system will automatically analyze
        your speech for any tasks or actions you mention, and extract them as actionable items you can save.
      </p>
      <RealVoiceTranscription />
    </div>
  );
}