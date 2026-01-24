const express = require("express");
const multer = require("multer");
const { ApplicationStatus } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
        ? `uploaded://${req.file.originalname}`
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
  }
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
  }
);

module.exports = router;
