const express = require("express");
const { prisma } = require("../prisma");
const {
  authenticateApiKey,
  requireDepartment,
} = require("../middleware/apiKeyAuth");
const { logAudit } = require("../utils/audit");

const router = express.Router();

// Apply API key authentication to all routes
router.use(authenticateApiKey);

// ==================== BILL MANAGEMENT ====================

/**
 * POST /api/unified/bills/bulk
 * Create multiple bills in one request
 * Required: X-API-Key header
 */
router.post("/bills/bulk", async (req, res, next) => {
  try {
    const { bills } = req.body;

    if (!Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({
        message: "bills array is required and must not be empty",
      });
    }

    if (bills.length > 100) {
      return res.status(400).json({
        message: "Maximum 100 bills can be created in one request",
      });
    }

    const department = req.apiKey.department;
    const results = [];
    const errors = [];

    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      try {
        const { mobileNumber, consumerId, address, amount, dueDate, metadata } =
          bill;

        if (!mobileNumber || !consumerId || !address || !amount || !dueDate) {
          errors.push({
            index: i,
            data: bill,
            error: "Missing required fields",
          });
          continue;
        }

        // Find or create citizen
        let citizen = await prisma.citizen.findUnique({
          where: { mobileNumber },
        });

        if (!citizen) {
          citizen = await prisma.citizen.create({
            data: { fullName: "Citizen", mobileNumber },
          });
        }

        // Find or create service account
        let serviceAccount = await prisma.serviceAccount.findFirst({
          where: { citizenId: citizen.id, department, consumerId },
        });

        if (!serviceAccount) {
          serviceAccount = await prisma.serviceAccount.create({
            data: { citizenId: citizen.id, department, consumerId, address },
          });
        }

        // Create bill
        const createdBill = await prisma.bill.create({
          data: {
            serviceAccountId: serviceAccount.id,
            amount: parseFloat(amount),
            dueDate: new Date(dueDate),
          },
        });

        results.push({
          index: i,
          billId: createdBill.id,
          consumerId,
        });
      } catch (error) {
        errors.push({
          index: i,
          data: bill,
          error: error.message,
        });
      }
    }

    await logAudit({
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
      action: "BULK_BILLS_CREATED_VIA_API",
      metadata: {
        department,
        serviceName: req.apiKey.serviceName,
        successCount: results.length,
        errorCount: errors.length,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        created: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/unified/bills
 * Create a new bill for a citizen
 * Required: X-API-Key header
 */
router.post("/bills", async (req, res, next) => {
  try {
    const {
      mobileNumber,
      consumerId,
      address,
      amount,
      dueDate,
      billingPeriod,
      metadata,
    } = req.body;

    // Validate required fields
    if (!mobileNumber || !consumerId || !address || !amount || !dueDate) {
      return res.status(400).json({
        message:
          "Missing required fields: mobileNumber, consumerId, address, amount, dueDate",
      });
    }

    // Use department from API key
    const department = req.apiKey.department;

    // Find or create citizen
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

    // Find or create service account
    let serviceAccount = await prisma.serviceAccount.findFirst({
      where: {
        citizenId: citizen.id,
        department,
        consumerId,
      },
    });

    if (!serviceAccount) {
      serviceAccount = await prisma.serviceAccount.create({
        data: {
          citizenId: citizen.id,
          department,
          consumerId,
          address,
        },
      });
    }

    // Create bill
    const bill = await prisma.bill.create({
      data: {
        serviceAccountId: serviceAccount.id,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
      },
    });

    await logAudit({
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
      action: "BILL_CREATED_VIA_API",
      metadata: {
        billId: bill.id,
        department,
        serviceName: req.apiKey.serviceName,
        billingPeriod,
        customMetadata: metadata,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        billId: bill.id,
        citizenId: citizen.id,
        serviceAccountId: serviceAccount.id,
        amount: bill.amount,
        dueDate: bill.dueDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/unified/bills
 * List bills with filters and pagination
 * Query params: page, limit, isPaid, fromDate, toDate
 */
router.get("/bills", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      isPaid,
      fromDate,
      toDate,
      consumerId,
    } = req.query;

    const department = req.apiKey.department;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100); // Max 100 per page

    // Build filter
    const where = {
      serviceAccount: { department },
    };

    if (isPaid !== undefined) {
      where.isPaid = isPaid === "true";
    }

    if (consumerId) {
      where.serviceAccount.consumerId = consumerId;
    }

    if (fromDate || toDate) {
      where.dueDate = {};
      if (fromDate) where.dueDate.gte = new Date(fromDate);
      if (toDate) where.dueDate.lte = new Date(toDate);
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          serviceAccount: {
            include: { citizen: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/unified/bills/:consumerId
 * Get bills for a consumer
 */
router.get("/bills/:consumerId", async (req, res, next) => {
  try {
    const { consumerId } = req.params;
    const department = req.apiKey.department;

    const serviceAccount = await prisma.serviceAccount.findFirst({
      where: {
        consumerId,
        department,
      },
      include: {
        bills: {
          orderBy: { createdAt: "desc" },
        },
        citizen: {
          select: {
            id: true,
            fullName: true,
            mobileNumber: true,
          },
        },
      },
    });

    if (!serviceAccount) {
      return res.status(404).json({
        message: "Consumer not found for this department",
      });
    }

    res.json({
      success: true,
      data: {
        consumerId: serviceAccount.consumerId,
        citizen: serviceAccount.citizen,
        bills: serviceAccount.bills,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/unified/bills/:billId
 * Update bill status or amount
 */
router.patch("/bills/:billId", async (req, res, next) => {
  try {
    const { billId } = req.params;
    const { amount, dueDate, isPaid } = req.body;

    // Verify bill belongs to API key's department
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { serviceAccount: true },
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.serviceAccount.department !== req.apiKey.department) {
      return res.status(403).json({
        message: "Bill does not belong to your department",
      });
    }

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isPaid: isPaid !== undefined ? isPaid : undefined,
      },
    });

    await logAudit({
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
      action: "BILL_UPDATED_VIA_API",
      metadata: {
        billId: updated.id,
        serviceName: req.apiKey.serviceName,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/unified/bills/:billId
 * Delete a bill (only unpaid bills)
 */
router.delete("/bills/:billId", async (req, res, next) => {
  try {
    const { billId } = req.params;

    // Verify bill belongs to API key's department
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { serviceAccount: true },
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.serviceAccount.department !== req.apiKey.department) {
      return res.status(403).json({
        message: "Bill does not belong to your department",
      });
    }

    if (bill.isPaid) {
      return res.status(400).json({
        message: "Cannot delete a paid bill",
      });
    }

    await prisma.bill.delete({
      where: { id: billId },
    });

    await logAudit({
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
      action: "BILL_DELETED_VIA_API",
      metadata: {
        billId,
        serviceName: req.apiKey.serviceName,
      },
    });

    res.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PAYMENT INFORMATION ====================

/**
 * GET /api/unified/payments/:consumerId
 * Get payment history for a consumer
 */
router.get("/payments/:consumerId", async (req, res, next) => {
  try {
    const { consumerId } = req.params;
    const department = req.apiKey.department;

    const serviceAccount = await prisma.serviceAccount.findFirst({
      where: {
        consumerId,
        department,
      },
      include: {
        bills: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!serviceAccount) {
      return res.status(404).json({
        message: "Consumer not found",
      });
    }

    const payments = serviceAccount.bills.flatMap((bill) =>
      bill.payments.map((payment) => ({
        ...payment,
        billAmount: bill.amount,
        billDueDate: bill.dueDate,
      })),
    );

    res.json({
      success: true,
      data: {
        consumerId,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== CITIZEN INFORMATION ====================

/**
 * POST /api/unified/citizens
 * Register or update citizen information
 */
router.post("/citizens", async (req, res, next) => {
  try {
    const { mobileNumber, fullName, email } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        message: "mobileNumber is required",
      });
    }

    const citizen = await prisma.citizen.upsert({
      where: { mobileNumber },
      update: {
        fullName: fullName || undefined,
        email: email || undefined,
      },
      create: {
        mobileNumber,
        fullName: fullName || "Citizen",
        email: email || null,
      },
    });

    res.json({
      success: true,
      data: citizen,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/unified/citizens/:mobileNumber
 * Get citizen information
 */
router.get("/citizens/:mobileNumber", async (req, res, next) => {
  try {
    const { mobileNumber } = req.params;

    const citizen = await prisma.citizen.findUnique({
      where: { mobileNumber },
      include: {
        serviceAccounts: {
          where: {
            department: req.apiKey.department,
          },
        },
      },
    });

    if (!citizen) {
      return res.status(404).json({
        message: "Citizen not found",
      });
    }

    res.json({
      success: true,
      data: citizen,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SERVICE ACCOUNTS ====================

/**
 * POST /api/unified/service-accounts
 * Create a new service account (connection)
 */
router.post("/service-accounts", async (req, res, next) => {
  try {
    const { mobileNumber, consumerId, address } = req.body;

    if (!mobileNumber || !consumerId || !address) {
      return res.status(400).json({
        message: "Missing required fields: mobileNumber, consumerId, address",
      });
    }

    const department = req.apiKey.department;

    // Find or create citizen
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

    // Check if service account already exists
    const existing = await prisma.serviceAccount.findFirst({
      where: {
        citizenId: citizen.id,
        department,
        consumerId,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Service account already exists for this consumer",
      });
    }

    const serviceAccount = await prisma.serviceAccount.create({
      data: {
        citizenId: citizen.id,
        department,
        consumerId,
        address,
      },
    });

    await logAudit({
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
      action: "SERVICE_ACCOUNT_CREATED_VIA_API",
      metadata: {
        serviceAccountId: serviceAccount.id,
        serviceName: req.apiKey.serviceName,
      },
    });

    res.status(201).json({
      success: true,
      data: serviceAccount,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== STATISTICS ====================

/**
 * GET /api/unified/statistics
 * Get statistics for your department
 */
router.get("/statistics", async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const department = req.apiKey.department;

    const dateFilter = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const [totalBills, paidBills, unpaidBills, totalRevenue, serviceAccounts] =
      await Promise.all([
        prisma.bill.count({
          where: {
            serviceAccount: { department },
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
        }),
        prisma.bill.count({
          where: {
            serviceAccount: { department },
            isPaid: true,
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
        }),
        prisma.bill.count({
          where: {
            serviceAccount: { department },
            isPaid: false,
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
        }),
        prisma.bill.aggregate({
          where: {
            serviceAccount: { department },
            isPaid: true,
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
          _sum: { amount: true },
        }),
        prisma.serviceAccount.count({
          where: { department, active: true },
        }),
      ]);

    res.json({
      success: true,
      data: {
        department,
        period: {
          from: fromDate || "all-time",
          to: toDate || "now",
        },
        bills: {
          total: totalBills,
          paid: paidBills,
          unpaid: unpaidBills,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          currency: "INR",
        },
        activeConnections: serviceAccounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/unified/statistics/overdue
 * Get overdue bills statistics
 */
router.get("/statistics/overdue", async (req, res, next) => {
  try {
    const department = req.apiKey.department;
    const today = new Date();

    const overdueBills = await prisma.bill.findMany({
      where: {
        serviceAccount: { department },
        isPaid: false,
        dueDate: { lt: today },
      },
      include: {
        serviceAccount: {
          include: { citizen: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const totalOverdueAmount = overdueBills.reduce(
      (sum, bill) => sum + bill.amount,
      0,
    );

    res.json({
      success: true,
      data: {
        count: overdueBills.length,
        totalAmount: totalOverdueAmount,
        bills: overdueBills,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/unified/health
 * Check API connectivity and authentication
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API connection successful",
    authenticated: true,
    department: req.apiKey.department,
    serviceName: req.apiKey.serviceName,
    timestamp: new Date().toISOString(),
  });
});

// ==================== NOTIFICATIONS ====================

/**
 * POST /api/unified/bills/:billId/send-reminder
 * Trigger a payment reminder for a bill
 */
router.post("/bills/:billId/send-reminder", async (req, res, next) => {
  try {
    const { billId } = req.params;
    const { message, channel } = req.body; // channel: SMS, EMAIL, PUSH

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        serviceAccount: {
          include: { citizen: true },
        },
      },
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.serviceAccount.department !== req.apiKey.department) {
      return res.status(403).json({
        message: "Bill does not belong to your department",
      });
    }

    if (bill.isPaid) {
      return res.status(400).json({
        message: "Bill is already paid",
      });
    }

    // Log the reminder request
    await logAudit({
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
      action: "REMINDER_SENT_VIA_API",
      metadata: {
        billId,
        consumerId: bill.serviceAccount.consumerId,
        channel: channel || "PLATFORM",
        serviceName: req.apiKey.serviceName,
      },
    });

    // In production, integrate with SMS/Email service
    // For now, just acknowledge the request

    res.json({
      success: true,
      message: "Reminder request queued",
      data: {
        billId,
        recipient: bill.serviceAccount.citizen.mobileNumber,
        channel: channel || "PLATFORM",
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/unified/audit-logs
 * Get audit logs for your API key usage
 */
router.get("/audit-logs", async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    const where = {
      actorType: "SYSTEM",
      actorId: req.apiKey.id,
    };

    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
