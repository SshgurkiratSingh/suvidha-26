const express = require("express");
const jwt = require("jsonwebtoken");
const { AuthType } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateCitizen, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const DEFAULT_OTP = process.env.DEFAULT_OTP || "123456";
const SESSION_TTL_HOURS = 24;

router.post("/request-otp", (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ message: "mobileNumber is required" });
  }

  res.json({
    message: "OTP sent",
    otp: DEFAULT_OTP,
  });
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res
        .status(400)
        .json({ message: "mobileNumber and otp are required" });
    }

    if (otp !== DEFAULT_OTP) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    let citizen = await prisma.citizen.findUnique({
      where: { mobileNumber },
    });

    if (!citizen) {
      citizen = await prisma.citizen.create({
        data: {
          fullName: "Citizen",
          mobileNumber,
        },
      });
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        citizenId: citizen.id,
        authType: AuthType.OTP,
        expiresAt,
      },
    });

    const token = jwt.sign(
      { sessionId: session.id, citizenId: citizen.id, role: "citizen" },
      JWT_SECRET,
      { expiresIn: `${SESSION_TTL_HOURS}h` }
    );

    res.json({
      token,
      expiresAt,
      citizen: {
        id: citizen.id,
        fullName: citizen.fullName,
        mobileNumber: citizen.mobileNumber,
        email: citizen.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", authenticateCitizen, async (req, res, next) => {
  try {
    await prisma.session.delete({ where: { id: req.session.id } });
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
