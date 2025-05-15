import { TranscriptionResult } from "@/types";

// Process speech transcription for task extraction
export async function processTranscription(text: string): Promise<TranscriptionResult> {
  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Error processing transcription: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text,
      tasks: data.tasks || [],
    };
  } catch (error) {
    console.error('Failed to process transcription:', error);
    return {
      text,
      tasks: [],
    };
  }
}
