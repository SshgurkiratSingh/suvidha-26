const express = require("express");
const crypto = require("crypto");
const { ApplicationStatus } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateAdmin } = require("../middleware/auth");
const { logAudit } = require("../utils/audit");

const router = express.Router();

const getCitizenByIdentifier = async ({ citizenId, mobileNumber }) => {
  if (citizenId) {
    return prisma.citizen.findUnique({ where: { id: citizenId } });
  }
  if (mobileNumber) {
    return prisma.citizen.findUnique({ where: { mobileNumber } });
  }
  return null;
};

const ensureCitizen = async ({ citizenId, mobileNumber }) => {
  const citizen = await getCitizenByIdentifier({ citizenId, mobileNumber });
  if (citizen) {
    return citizen;
  }
  if (mobileNumber) {
    return prisma.citizen.create({
      data: { fullName: "Citizen", mobileNumber },
    });
  }
  return null;
};

router.use(authenticateAdmin);

router.get("/dashboard/summary", async (_req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [citizens, payments, applications, grievances] = await Promise.all([
      prisma.citizen.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.payment.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.application.count({ where: { submittedAt: { gte: startOfDay } } }),
      prisma.grievance.count({ where: { createdAt: { gte: startOfDay } } }),
    ]);

    res.json({ citizens, payments, applications, grievances });
  } catch (error) {
    next(error);
  }
});
// ==================== POLICIES CRUD ====================
router.get("/policies", async (_req, res, next) => {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(policies);
  } catch (error) {
    next(error);
  }
});

