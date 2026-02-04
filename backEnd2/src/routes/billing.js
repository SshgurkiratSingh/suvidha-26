const express = require("express");
const { PaymentStatus } = require("@prisma/client");
const { prisma } = require("../prisma");
const { authenticateCitizen } = require("../middleware/auth");

const router = express.Router();

router.get("/bills", authenticateCitizen, async (req, res, next) => {
  try {
    const bills = await prisma.bill.findMany({
      where: {
        serviceAccount: {
          citizenId: req.citizen.id,
        },
      },
      include: { serviceAccount: true },
      orderBy: { dueDate: "desc" },
    });
    res.json(bills);
  } catch (error) {
    next(error);
  }
});

router.get("/bills/:billId", authenticateCitizen, async (req, res, next) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: {
        id: req.params.billId,
        serviceAccount: { citizenId: req.citizen.id },
      },
      include: { serviceAccount: true },
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/payments/initiate",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { billId, amount } = req.body;

      if (!billId) {
        return res.status(400).json({ message: "billId is required" });
      }

      const bill = await prisma.bill.findFirst({
        where: {
          id: billId,
          serviceAccount: { citizenId: req.citizen.id },
        },
      });

      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      const payment = await prisma.payment.create({
        data: {
          citizenId: req.citizen.id,
          billId: bill.id,
          amount: amount ?? bill.amount,
          status: PaymentStatus.INITIATED,
        },
      });

      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/payments/bulk-pay",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { billIds } = req.body;

      if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
        return res.status(400).json({ message: "billIds array is required" });
      }

      // 1. Verify all bills belong to citizen and are unpaid
      const bills = await prisma.bill.findMany({
        where: {
          id: { in: billIds },
          serviceAccount: { citizenId: req.citizen.id },
          isPaid: false,
        },
      });

      if (bills.length !== billIds.length) {
        return res.status(400).json({
          message:
            "Some bills are invalid, already paid, or do not belong to you.",
        });
      }

      // 2. Process payments in a transaction
      const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);

      const results = await prisma.$transaction(async (tx) => {
        const payments = [];

        for (const bill of bills) {
          // Create Payment Record
          const payment = await tx.payment.create({
            data: {
              citizenId: req.citizen.id,
              billId: bill.id,
              amount: bill.amount,
              status: PaymentStatus.SUCCESS, // Auto-mark success for kiosk demo
              receiptNo: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            },
          });

          // Update Bill Status
          await tx.bill.update({
            where: { id: bill.id },
            data: { isPaid: true },
          });

          payments.push(payment);
        }

        return payments;
      });

      res.status(200).json({
        message: "Bulk payment successful",
        count: results.length,
        totalAmount,
        payments: results,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/payments/confirm",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const { paymentId, status, receiptNo } = req.body;

      if (!paymentId || !status) {
        return res
          .status(400)
          .json({ message: "paymentId and status are required" });
      }

      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, citizenId: req.citizen.id },
      });

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status, receiptNo: receiptNo || payment.receiptNo },
      });

      if (status === PaymentStatus.SUCCESS && payment.billId) {
        await prisma.bill.update({
          where: { id: payment.billId },
          data: { isPaid: true },
        });
      }

      res.json(updatedPayment);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/payments/history", authenticateCitizen, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { citizenId: req.citizen.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/payments/:paymentId/receipt",
  authenticateCitizen,
  async (req, res, next) => {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: req.params.paymentId, citizenId: req.citizen.id },
        include: { bill: true },
      });

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json({
        receiptNo: payment.receiptNo,
        status: payment.status,
        amount: payment.amount,
        bill: payment.bill,
        createdAt: payment.createdAt,
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
