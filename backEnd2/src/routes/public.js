const express = require("express");
const { Department } = require("@prisma/client");
const { prisma } = require("../prisma");
const {
  servicesCatalog,
  tariffsCatalog,
  policiesCatalog,
} = require("../data/publicCatalog");

const router = express.Router();

const resolveDepartment = (value) => {
  if (!value) {
    return null;
  }
  if (!Object.values(Department).includes(value)) {
    return undefined;
  }
  return value;
};

router.get("/departments", (_req, res) => {
  res.json({ departments: Object.values(Department) });
});

router.get("/services", (req, res) => {
  const department = resolveDepartment(req.query.department);

  if (department === undefined) {
    return res.status(400).json({ message: "Invalid department" });
  }

  if (department) {
    return res.json({
      department,
      services: servicesCatalog[department] || [],
    });
  }

  return res.json({
    services: Object.entries(servicesCatalog).map(([dept, services]) => ({
      department: dept,
      services,
    })),
  });
});

router.get("/schemes", async (req, res, next) => {
  try {
    const department = resolveDepartment(req.query.department);
    if (department === undefined) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const schemes = await prisma.publicScheme.findMany({
      where: department ? { department } : undefined,
      orderBy: { title: "asc" },
    });

    res.json(schemes);
  } catch (error) {
    next(error);
  }
});

router.get("/schemes/:schemeId", async (req, res, next) => {
  try {
    const scheme = await prisma.publicScheme.findUnique({
      where: { id: req.params.schemeId },
    });

    if (!scheme) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    res.json(scheme);
  } catch (error) {
    next(error);
  }
});

router.get("/tariffs", (req, res) => {
  const department = resolveDepartment(req.query.department);

  if (department === undefined) {
    return res.status(400).json({ message: "Invalid department" });
  }

  if (department) {
    return res.json({
      department,
      tariff: tariffsCatalog[department] || null,
    });
  }

  return res.json({ tariffs: tariffsCatalog });
});

router.get("/policies", (req, res) => {
  const department = resolveDepartment(req.query.department);

  if (department === undefined) {
    return res.status(400).json({ message: "Invalid department" });
  }

  if (department) {
    return res.json({
      department,
      policies: policiesCatalog[department] || [],
    });
  }

  return res.json({ policies: policiesCatalog });
});

router.get("/advisories", async (req, res, next) => {
  try {
    const department = resolveDepartment(req.query.department);
    if (department === undefined) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const advisories = await prisma.advisory.findMany({
      where: department ? { department } : undefined,
      orderBy: { validTill: "desc" },
    });

    res.json(advisories);
  } catch (error) {
    next(error);
  }
});

router.get("/status/application/:applicationId", async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      select: { status: true },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ status: application.status });
  } catch (error) {
    next(error);
  }
});

router.get("/status/grievance/:grievanceId", async (req, res, next) => {
  try {
    const grievance = await prisma.grievance.findUnique({
      where: { id: req.params.grievanceId },
      select: { status: true },
    });

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    res.json({ status: grievance.status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
