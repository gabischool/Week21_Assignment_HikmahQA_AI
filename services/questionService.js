import OpenAI from "openai";
import "dotenv/config";
import prisma from "../lib/prisma.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function answerQuestion({ question }) {
  // STEP 1: Create a systemMessage variable that trains the AI to be an Islamic Q&A assistant
  // - Use only Quran and Sahih Hadith as sources
  // - Always include a disclaimer that this is NOT a fatwa
  // - Return JSON with: answer, evidence (quran array, hadith array), disclaimer
  const systemMessage = `You are a knowledgeable Islamic scholar and assistant. 
  Your purpose is to answer questions based ONLY on the Quran and Sahih Hadith. 
  If a question cannot be answered using these sources, state that clearly.
  ALWAYS include a disclaimer that this is for educational purposes and NOT a fatwa.
  
  You must return the response in the following JSON format:
  {
    "answer": "The main answer to the question",
    "evidence": {
      "quran": ["Surah Name (Chapter:Verse) - Text"],
      "hadith": ["Book Name, Hadith Number - Text"]
    },
    "disclaimer": "This is not a fatwa. Please consult a local scholar for specific rulings."
  }`;

  // STEP 2: Create a userMessage variable with the question
  const userMessage = question;

  let parsedResponse;

  try {
    // STEP 3: Call client.responses.create() with model "gpt-4o" and json_object format
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    // STEP 4: Get response.output_text and check if it's empty
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response received from AI");
    }

    // STEP 5: Parse the JSON response with JSON.parse()
    parsedResponse = JSON.parse(responseContent);

  } catch (error) {
    console.warn("OpenAI API failed, using mock response:", error.message);

    // Fallback/Mock response for free usage or error handling
    parsedResponse = {
      answer: "Prayer (Salah) is the second pillar of Islam and is the most important act of worship. It establishes a direct connection between the believer and Allah. (NOTE: This is a fallback response because the AI quota was exceeded or the API failed).",
      evidence: {
        quran: ["Surah Al-Ankabut (29:45) - 'Indeed, prayer prohibits immorality and wrongdoing.'"],
        hadith: ["Sahih Bukhari - 'The first thing for which a person will be brought to account on the Day of Resurrection will be his prayer.'"]
      },
      disclaimer: "This is a system generated fallback response for testing purposes."
    };
  }

  // STEP 6: Save to database using prisma.question.create()
  await prisma.question.create({
    data: {
      question: question,
      answer: parsedResponse.answer,
      evidence: JSON.stringify(parsedResponse.evidence),
    },
  });

  // STEP 7: Return the parsed response
  return parsedResponse;
}

export async function askIslamicQuestion({ question }) {
  try {
    return await answerQuestion({ question });
  } catch (error) {
    throw error;
  }
}
