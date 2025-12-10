import express from "express";
import { askIslamicQuestion } from "../services/questionService.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    // STEP 2: Get the question from req.body
    const { question } = req.body;

    // STEP 3: Validate the question
    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "A valid question (minimum 5 characters) is required.",
      });
    }

    // STEP 4: Call askIslamicQuestion() CORRECTLY
    const response = await askIslamicQuestion({ question });

    // STEP 5: Send success response
    res.json({
      success: true,
      question,
      answer: response.answer,
      evidence: response.evidence,
      disclaimer: response.disclaimer,
    });

  } catch (error) {
    console.error("Islamic Q&A error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error answering question",
    });
  }
});

export default router;
