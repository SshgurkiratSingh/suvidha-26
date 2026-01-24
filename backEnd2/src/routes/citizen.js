const express = require("express");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", authenticateCitizen, (req, res) => {
  res.json(req.citizen);
});

router.put("/profile", authenticateCitizen, async (req, res, next) => {
  try {
    const { fullName, mobileNumber, email } = req.body;

    if (!fullName && !mobileNumber && !email) {
      return res
        .status(400)
        .json({ message: "Provide at least one field to update." });
    }

    const updatedCitizen = await prisma.citizen.update({
      where: { id: req.citizen.id },
      data: {
        fullName: fullName || undefined,
        mobileNumber: mobileNumber || undefined,
        email: email || undefined,
      },
    });

    res.json(updatedCitizen);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Duplicate field value" });
    }
    next(error);
  }
});

router.get("/service-accounts", authenticateCitizen, async (req, res, next) => {
  try {
    const serviceAccounts = await prisma.serviceAccount.findMany({
      where: { citizenId: req.citizen.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(serviceAccounts);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/service-accounts",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { department, consumerId, address } = req.body;

      if (!department || !consumerId || !address) {
        return res
          .status(400)
          .json({ message: "department, consumerId, address required" });
      }

      const serviceAccount = await prisma.serviceAccount.create({
        data: {
          citizenId: req.citizen.id,
          department,
          consumerId,
          address,
        },
      });

      res.status(201).json(serviceAccount);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
