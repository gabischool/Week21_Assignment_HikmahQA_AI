import express from "express";

import { askIslamicQuestion } from "../services/questionService.js";


const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    // STEP 2: Get the question from req.body
    const { question } = req.body;

    // STEP 3: Validate the question (check if it exists and is a string)
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid question",
      });
    }

    // STEP 4: Call askIslamicQuestion() with the question
    const answer = await askIslamicQuestion({ question });

    // STEP 5: Send a success response with the answer
    res.status(200).json({
      success: true,
      data: answer,
    });


  } catch (error) {
    console.error("Islamic Q&A error:", error);
    res.status(500).json({
      success: false,
      message: "Error answering question",
      error: error.message,
    });
  }
});

export default router;
