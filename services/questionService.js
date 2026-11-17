import OpenAI from "openai";
import "dotenv/config";
import prisma from "../lib/prisma.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getSystemPrompt() {
  // Write the instruction for your system
  return ``;
}

export async function answerQuestion({ question }) {
  try {
    const systemMessage = getSystemPrompt();

    // TODO: Ask OpenAI using systemMessage and the question
    // client.responses.create() — model "gpt-4o", json_object format

    // TODO: Parse response.output_text, save it with prisma.question.create(), and return it

  } catch (error) {
    throw error;
  }
}
