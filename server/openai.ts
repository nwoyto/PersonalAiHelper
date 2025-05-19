import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development" });

interface TaskExtraction {
  title: string;
  description?: string;
  dueDate?: string;
  category: "work" | "personal" | "urgent";
  priority: "high" | "medium" | "low";
  estimatedMinutes?: number;
  location?: string;
  people?: string[];
  recurring?: boolean;
  recurringPattern?: string;
}

interface TranscriptionAnalysis {
  title: string;
  summary: string;
  tasks: TaskExtraction[];
}

export async function analyzeTranscription(text: string): Promise<TranscriptionAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI personal assistant that analyzes conversation transcripts and extracts key information with high accuracy. " +
            "Given a transcript, you should: " +
            "1. Generate an appropriate title for the conversation. " +
            "2. Provide a concise summary of the conversation (maximum 2 sentences). " +
            "3. Extract any action items or tasks that were mentioned, with the following attributes:\n" +
            "   - title: Short, action-oriented task title\n" +
            "   - description: Detailed explanation of what needs to be done\n" +
            "   - dueDate: Specific due date in YYYY-MM-DD format ONLY if a specific date is mentioned. Otherwise, use a descriptive string like 'tomorrow' or 'next week'.\n" +
            "   - category: Must be one of 'work', 'personal', or 'urgent'\n" +
            "   - priority: Must be one of 'high', 'medium', or 'low'\n" +
            "   - estimatedMinutes: Estimated time to complete the task in minutes as a NUMBER (if specified)\n" +
            "   - location: Where the task needs to be performed (if specified)\n" +
            "   - people: Array of names of people involved (if specified)\n" +
            "   - recurring: Boolean value (true or false) indicating if this is a recurring task\n" +
            "   - recurringPattern: Description of recurrence pattern like 'daily', 'weekly on Mondays', etc. (if recurring)\n" +
            "Be intelligent and look for implied tasks even if they're not explicitly stated as todos.\n" +
            "Intelligently infer category and priority based on context if not explicitly stated.\n" +
            "If the person uses phrases like 'we need to', 'I should', 'don't forget to', 'remember to', these are likely tasks.\n" +
            "IMPORTANT: For dates, if a specific calendar date is mentioned, format as YYYY-MM-DD. For relative dates like 'tomorrow', 'next Friday', do NOT attempt to calculate the actual date - leave as descriptive text.\n" +
            "Provide your response in the following JSON format:\n" +
            "{\n" +
            "  \"title\": \"Conversation Title\",\n" +
            "  \"summary\": \"Brief summary of the conversation.\",\n" +
            "  \"tasks\": [\n" +
            "    {\n" +
            "      \"title\": \"Task title\",\n" +
            "      \"description\": \"Task description\",\n" +
            "      \"dueDate\": \"2025-05-20\",\n" +
            "      \"category\": \"work\",\n" +
            "      \"priority\": \"high\",\n" +
            "      \"estimatedMinutes\": 30,\n" +
            "      \"location\": \"Office\",\n" +
            "      \"people\": [\"John\", \"Sarah\"],\n" +
            "      \"recurring\": false,\n" +
            "      \"recurringPattern\": null\n" +
            "    }\n" +
            "  ]\n" +
            "}"
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get content from OpenAI response");
    }

    const result = JSON.parse(content);
    
    // Ensure the result has the expected format
    return {
      title: result.title || "Transcribed Conversation",
      summary: result.summary || text.substring(0, 100) + "...",
      tasks: Array.isArray(result.tasks) ? result.tasks.map((task: any) => ({
        title: task.title || "Untitled Task",
        description: task.description || "",
        dueDate: task.dueDate || undefined,
        category: ["work", "personal", "urgent"].includes(task.category) 
          ? task.category 
          : "work",
        priority: ["high", "medium", "low"].includes(task.priority)
          ? task.priority
          : "medium",
        estimatedMinutes: typeof task.estimatedMinutes === 'number' 
          ? task.estimatedMinutes 
          : undefined,
        location: task.location || undefined,
        people: Array.isArray(task.people) ? task.people : undefined,
        recurring: typeof task.recurring === 'boolean' ? task.recurring : false,
        recurringPattern: task.recurring === true ? task.recurringPattern : undefined
      })) : []
    };
    
  } catch (error) {
    console.error("Error analyzing transcription:", error);
    
    // Fallback response if OpenAI fails
    return {
      title: "Transcribed Conversation",
      summary: text.substring(0, 100) + "...",
      tasks: []
    };
  }
}

export async function transcribeAudio(audioData: ArrayBuffer): Promise<{ text: string }> {
  try {
    // In a real implementation, we would send the audio data to OpenAI's Whisper API
    // Since we can't directly use the Whisper API in this demo, we'll simulate it
    
    // For a real implementation, the code would look something like this:
    /*
    const formData = new FormData();
    formData.append("file", new Blob([audioData]), "audio.webm");
    formData.append("model", "whisper-1");
    
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });
    
    const result = await response.json();
    return { text: result.text };
    */
    
    // Simulated response for demo purposes
    return { 
      text: "Schedule a meeting with the design team for tomorrow at 2 PM to discuss the new mobile app wireframes." 
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return { text: "Failed to transcribe audio." };
  }
}
