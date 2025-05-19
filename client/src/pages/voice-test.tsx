import VoiceTestingTool from "@/components/VoiceTestingTool";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Voice Recognition Testing</h1>
      <p className="text-gray-300 mb-6">
        Use this tool to test the accuracy of the voice recognition system. Speak a phrase, see how well it's transcribed, and collect metrics on accuracy.
      </p>
      <VoiceTestingTool />
    </div>
  );
}