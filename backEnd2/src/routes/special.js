const express = require("express");
const { ApplicationStatus, ServiceType } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/schemes/:schemeId/apply",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const scheme = await prisma.publicScheme.findUnique({
        where: { id: req.params.schemeId },
      });

      if (!scheme) {
        return res.status(404).json({ message: "Scheme not found" });
      }

      const application = await prisma.application.create({
        data: {
          citizenId: req.citizen.id,
          department: scheme.department,
          serviceType: ServiceType.SCHEME_APPLICATION,
          status: ApplicationStatus.SUBMITTED,
          schemeId: scheme.id,
        },
      });

      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/water-quality-tests",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { sampleAddress } = req.body;

      if (!sampleAddress) {
        return res.status(400).json({ message: "sampleAddress is required" });
      }

      const test = await prisma.waterQualityTest.create({
        data: {
          citizenId: req.citizen.id,
          sampleAddress,
          status: ApplicationStatus.SUBMITTED,
        },
      });

      res.status(201).json(test);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/water-quality-tests/:testId",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const test = await prisma.waterQualityTest.findFirst({
        where: { id: req.params.testId, citizenId: req.citizen.id },
      });

      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json(test);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/water-quality-tests/:testId/report",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const test = await prisma.waterQualityTest.findFirst({
        where: { id: req.params.testId, citizenId: req.citizen.id },
        select: { reportUrl: true },
      });

      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json({ reportUrl: test.reportUrl });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
