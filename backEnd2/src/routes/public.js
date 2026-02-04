const express = require("express");
const { Department } = require("@prisma/client");
const { prisma } = require("../prisma");

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

router.get("/services", async (req, res, next) => {
  try {
    const department = resolveDepartment(req.query.department);

    if (department === undefined) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const where = department ? { department } : {};
    const services = await prisma.publicService.findMany({
      where,
      orderBy: { serviceType: "asc" },
    });

    if (department) {
      return res.json({
        department,
        services,
      });
    }

    // Group by department if no department specified
    const grouped = services.reduce((acc, service) => {
      if (!acc[service.department]) {
        acc[service.department] = [];
      }
      acc[service.department].push(service);
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([dept, s]) => ({
      department: dept,
      services: s,
    }));

    res.json({ services: result });
  } catch (error) {
    next(error);
  }
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

router.get("/tariffs", async (req, res, next) => {
  try {
    const department = resolveDepartment(req.query.department);

    if (department === undefined) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const where = department ? { department } : {};
    const tariffs = await prisma.tariff.findMany({ where });

    // Helper to format tariff list into the object format expected by frontend
    // Expected: { unitRate: 7.2, fixedCharge: 75, notes: "..." }
    const formatTariff = (list) => {
      const t = {};
      const unitRate = list.find((i) => i.name === "Unit Rate");
      const fixedCharge = list.find((i) => i.name === "Fixed Charge");

      if (unitRate) t.unitRate = unitRate.rate;
      if (fixedCharge) t.fixedCharge = fixedCharge.rate;
      if (unitRate) t.notes = unitRate.description; // fallback desc
      return t;
    };

    if (department) {
      return res.json({
        department,
        tariff: formatTariff(tariffs),
      });
    }

    // Group by department
    const grouped = tariffs.reduce((acc, t) => {
      if (!acc[t.department]) acc[t.department] = [];
      acc[t.department].push(t);
      return acc;
    }, {});

    const result = {};
    for (const [dept, list] of Object.entries(grouped)) {
      result[dept] = formatTariff(list);
    }

    res.json({ tariffs: result });
  } catch (error) {
    next(error);
  }
});

router.get("/policies", async (req, res, next) => {
  try {
    const department = resolveDepartment(req.query.department);

    if (department === undefined) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const where = department ? { department } : {};
    const policies = await prisma.policy.findMany({ 
      where,
      orderBy: { createdAt: 'desc' } 
    });

    res.json(policies);
  } catch (error) {
    next(error);
  }
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
