const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma");
const { JWT_SECRET } = require("../middleware/auth");
const {
  handleChatMessage,
  getConversationHistory,
} = require("../services/chatbot");
const {
  transcribeAudio,
  textToSpeech,
  getAvailableVoices,
} = require("../services/voice");
const { generateEmbedding } = require("../services/embedding");

const getToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
};

const authenticateCitizenOptional = async (req, _res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { citizen: true },
    });

    if (session && session.expiresAt > new Date()) {
      req.citizen = session.citizen;
      req.session = session;
    }

    return next();
  } catch (_error) {
    return next();
  }
};

router.use(authenticateCitizenOptional);

// Configure multer for voice file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../../uploads/voice");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid audio file type"));
    }
  },
});

/**
 * POST /api/chat/message
 * Send a text message to the chatbot
 */
router.post("/message", async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        error: "conversationId and message are required",
      });
    }

    // Get citizen ID from auth if available
    const citizenId = req.citizen?.id || null;

    console.log(`Chat message from ${citizenId || "anonymous"}: ${message}`);

    // Handle the message
    const response = await handleChatMessage(
      conversationId,
      message,
      citizenId,
    );

    res.json({
      success: true,
      response: response.content,
      messageId: response.messageId,
      requiresAction: response.requiresAction,
      functionCall: response.functionCall,
    });
  } catch (error) {
    console.error("Error in /chat/message:", error);
    next(error);
  }
});

/**
 * POST /api/chat/voice
 * Send a voice message to the chatbot
 */
router.post("/voice", upload.single("audio"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Audio file is required",
      });
    }

    const { conversationId, languageCode = "en-US" } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        error: "conversationId is required",
      });
    }

    const citizenId = req.citizen?.id || null;

    console.log("Voice message received, transcribing...");

    // Transcribe audio to text
    const transcript = await transcribeAudio(req.file.path, languageCode);
    console.log("Transcribed text:", transcript);

    // Handle the transcribed message
    const response = await handleChatMessage(
      conversationId,
      transcript,
      citizenId,
    );

    // Convert response to speech
    console.log("Converting response to speech...");
    const audioBuffer = await textToSpeech(response.content, languageCode);

    // Save audio file
    const audioFilename = `response-${Date.now()}.mp3`;
    const audioPath = path.join(
      __dirname,
      "../../uploads/voice",
      audioFilename,
    );
    fs.writeFileSync(audioPath, audioBuffer);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      transcript: transcript,
      response: response.content,
      audioUrl: `/uploads/voice/${audioFilename}`,
      messageId: response.messageId,
      requiresAction: response.requiresAction,
      functionCall: response.functionCall,
    });
  } catch (error) {
    console.error("Error in /chat/voice:", error);
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * POST /api/chat/tts
 * Convert text to speech
 */
router.post("/tts", async (req, res, next) => {
  try {
    const { text, languageCode = "en-US", voiceId } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "text is required",
      });
    }

    console.log("Converting text to speech:", text.substring(0, 50) + "...");

    const audioBuffer = await textToSpeech(text, languageCode, voiceId);

    // Save audio file
    const audioFilename = `tts-${Date.now()}.mp3`;
    const audioPath = path.join(
      __dirname,
      "../../uploads/voice",
      audioFilename,
    );
    fs.writeFileSync(audioPath, audioBuffer);

    res.json({
      success: true,
      audioUrl: `/uploads/voice/${audioFilename}`,
    });
  } catch (error) {
    console.error("Error in /chat/tts:", error);
    next(error);
  }
});

/**
 * GET /api/chat/voices
 * Get available voices for a language
 */
router.get("/voices", (req, res) => {
  const { languageCode = "en-US" } = req.query;
  const voices = getAvailableVoices(languageCode);

  res.json({
    success: true,
    languageCode,
    voices,
  });
});

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history
 */
router.get("/history/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const citizenId = req.citizen?.id || null;

    const conversation = await getConversationHistory(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    // Check if user has access to this conversation
    if (conversation.citizenId && conversation.citizenId !== citizenId) {
      return res.status(403).json({
        error: "Access denied to this conversation",
      });
    }

    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          metadata: msg.metadata,
        })),
      },
    });
  } catch (error) {
    console.error("Error in /chat/history:", error);
    next(error);
  }
});

/**
 * POST /api/chat/conversation
 * Create a new conversation
 */
router.post("/conversation", async (req, res, next) => {
  try {
    const citizenId = req.citizen?.id || null;
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      conversationId,
      citizenId,
    });
  } catch (error) {
    console.error("Error in /chat/conversation:", error);
    next(error);
  }
});

/**
 * GET /api/chat/test-embedding
 * Test embedding generation
 */
router.get("/test-embedding", async (req, res, next) => {
  try {
    const { text = "Hello, how can I help you today?" } = req.query;

    const embedding = await generateEmbedding(text);

    res.json({
      success: true,
      text,
      embeddingDimension: embedding.length,
      embeddingSample: embedding.slice(0, 10), // First 10 values
    });
  } catch (error) {
    console.error("Error in /chat/test-embedding:", error);
    next(error);
  }
});

module.exports = router;
