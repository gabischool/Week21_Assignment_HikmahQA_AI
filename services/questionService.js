import OpenAI from "openai";
//import "dotenv/config";
import prisma from "../lib/prisma.js";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function answerQuestion({ question }) {
  if (!question || typeof question !== "string" || question.trim().length < 5) {
    throw new Error("A valid question (min 5 characters) is required.");
  }

  const trimmedQuestion = question.trim();

  // STEP 1: Create a systemMessage variable that trains the AI to be an Islamic Q&A assistant
  const systemMessage = `
You are an Islamic Q&A assistant.

Requirements:
- Use ONLY the Qur'an and authentic (Sahih) hadith as sources.
- If there is no clear evidence, clearly say so and avoid guessing.
- If there is scholarly difference of opinion, briefly mention that.
- You are NOT issuing a fatwa.
- Always include a disclaimer that this is educational information only and not a formal fatwa.

Output format:
You MUST respond with a SINGLE valid JSON object and NOTHING else.
The JSON MUST have this exact shape:

{
  "answer": "string - a clear, concise answer to the question",
  "evidence": {
    "quran": [
      {
        "reference": "e.g. Surah Al-Baqarah 2:183",
        "arabic": "optional Arabic text",
        "translation": "English meaning",
        "explanation": "short explanation of how it relates"
      }
    ],
    "hadith": [
      {
        "reference": "e.g. Sahih Bukhari 1:1",
        "arabic": "optional Arabic text",
        "translation": "English meaning",
        "explanation": "short explanation of how it relates"
      }
    ]
  },
  "disclaimer": "string - mention that this is NOT a fatwa and advise asking a qualified local scholar for formal rulings."
}
`;

  // STEP 2: Create a userMessage variable with the question
  const userMessage = `User question: ${trimmedQuestion}`;

  // STEP 3: Call client.responses.create() with model "gpt-4o" and json_object-style output
  // (We enforce JSON via instructions; response_format helps nudge the model.)
  const response = await client.responses.create({
    model: "gpt-5.1",
    input: [
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    text: {
      format:{type: "json_object"},
    },
  });

  // STEP 4: Get response.output_text and check if it's empty
  const outputText =
    response.output_text ??
    response.output?.[0]?.content?.[0]?.text ??
    null;

  if (!outputText || !outputText.trim()) {
    throw new Error("Empty response from AI (no output_text).");
  }

  // STEP 5: Parse the JSON response with JSON.parse()
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch (err) {
    console.error("Failed to parse AI JSON:", outputText);
    throw new Error("Failed to parse AI response as JSON.");
  }

  // Optional: basic shape checks
  if (!parsed.answer || !parsed.disclaimer) {
    throw new Error("AI response missing required fields (answer/disclaimer).");
  }

  // STEP 6: Save to database using prisma.question.create()
  // Adjust field names to match your Prisma schema
  await prisma.question.create({
    data: {
      question: trimmedQuestion,
      answer: parsed.answer,
      disclaimer: parsed.disclaimer,
      evidenceQuran: parsed.evidence?.quran ?? [],
      evidenceHadith: parsed.evidence?.hadith ?? [],
    },
  });

  // STEP 7: Return the parsed response
  return parsed;
}

export async function askIslamicQuestion({ question }) {
  try {
    return await answerQuestion({ question });
  } catch (error) {
    console.error("askIslamicQuestion error:", error);
    throw error;
  }
}


