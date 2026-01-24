const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma");

const JWT_SECRET = process.env.JWT_SECRET || "dev-citizen-secret";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-admin-secret";

const getToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
};

const authenticateCitizen = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { citizen: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.citizen = session.citizen;
    req.session = session;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    const session = await prisma.adminSession.findUnique({
      where: { id: payload.sessionId },
      include: { admin: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.admin = session.admin;
    req.adminSession = session;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = {
  authenticateCitizen,
  authenticateAdmin,
  JWT_SECRET,
  ADMIN_JWT_SECRET,
};
