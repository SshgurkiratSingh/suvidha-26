const express = require("express");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configure Multer for scheme application documents
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../../uploads/scheme-documents");
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

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"));
  },
});

// ==================== PUBLIC SCHEME ENDPOINTS ====================

/**
 * GET /api/schemes/:schemeId
 * Get detailed scheme information including eligibility criteria and required documents
 * If user is authenticated, also returns pre-filled answers from saved profile
 */
router.get("/:schemeId", async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const authHeader = req.headers.authorization;

    const scheme = await prisma.publicScheme.findUnique({
      where: { id: schemeId },
      include: {
        eligibilityCriteria: {
          orderBy: { order: "asc" },
        },
        requiredDocuments: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!scheme) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    // If user is authenticated, get saved answers for pre-fill
    let savedAnswers = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const jwt = require("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET || "dev-citizen-secret";
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role === "citizen" && decoded.citizenId) {
          const profile = await prisma.citizenProfile.findUnique({
            where: { citizenId: decoded.citizenId },
          });

          if (
            profile?.consentToSaveAnswers &&
            profile?.savedEligibilityAnswers
          ) {
            // Map saved answers to current scheme questions
            savedAnswers = {};
            for (const criteria of scheme.eligibilityCriteria) {
              const savedData =
                profile.savedEligibilityAnswers[criteria.questionText];
              if (
                savedData &&
                savedData.questionType === criteria.questionType
              ) {
                savedAnswers[criteria.id] = savedData.answer;
              }
            }
          }
        }
      } catch (error) {
        // If token verification fails, just don't include saved answers
        console.log("Token verification failed for pre-fill:", error.message);
      }
    }

    res.json({
      ...scheme,
      savedAnswers, // null if not authenticated or no saved answers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/schemes/:schemeId/check-eligibility
 * Check eligibility for a scheme based on survey answers
 * Optionally saves answers to profile for future reuse
 */
router.post(
  "/:schemeId/check-eligibility",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { schemeId } = req.params;
      const { answers, saveToProfile = false } = req.body; // { questionId: answer, ... }, saveToProfile flag

      const scheme = await prisma.publicScheme.findUnique({
        where: { id: schemeId },
        include: {
          eligibilityCriteria: true,
        },
      });

      if (!scheme) {
        return res.status(404).json({ message: "Scheme not found" });
      }

      // Calculate eligibility score
      let totalScore = 0;
      let maxScore = 0;
      const evaluationResults = [];

      for (const criteria of scheme.eligibilityCriteria) {
        const answer = answers[criteria.id];
        maxScore += criteria.weightage;

        const evaluation = evaluateAnswer(criteria, answer);
        evaluationResults.push({
          questionId: criteria.id,
          question: criteria.questionText,
          answer,
          passed: evaluation.passed,
          score: evaluation.score,
        });

        if (evaluation.passed) {
          totalScore += criteria.weightage;
        }
      }

      // Determine eligibility status
      const scorePercentage =
        maxScore > 0 ? (totalScore / maxScore) * 100 : 100;
      let eligibilityStatus;

      if (scorePercentage >= 80) {
        eligibilityStatus = "ELIGIBLE";
      } else if (scorePercentage >= 50) {
        eligibilityStatus = "PARTIALLY_ELIGIBLE";
      } else {
        eligibilityStatus = "NOT_ELIGIBLE";
      }

      // Save answers to profile if requested
      if (saveToProfile) {
        // Get or create citizen profile
        let profile = await prisma.citizenProfile.findUnique({
          where: { citizenId: req.citizen.id },
        });

        // Build saved answers map using questionText as key
        const savedAnswers = profile?.savedEligibilityAnswers || {};

        for (const criteria of scheme.eligibilityCriteria) {
          const answer = answers[criteria.id];
          if (answer !== undefined && answer !== null && answer !== "") {
            savedAnswers[criteria.questionText] = {
              answer,
              questionType: criteria.questionType,
              savedAt: new Date().toISOString(),
            };
          }
        }

        // Update or create profile
        await prisma.citizenProfile.upsert({
          where: { citizenId: req.citizen.id },
          update: {
            savedEligibilityAnswers: savedAnswers,
            consentToSaveAnswers: true,
          },
          create: {
            citizenId: req.citizen.id,
            savedEligibilityAnswers: savedAnswers,
            consentToSaveAnswers: true,
          },
        });
      }

      res.json({
        eligible: eligibilityStatus === "ELIGIBLE",
        eligibilityStatus,
        score: totalScore,
        maxScore,
        percentage: scorePercentage.toFixed(2),
        evaluationResults,
        message: getEligibilityMessage(eligibilityStatus, scorePercentage),
        savedToProfile: saveToProfile,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Helper function to evaluate individual answer
 */
function evaluateAnswer(criteria, answer) {
  const rules = criteria.validationRules || {};

  // For YES_NO questions
  if (criteria.questionType === "YES_NO") {
    const expectedAnswer = rules.expectedAnswer || "YES";
    const passed = answer === expectedAnswer;
    return { passed, score: passed ? criteria.weightage : 0 };
  }

  // For NUMBER questions
  if (criteria.questionType === "NUMBER" || criteria.questionType === "RANGE") {
    const numValue = parseFloat(answer);
    let passed = true;

    if (rules.min !== undefined && numValue < rules.min) passed = false;
    if (rules.max !== undefined && numValue > rules.max) passed = false;

    return { passed, score: passed ? criteria.weightage : 0 };
  }

  // For SINGLE_CHOICE/MULTIPLE_CHOICE
  if (
    criteria.questionType === "SINGLE_CHOICE" ||
    criteria.questionType === "MULTIPLE_CHOICE"
  ) {
    const validOptions = rules.validOptions || [];
    const passed = validOptions.length === 0 || validOptions.includes(answer);
    return { passed, score: passed ? criteria.weightage : 0 };
  }

  // Default: pass
  return { passed: true, score: criteria.weightage };
}

/**
 * Helper function to get eligibility message
 */
function getEligibilityMessage(status, percentage) {
  if (status === "ELIGIBLE") {
    return "Congratulations! You are eligible for this scheme. You can proceed with the application.";
  } else if (status === "PARTIALLY_ELIGIBLE") {
    return `You meet ${percentage.toFixed(0)}% of the eligibility criteria. You may still apply, but approval is subject to review.`;
  } else {
    return "Unfortunately, you do not meet the eligibility criteria for this scheme at this time.";
  }
}

// ==================== CITIZEN PROFILE ENDPOINTS ====================

/**
 * GET /api/schemes/profile/me
 * Get citizen's saved profile
 */
router.get("/profile/me", authenticateCitizen, async (req, res, next) => {
  try {
    let profile = await prisma.citizenProfile.findUnique({
      where: { citizenId: req.citizen.id },
    });

    if (!profile) {
      // Create empty profile if doesn't exist
      profile = await prisma.citizenProfile.create({
        data: { citizenId: req.citizen.id },
      });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/schemes/profile/me
 * Update citizen's profile
 */
router.put("/profile/me", authenticateCitizen, async (req, res, next) => {
  try {
    const profileData = req.body;
    delete profileData.id;
    delete profileData.citizenId;
    delete profileData.createdAt;
    delete profileData.updatedAt;

    const profile = await prisma.citizenProfile.upsert({
      where: { citizenId: req.citizen.id },
      update: profileData,
      create: {
        citizenId: req.citizen.id,
        ...profileData,
      },
    });

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// ==================== SCHEME APPLICATION ENDPOINTS ====================

/**
 * POST /api/schemes/:schemeId/applications
 * Create a new scheme application (draft)
 */
router.post(
  "/:schemeId/applications",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { schemeId } = req.params;
      const {
        eligibilityAnswers,
        formData,
        eligibilityStatus,
        eligibilityScore,
      } = req.body;

      // Verify scheme exists
      const scheme = await prisma.publicScheme.findUnique({
        where: { id: schemeId },
      });

      if (!scheme) {
        return res.status(404).json({ message: "Scheme not found" });
      }

      // Generate application number
      const applicationNumber = await generateApplicationNumber(
        scheme.department,
      );

      const application = await prisma.schemeApplication.create({
        data: {
          applicationNumber,
          citizenId: req.citizen.id,
          schemeId,
          status: "DRAFT",
          eligibilityStatus: eligibilityStatus || "PENDING_REVIEW",
          eligibilityScore: eligibilityScore || 0,
          eligibilityAnswers: eligibilityAnswers || {},
          eligibilityCheckedAt: new Date(),
          formData: formData || {},
        },
      });

      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/schemes/applications/:applicationId
 * Update scheme application
 */
router.patch(
  "/applications/:applicationId",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const { formData, status } = req.body;

      const application = await prisma.schemeApplication.findFirst({
        where: {
          id: applicationId,
          citizenId: req.citizen.id,
        },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updateData = {};
      if (formData) updateData.formData = formData;
      if (status) {
        updateData.status = status;
        if (status === "SUBMITTED") {
          updateData.submittedAt = new Date();
        }
      }

      const updated = await prisma.schemeApplication.update({
        where: { id: applicationId },
        data: updateData,
        include: {
          documents: true,
          scheme: true,
        },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/schemes/applications/:applicationId/documents
 * Upload document for scheme application
 */
router.post(
  "/applications/:applicationId/documents",
  authenticateCitizen,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const { documentName, documentType } = req.body;

      const application = await prisma.schemeApplication.findFirst({
        where: {
          id: applicationId,
          citizenId: req.citizen.id,
        },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const document = await prisma.schemeApplicationDocument.create({
        data: {
          schemeApplicationId: applicationId,
          documentName: documentName || req.file.originalname,
          documentType: documentType || "other",
          fileUrl: `/uploads/scheme-documents/${req.file.filename}`,
          localPath: req.file.path,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/schemes/applications/my
 * Get all applications for the logged-in citizen
 */
router.get("/applications/my", authenticateCitizen, async (req, res, next) => {
  try {
    const applications = await prisma.schemeApplication.findMany({
      where: { citizenId: req.citizen.id },
      include: {
        scheme: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/schemes/applications/:applicationId
 * Get single application details
 */
router.get(
  "/applications/:applicationId",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;

      const application = await prisma.schemeApplication.findFirst({
        where: {
          id: applicationId,
          citizenId: req.citizen.id,
        },
        include: {
          scheme: {
            include: {
              eligibilityCriteria: true,
              requiredDocuments: true,
            },
          },
          documents: true,
        },
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

/**
 * Helper function to generate application number
 */
async function generateApplicationNumber(department) {
  const prefix = department.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
}

module.exports = router;
