const express = require("express");
const multer = require("multer");
const { ApplicationStatus } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/grievances", authenticateCitizen, async (req, res, next) => {
  try {
    const { department, description } = req.body;

    if (!department || !description) {
      return res
        .status(400)
        .json({ message: "department and description are required" });
    }

    const grievance = await prisma.grievance.create({
      data: {
        citizenId: req.citizen.id,
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

router.post(
  "/grievances/:grievanceId/documents",
  authenticateCitizen,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { grievanceId } = req.params;
      const { fileUrl } = req.body;

      const grievance = await prisma.grievance.findFirst({
        where: { id: grievanceId, citizenId: req.citizen.id },
      });

      if (!grievance) {
        return res.status(404).json({ message: "Grievance not found" });
      }

      const resolvedFileUrl = req.file
        ? `uploaded://${req.file.originalname}`
        : fileUrl;

      if (!resolvedFileUrl) {
        return res.status(400).json({ message: "fileUrl or file is required" });
      }

      const document = await prisma.document.create({
        data: {
          grievanceId,
          fileUrl: resolvedFileUrl,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/grievances", authenticateCitizen, async (req, res, next) => {
  try {
    const grievances = await prisma.grievance.findMany({
      where: { citizenId: req.citizen.id },
      orderBy: { createdAt: "desc" },
      include: { documents: true },
    });

    res.json(grievances);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/grievances/:grievanceId",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const grievance = await prisma.grievance.findFirst({
        where: { id: req.params.grievanceId, citizenId: req.citizen.id },
        include: { documents: true },
      });

      if (!grievance) {
        return res.status(404).json({ message: "Grievance not found" });
      }

      res.json(grievance);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
