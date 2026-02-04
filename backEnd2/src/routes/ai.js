const express = require("express");
const { authenticateCitizen } = require("../middleware/auth");
const { handleChatInteraction } = require("../services/llm");
const { prisma } = require("../prisma");

const router = express.Router();

router.post("/chat", authenticateCitizen, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const answer = await handleChatInteraction(message, req.citizen.id);

    // Optional: Log the interaction
    await prisma.auditLog.create({
      data: {
        actorType: "CITIZEN",
        actorId: req.citizen.id,
        action: "AI_CHAT",
        metadata: { message, answer: answer.substring(0, 100) + "..." },
      },
    });

    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
