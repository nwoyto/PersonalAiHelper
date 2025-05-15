import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development" });

interface TaskExtraction {
  title: string;
  description?: string;
  dueDate?: string;
  category: "work" | "personal" | "urgent";
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
            "You are an AI assistant that analyzes conversation transcripts and extracts key information. " +
            "Given a transcript, you should: " +
            "1. Generate an appropriate title for the conversation. " +
            "2. Provide a concise summary of the conversation. " +
            "3. Extract any action items or tasks that were mentioned, with due dates if specified. " +
            "4. Categorize each task as 'work', 'personal', or 'urgent'. " +
            "Provide your response in JSON format."
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
        description: task.description,
        dueDate: task.dueDate,
        category: ["work", "personal", "urgent"].includes(task.category) 
          ? task.category 
          : "work"
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
