const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { callBedrockLLM } = require("../services/llm");
const { ApplicationStatus } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");

const router = express.Router();

// Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../../uploads");
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

router.post("/applications", authenticateCitizen, async (req, res, next) => {
  try {
    const { department, serviceType, schemeId } = req.body;

    if (!department || !serviceType) {
      return res
        .status(400)
        .json({ message: "department and serviceType are required" });
    }

    const application = await prisma.application.create({
      data: {
        citizenId: req.citizen.id,
        department,
        serviceType,
        schemeId: schemeId || undefined,
        status: ApplicationStatus.SUBMITTED,
      },
    });

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/applications/:applicationId/documents",
  authenticateCitizen,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const { fileUrl } = req.body;

      const application = await prisma.application.findFirst({
        where: { id: applicationId, citizenId: req.citizen.id },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const resolvedFileUrl = req.file
        ? `/uploads/${req.file.filename}`
        : fileUrl;

      if (!resolvedFileUrl) {
        return res.status(400).json({ message: "fileUrl or file is required" });
      }

      const document = await prisma.document.create({
        data: {
          applicationId,
          fileUrl: resolvedFileUrl,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/applications", authenticateCitizen, async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: { citizenId: req.citizen.id },
      orderBy: { submittedAt: "desc" },
      include: { documents: true, scheme: true },
    });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/applications/:applicationId",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const application = await prisma.application.findFirst({
        where: { id: req.params.applicationId, citizenId: req.citizen.id },
        include: { documents: true, scheme: true },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      next(error);
    }
  },
);

// Public upload endpoint for Kiosk Mobile Upload (No Auth required)
router.post(
  "/applications/:applicationId/upload-public",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;

      const application = await prisma.application.findUnique({
        where: { id: applicationId }, // No citizenId check (Public Upload)
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const resolvedFileUrl = req.file
        ? `/uploads/${req.file.filename}`
        : req.body.fileUrl;

      if (!resolvedFileUrl) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const document = await prisma.document.create({
        data: {
          applicationId,
          fileUrl: resolvedFileUrl,
          localPath: req.file ? req.file.path : undefined,
        },
      });

      // Attempt to parse text if it's a PDF
      if (req.file && req.file.mimetype === "application/pdf") {
        try {
          const dataBuffer = fs.readFileSync(req.file.path);
          const data = await pdfParse(dataBuffer);

          await prisma.document.update({
            where: { id: document.id },
            data: { extractedText: data.text },
          });
        } catch (parseError) {
          console.error("PDF Parsing failed:", parseError);
        }
      }

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/applications/:applicationId/ask", async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    // Fetch documents with extracted text
    const documents = await prisma.document.findMany({
      where: { applicationId, extractedText: { not: null } },
      select: { extractedText: true },
    });

    if (documents.length === 0) {
      return res
        .status(404)
        .json({ message: "No analyzed documents found for this application" });
    }

    const context = documents.map((d) => d.extractedText).join("\n\n");
    const answer = await callBedrockLLM(question, context);

    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
