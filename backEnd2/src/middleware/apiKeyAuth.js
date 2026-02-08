const { prisma } = require("../prisma");

const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        message: "API key is required. Include X-API-Key header.",
      });
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!keyRecord) {
      return res.status(401).json({
        message: "Invalid API key",
      });
    }

    if (!keyRecord.isActive) {
      return res.status(403).json({
        message: "API key has been revoked",
      });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach key info to request
    req.apiKey = keyRecord;
    next();
  } catch (error) {
    console.error("API Key Auth Error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

const requireDepartment = (allowedDepartments) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const allowed = Array.isArray(allowedDepartments)
      ? allowedDepartments
      : [allowedDepartments];

    if (!allowed.includes(req.apiKey.department)) {
      return res.status(403).json({
        message: `Access denied. Required departments: ${allowed.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = { authenticateApiKey, requireDepartment };
