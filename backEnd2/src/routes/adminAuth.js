const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma");
const { authenticateAdmin, ADMIN_JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const SESSION_TTL_HOURS = 8;

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        expiresAt,
      },
    });

    const token = jwt.sign(
      { sessionId: session.id, adminId: admin.id, role: "admin" },
      ADMIN_JWT_SECRET,
      { expiresIn: `${SESSION_TTL_HOURS}h` }
    );

    res.json({
      token,
      expiresAt,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", authenticateAdmin, async (req, res, next) => {
  try {
    await prisma.adminSession.delete({ where: { id: req.adminSession.id } });
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
