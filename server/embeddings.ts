
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { openai } from "./openai";

// Initialize embeddings with the same OpenAI client
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-large"
});

export async function createEmbeddings(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  
  const docs = await splitter.createDocuments([text]);
  const vectors = await embeddings.embedDocuments(
    docs.map(doc => doc.pageContent)
  );
  
  return vectors.map((vector, i) => ({
    content: docs[i].pageContent,
    embedding: vector,
  }));
}

export async function searchSimilar(query: string, vectors: number[][]) {
  const queryEmbedding = await embeddings.embedQuery(query);
  
  // Simple cosine similarity search
  const similarities = vectors.map(vector => {
    const dotProduct = vector.reduce((sum, val, i) => sum + val * queryEmbedding[i], 0);
    const magnitude1 = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  });
  
  return similarities;
}