router.post("/policies", async (req, res, next) => {
  try {
    const {
      department,
      title,
      description,
      category,
      effectiveFrom,
      documentUrl,
    } = req.body;

    if (!department || !title || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const policy = await prisma.policy.create({
      data: {
        department,
        title,
        description,
        category: category || null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        documentUrl: documentUrl || null,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "POLICY_CREATED",
      metadata: { policyId: policy.id },
    });

    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
});

router.patch("/policies/:policyId", async (req, res, next) => {
  try {
    const { title, description, category, effectiveFrom, documentUrl } =
      req.body;

    const policy = await prisma.policy.update({
      where: { id: req.params.policyId },
      data: {
        title: title || undefined,
        description: description || undefined,
        category: category !== undefined ? category : undefined,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
        documentUrl: documentUrl !== undefined ? documentUrl : undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "POLICY_UPDATED",
      metadata: { policyId: policy.id },
    });

    res.json(policy);
  } catch (error) {
    next(error);
  }
});

const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const path = require("path");

// Multer config for Policy PDF uploads
const upload = multer({
  dest: path.join(__dirname, "../../uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * Upload a PDF Policy Document, extract text, and save as a Policy.
 * This effectively adds it to the AI Knowledge Base (Context).
 */
router.post(
  "/policies/upload-pdf",
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, department, category } = req.body;

      // Read and Parse PDF
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf(dataBuffer);
      const extractedText = pdfData.text;

      // Create Policy Entry
      // We store the first ~1000 chars as description for display,
      // but in a real vector system, we'd index the whole thing.
      // For our buildGlobalContext(), it reads 'description'.
      // We'll trust the description to hold the key info.
      const description =
        extractedText.substring(0, 1000) +
        (extractedText.length > 1000 ? "..." : "");

      const policy = await prisma.policy.create({
        data: {
          title: title || req.file.originalname,
          description: description,
          department: department || "MUNICIPAL",
          category: category || "GENERAL",
          documentUrl: `/uploads/${req.file.filename}`,
          effectiveFrom: new Date(),
        },
      });

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "POLICY_UPLOADED_PDF",
        metadata: { policyId: policy.id, filename: req.file.originalname },
      });

      res.status(201).json({
        message: "Policy uploaded and processed for AI Context",
        policy,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/policies/:policyId", async (req, res, next) => {
  try {
    await prisma.policy.delete({
      where: { id: req.params.policyId },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "POLICY_DELETED",
      metadata: { policyId: req.params.policyId },
    });

    res.json({ message: "Policy deleted" });
  } catch (error) {
    next(error);
  }
});

// ==================== TARIFFS CRUD ====================
router.get("/tariffs", async (_req, res, next) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(tariffs);
  } catch (error) {
    next(error);
  }
});

router.post("/tariffs", async (req, res, next) => {
  try {
    const {
      department,
      name,
      description,
      category,
      rate,
      unit,
      effectiveFrom,
    } = req.body;

    if (!department || !name || !rate || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const tariff = await prisma.tariff.create({
      data: {
        department,
        name,
        description: description || null,
        category: category || null,
        rate: parseFloat(rate),
        unit,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "TARIFF_CREATED",
      metadata: { tariffId: tariff.id },
    });

    res.status(201).json(tariff);
  } catch (error) {
    next(error);
  }
});

router.patch("/tariffs/:tariffId", async (req, res, next) => {
  try {
    const { name, description, category, rate, unit, effectiveFrom } = req.body;

    const tariff = await prisma.tariff.update({
      where: { id: req.params.tariffId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        rate: rate ? parseFloat(rate) : undefined,
        unit: unit || undefined,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "TARIFF_UPDATED",
      metadata: { tariffId: tariff.id },
    });

    res.json(tariff);
  } catch (error) {
    next(error);
  }
});

router.delete("/tariffs/:tariffId", async (req, res, next) => {
  try {
    await prisma.tariff.delete({
      where: { id: req.params.tariffId },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "TARIFF_DELETED",
      metadata: { tariffId: req.params.tariffId },
    });

    res.json({ message: "Tariff deleted" });
  } catch (error) {
    next(error);
  }
});

// GET all advisories
router.get("/advisories", async (_req, res, next) => {
  try {
    const advisories = await prisma.advisory.findMany({
      orderBy: { validTill: "desc" },
    });
    res.json(advisories);
  } catch (error) {
    next(error);
  }
});

// GET all schemes
router.get("/schemes", async (_req, res, next) => {
  try {
    const schemes = await prisma.publicScheme.findMany({
      orderBy: { title: "asc" },
    });
    res.json(schemes);
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/kiosk-usage", async (_req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sessions = await prisma.session.count({
      where: { createdAt: { gte: startOfDay } },
    });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

router.get("/applications", async (_req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      include: { citizen: true, documents: true, scheme: true },
      orderBy: { submittedAt: "desc" },
    });
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.get("/applications/:applicationId", async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { citizen: true, documents: true, scheme: true },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.patch("/applications/:applicationId/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = [
      ApplicationStatus.UNDER_PROCESS,
      ApplicationStatus.DEMAND_NOTE_ISSUED,
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.DELIVERED,
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    const application = await prisma.application.update({
      where: { id: req.params.applicationId },
      data: { status },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "APPLICATION_STATUS_UPDATED",
      metadata: { applicationId: application.id, status },
    });

    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.get("/grievances", async (_req, res, next) => {
  try {
    const grievances = await prisma.grievance.findMany({
      include: { citizen: true, documents: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(grievances);
  } catch (error) {
    next(error);
  }
});

router.patch("/grievances/:grievanceId/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = [
      ApplicationStatus.UNDER_PROCESS,
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.DELIVERED,
      ApplicationStatus.COMPLETED,
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    const grievance = await prisma.grievance.update({
      where: { id: req.params.grievanceId },
      data: { status },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "GRIEVANCE_STATUS_UPDATED",
      metadata: { grievanceId: grievance.id, status },
    });

    res.json(grievance);
  } catch (error) {
    next(error);
  }
});

router.get("/payments", async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        citizen: true,
        bill: {
          include: { serviceAccount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

router.get("/payments/:paymentId", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: { citizen: true, bill: true },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
});

router.post("/payments/:paymentId/approve", async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { action } = req.body; // "APPROVE" or "REJECT"

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { bill: true },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "INITIATED") {
      return res
        .status(400)
        .json({ message: "Payment is not pending approval" });
    }

    if (action === "REJECT") {
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });
      return res.json({ message: "Payment rejected", payment: updated });
    }

    // Approve
    const updated = await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          receiptNo: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      }),
      prisma.bill.update({
        where: { id: payment.billId },
        data: { isPaid: true },
      }),
    ]);

    res.json({ message: "Payment approved", payment: updated[0] });
  } catch (error) {
    next(error);
  }
});

// ==================== API KEY MANAGEMENT ====================

router.get("/api-keys", async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(keys);
  } catch (error) {
    next(error);
  }
});

router.post("/api-keys", async (req, res, next) => {
  try {
    const { department, serviceName } = req.body;

    if (!department || !serviceName) {
      return res.status(400).json({
        message: "department and serviceName are required",
      });
    }

    // Generate secure API key
    const key = `sk_${department.toLowerCase()}_${crypto.randomBytes(32).toString("hex")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        department,
        serviceName,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "API_KEY_CREATED",
      metadata: { apiKeyId: apiKey.id, department, serviceName },
    });

    res.status(201).json(apiKey);
  } catch (error) {
    next(error);
  }
});

router.patch("/api-keys/:id/revoke", async (req, res, next) => {
  try {
    const apiKey = await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "API_KEY_REVOKED",
      metadata: { apiKeyId: apiKey.id },
    });

    res.json(apiKey);
  } catch (error) {
    next(error);
  }
});

router.patch("/api-keys/:id/activate", async (req, res, next) => {
  try {
    const apiKey = await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { isActive: true },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "API_KEY_ACTIVATED",
      metadata: { apiKeyId: apiKey.id },
    });

    res.json(apiKey);
  } catch (error) {
    next(error);
  }
});

router.post("/schemes", async (req, res, next) => {
  try {
    const {
      department,
      title,
      description,
      eligibility,
      benefits,
      howToApply,
      importantDates,
      contactInfo,
    } = req.body;

    if (!department || !title || !description || !eligibility) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const scheme = await prisma.publicScheme.create({
      data: {
        department,
        title,
        description,
        eligibility,
        benefits,
        howToApply,
        importantDates,
        contactInfo,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "SCHEME_CREATED",
      metadata: { schemeId: scheme.id },
    });

    res.status(201).json(scheme);
  } catch (error) {
    next(error);
  }
});

router.patch("/schemes/:schemeId", async (req, res, next) => {
  try {
    const {
      title,
      description,
      eligibility,
      benefits,
      howToApply,
      importantDates,
      contactInfo,
    } = req.body;

    const scheme = await prisma.publicScheme.update({
      where: { id: req.params.schemeId },
      data: {
        title: title || undefined,
        description: description || undefined,
        eligibility: eligibility || undefined,
        benefits: benefits || undefined,
        howToApply: howToApply || undefined,
        importantDates: importantDates || undefined,
        contactInfo: contactInfo || undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "SCHEME_UPDATED",
      metadata: { schemeId: scheme.id },
    });

    res.json(scheme);
  } catch (error) {
    next(error);
  }
});

router.delete("/schemes/:schemeId", async (req, res, next) => {
  try {
    await prisma.publicScheme.delete({
      where: { id: req.params.schemeId },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "SCHEME_DELETED",
      metadata: { schemeId: req.params.schemeId },
    });

    res.json({ message: "Scheme deleted" });
  } catch (error) {
    next(error);
  }
});

// ==================== SCHEME ELIGIBILITY CRITERIA MANAGEMENT ====================

// Get eligibility criteria for a scheme
router.get(
  "/schemes/:schemeId/eligibility-criteria",
  async (req, res, next) => {
    try {
      const criteria = await prisma.schemeEligibilityCriteria.findMany({
        where: { schemeId: req.params.schemeId },
        orderBy: { order: "asc" },
      });

      res.json(criteria);
    } catch (error) {
      next(error);
    }
  },
);

// Create eligibility criterion
router.post(
  "/schemes/:schemeId/eligibility-criteria",
  async (req, res, next) => {
    try {
      const { schemeId } = req.params;
      const {
        questionText,
        questionType,
        options,
        validationRules,
        weightage,
        order,
        isRequired,
        helpText,
      } = req.body;

      if (!questionText || !questionType) {
        return res
          .status(400)
          .json({ message: "questionText and questionType are required" });
      }

      const criterion = await prisma.schemeEligibilityCriteria.create({
        data: {
          schemeId,
          questionText,
          questionType,
          options,
          validationRules,
          weightage: weightage || 10,
          order: order || 0,
          isRequired: isRequired !== undefined ? isRequired : true,
          helpText,
        },
      });

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "ELIGIBILITY_CRITERION_CREATED",
        metadata: { schemeId, criterionId: criterion.id },
      });

      res.status(201).json(criterion);
    } catch (error) {
      next(error);
    }
  },
);

// Update eligibility criterion
router.patch("/eligibility-criteria/:criterionId", async (req, res, next) => {
  try {
    const {
      questionText,
      questionType,
      options,
      validationRules,
      weightage,
      order,
      isRequired,
      helpText,
    } = req.body;

    const criterion = await prisma.schemeEligibilityCriteria.update({
      where: { id: req.params.criterionId },
      data: {
        questionText: questionText || undefined,
        questionType: questionType || undefined,
        options: options !== undefined ? options : undefined,
        validationRules:
          validationRules !== undefined ? validationRules : undefined,
        weightage: weightage !== undefined ? weightage : undefined,
        order: order !== undefined ? order : undefined,
        isRequired: isRequired !== undefined ? isRequired : undefined,
        helpText: helpText !== undefined ? helpText : undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "ELIGIBILITY_CRITERION_UPDATED",
      metadata: { criterionId: criterion.id },
    });

    res.json(criterion);
  } catch (error) {
    next(error);
  }
});

// Delete eligibility criterion
router.delete("/eligibility-criteria/:criterionId", async (req, res, next) => {
  try {
    await prisma.schemeEligibilityCriteria.delete({
      where: { id: req.params.criterionId },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "ELIGIBILITY_CRITERION_DELETED",
      metadata: { criterionId: req.params.criterionId },
    });

    res.json({ message: "Eligibility criterion deleted" });
  } catch (error) {
    next(error);
  }
});

// ==================== SCHEME REQUIRED DOCUMENTS MANAGEMENT ====================

// Get required documents for a scheme
router.get("/schemes/:schemeId/required-documents", async (req, res, next) => {
  try {
    const documents = await prisma.schemeRequiredDocument.findMany({
      where: { schemeId: req.params.schemeId },
      orderBy: { order: "asc" },
    });

    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// Create required document
router.post("/schemes/:schemeId/required-documents", async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const {
      documentName,
      description,
      isMandatory,
      acceptedFormats,
      maxSizeKB,
      order,
    } = req.body;

    if (!documentName) {
      return res.status(400).json({ message: "documentName is required" });
    }

    const document = await prisma.schemeRequiredDocument.create({
      data: {
        schemeId,
        documentName,
        description,
        isMandatory: isMandatory !== undefined ? isMandatory : true,
        acceptedFormats: acceptedFormats || ["pdf", "jpg", "png"],
        maxSizeKB: maxSizeKB || 2048,
        order: order || 0,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "REQUIRED_DOCUMENT_CREATED",
      metadata: { schemeId, documentId: document.id },
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// Update required document
router.patch("/required-documents/:documentId", async (req, res, next) => {
  try {
    const {
      documentName,
      description,
      isMandatory,
      acceptedFormats,
      maxSizeKB,
      order,
    } = req.body;

    const document = await prisma.schemeRequiredDocument.update({
      where: { id: req.params.documentId },
      data: {
        documentName: documentName || undefined,
        description: description !== undefined ? description : undefined,
        isMandatory: isMandatory !== undefined ? isMandatory : undefined,
        acceptedFormats:
          acceptedFormats !== undefined ? acceptedFormats : undefined,
        maxSizeKB: maxSizeKB !== undefined ? maxSizeKB : undefined,
        order: order !== undefined ? order : undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "REQUIRED_DOCUMENT_UPDATED",
      metadata: { documentId: document.id },
    });

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Delete required document
router.delete("/required-documents/:documentId", async (req, res, next) => {
  try {
    await prisma.schemeRequiredDocument.delete({
      where: { id: req.params.documentId },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "REQUIRED_DOCUMENT_DELETED",
      metadata: { documentId: req.params.documentId },
    });

    res.json({ message: "Required document deleted" });
  } catch (error) {
    next(error);
  }
});

// ==================== SCHEME APPLICATIONS MANAGEMENT ====================

// Get all scheme applications
router.get("/scheme-applications", async (req, res, next) => {
  try {
    const { status, schemeId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (schemeId) where.schemeId = schemeId;

    const applications = await prisma.schemeApplication.findMany({
      where,
      include: {
        citizen: true,
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

// Get single scheme application
router.get("/scheme-applications/:applicationId", async (req, res, next) => {
  try {
    const application = await prisma.schemeApplication.findUnique({
      where: { id: req.params.applicationId },
      include: {
        citizen: true,
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
});

// Update scheme application status
router.patch("/scheme-applications/:applicationId", async (req, res, next) => {
  try {
    const { status, remarks, rejectionReason } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "APPROVED") {
        updateData.approvedAt = new Date();
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = req.admin.id;
      } else if (status === "REJECTED") {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = req.admin.id;
        if (rejectionReason) updateData.rejectionReason = rejectionReason;
      } else if (status === "UNDER_REVIEW") {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = req.admin.id;
      }
    }
    if (remarks !== undefined) updateData.remarks = remarks;

    const application = await prisma.schemeApplication.update({
      where: { id: req.params.applicationId },
      data: updateData,
      include: {
        citizen: true,
        scheme: true,
        documents: true,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "SCHEME_APPLICATION_UPDATED",
      metadata: { applicationId: application.id, status },
    });

    res.json(application);
  } catch (error) {
    next(error);
  }
});

router.post("/advisories", async (req, res, next) => {
  try {
    const { department, message, validTill } = req.body;

    if (!department || !message || !validTill) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const advisory = await prisma.advisory.create({
      data: { department, message, validTill: new Date(validTill) },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "ADVISORY_CREATED",
      metadata: { advisoryId: advisory.id },
    });

    res.status(201).json(advisory);
  } catch (error) {
    next(error);
  }
});

router.patch("/advisories/:advisoryId", async (req, res, next) => {
  try {
    const { message, validTill } = req.body;

    const advisory = await prisma.advisory.update({
      where: { id: req.params.advisoryId },
      data: {
        message: message || undefined,
        validTill: validTill ? new Date(validTill) : undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "ADVISORY_UPDATED",
      metadata: { advisoryId: advisory.id },
    });

    res.json(advisory);
  } catch (error) {
    next(error);
  }
});

router.delete("/advisories/:advisoryId", async (req, res, next) => {
  try {
    await prisma.advisory.delete({
      where: { id: req.params.advisoryId },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "ADVISORY_DELETED",
      metadata: { advisoryId: req.params.advisoryId },
    });

    res.json({ message: "Advisory deleted" });
  } catch (error) {
    next(error);
  }
});

router.get("/citizens", async (_req, res, next) => {
  try {
    const citizens = await prisma.citizen.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(citizens);
  } catch (error) {
    next(error);
  }
});

router.get("/citizens/:citizenId", async (req, res, next) => {
  try {
    const citizen = await prisma.citizen.findUnique({
      where: { id: req.params.citizenId },
    });

    if (!citizen) {
      return res.status(404).json({ message: "Citizen not found" });
    }

    res.json(citizen);
  } catch (error) {
    next(error);
  }
});

router.get("/sessions/active", async (_req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { citizen: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.get("/audit-logs", async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.get("/error-reports", async (_req, res, next) => {
  try {
    const reports = await prisma.errorReport.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

router.post("/service-accounts", async (req, res, next) => {
  try {
    const { citizenId, mobileNumber, department, consumerId, address } =
      req.body;

    if (!department || !consumerId || !address) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const citizen = await ensureCitizen({ citizenId, mobileNumber });
    if (!citizen) {
      return res
        .status(400)
        .json({ message: "citizenId or mobileNumber required" });
    }

    const account = await prisma.serviceAccount.create({
      data: {
        citizenId: citizen.id,
        department,
        consumerId,
        address,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "SERVICE_ACCOUNT_CREATED",
      metadata: { citizenId: citizen.id, serviceAccountId: account.id },
    });

    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

router.get("/bills", async (req, res, next) => {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        serviceAccount: {
          include: { citizen: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(bills);
  } catch (error) {
    next(error);
  }
});

router.post("/bills", async (req, res, next) => {
  try {
    const {
      citizenId,
      mobileNumber,
      department,
      consumerId,
      address,
      amount,
      dueDate,
    } = req.body;

    if (!amount || !dueDate || !department || !consumerId || !address) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const citizen = await ensureCitizen({ citizenId, mobileNumber });
    if (!citizen) {
      return res
        .status(400)
        .json({ message: "citizenId or mobileNumber required" });
    }

    let serviceAccount = await prisma.serviceAccount.findFirst({
      where: { citizenId: citizen.id, department, consumerId },
    });

    if (!serviceAccount) {
      serviceAccount = await prisma.serviceAccount.create({
        data: {
          citizenId: citizen.id,
          department,
          consumerId,
          address,
        },
      });
    }

    const bill = await prisma.bill.create({
      data: {
        serviceAccountId: serviceAccount.id,
        amount,
        dueDate: new Date(dueDate),
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "BILL_CREATED",
      metadata: { citizenId: citizen.id, billId: bill.id },
    });

    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
});

router.patch("/bills/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, dueDate, isPaid } = req.body;

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isPaid: isPaid !== undefined ? isPaid : undefined,
      },
    });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "BILL_UPDATED",
      metadata: { billId: bill.id },
    });

    res.json(bill);
  } catch (error) {
    next(error);
  }
});

router.delete("/bills/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    // Optional: Check if associated payments exist and warn/block, but cascade might handle it or we just force delete
    await prisma.bill.delete({ where: { id } });

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "BILL_DELETED",
      metadata: { billId: id },
    });

    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/bills/test", async (req, res, next) => {
  try {
    const { mobileNumber, department, consumerId, address, amount, dueDate } =
      req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "mobileNumber required" });
    }

    const testBill = await prisma.$transaction(async (tx) => {
      let citizen = await tx.citizen.findUnique({
        where: { mobileNumber },
      });

      if (!citizen) {
        citizen = await tx.citizen.create({
          data: { fullName: "Citizen", mobileNumber },
        });
      }

      let serviceAccount = await tx.serviceAccount.findFirst({
        where: {
          citizenId: citizen.id,
          department: department || "ELECTRICITY",
          consumerId: consumerId || "TEST-CONSUMER",
        },
      });

      if (!serviceAccount) {
        serviceAccount = await tx.serviceAccount.create({
          data: {
            citizenId: citizen.id,
            department: department || "ELECTRICITY",
            consumerId: consumerId || "TEST-CONSUMER",
            address: address || "Test Address",
          },
        });
      }

      return tx.bill.create({
        data: {
          serviceAccountId: serviceAccount.id,
          amount: amount || 100,
          dueDate: new Date(dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    res.status(201).json(testBill);
  } catch (error) {
    next(error);
  }
});

router.post("/applications", async (req, res, next) => {
  try {
    const { citizenId, mobileNumber, department, serviceType, schemeId } =
      req.body;

    if (!department || !serviceType) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const citizen = await ensureCitizen({ citizenId, mobileNumber });
    if (!citizen) {
      return res
        .status(400)
        .json({ message: "citizenId or mobileNumber required" });
    }

    const application = await prisma.application.create({
      data: {
        citizenId: citizen.id,
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

router.post("/grievances", async (req, res, next) => {
  try {
    const { citizenId, mobileNumber, department, description } = req.body;

    if (!department || !description) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const citizen = await ensureCitizen({ citizenId, mobileNumber });
    if (!citizen) {
      return res
        .status(400)
        .json({ message: "citizenId or mobileNumber required" });
    }

    const grievance = await prisma.grievance.create({
      data: {
        citizenId: citizen.id,
        department,
        description,
        status: ApplicationStatus.SUBMITTED,
      },
    });

    res.status(201).json(grievance);
  } catch (error) {
    next(error);
  }
});

router.post("/test-data", async (req, res, next) => {
  try {
    const { mobileNumber, department, serviceType } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "mobileNumber required" });
    }

    const citizen = await ensureCitizen({ mobileNumber });

    const application = await prisma.application.create({
      data: {
        citizenId: citizen.id,
        department: department || "ELECTRICITY",
        serviceType: serviceType || "NEW_CONNECTION",
        status: ApplicationStatus.SUBMITTED,
      },
    });

    const grievance = await prisma.grievance.create({
      data: {
        citizenId: citizen.id,
        department: department || "ELECTRICITY",
        description: "Test grievance",
        status: ApplicationStatus.SUBMITTED,
      },
    });

    res.status(201).json({
      citizenId: citizen.id,
      applicationId: application.id,
      grievanceId: grievance.id,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// TARIFFS MANAGEMENT
// ==========================================
router.get("/tariffs", async (req, res, next) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { department: "asc" },
    });
    res.json(tariffs);
  } catch (error) {
    next(error);
  }
});

router.post("/tariffs", async (req, res, next) => {
  try {
    const { department, name, rate, unit, description, category } = req.body;
    const tariff = await prisma.tariff.create({
      data: {
        department,
        name,
        rate: parseFloat(rate),
        unit,
        description,
        category,
      },
    });
    res.status(201).json(tariff);
  } catch (error) {
    next(error);
  }
});

router.patch("/tariffs/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, rate, unit, description, category } = req.body;
    const tariff = await prisma.tariff.update({
      where: { id },
      data: {
        name,
        rate: rate ? parseFloat(rate) : undefined,
        unit,
        description,
        category,
      },
    });
    res.json(tariff);
  } catch (error) {
    next(error);
  }
});

router.delete("/tariffs/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.tariff.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// POLICIES MANAGEMENT
// ==========================================
router.get("/policies", async (req, res, next) => {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { department: "asc" },
    });
    res.json(policies);
  } catch (error) {
    next(error);
  }
});

router.post("/policies", async (req, res, next) => {
  try {
    const { department, title, description, category } = req.body;
    const policy = await prisma.policy.create({
      data: {
        department,
        title,
        description,
        category,
      },
    });
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
});

router.patch("/policies/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const policy = await prisma.policy.update({
      where: { id },
      data: {
        title,
        description,
        category,
      },
    });
    res.json(policy);
  } catch (error) {
    next(error);
  }
});

router.delete("/policies/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.policy.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
