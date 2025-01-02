import { OpenAI } from "@langchain/openai";

export const openAiClient = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});
