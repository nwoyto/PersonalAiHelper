import TaskExtractionTester from "@/components/TaskExtractionTester";

export default function VoiceTest() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Task Extraction Testing</h1>
      <p className="text-gray-300 mb-6">
        Use this tool to test how well the system can extract tasks from your spoken input. Speak about things you need to do, 
        including deadlines, priorities, locations, and people involved. The AI will analyze your speech and identify tasks.
      </p>
      <TaskExtractionTester />
    </div>
  );
}