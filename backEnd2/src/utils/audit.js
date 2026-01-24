const { prisma } = require("../prisma");

const logAudit = async ({ actorType, actorId, action, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorType,
        actorId,
        action,
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
};

module.exports = {
  logAudit,
};
