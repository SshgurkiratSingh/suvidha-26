const { prisma } = require("../../prisma");

const TOOLS = {
  FETCH_MY_BILLS: {
    name: "fetch_my_bills",
    description: "Fetch pending and paid bills for the current user.",
    execute: async (citizenId) => {
      const bills = await prisma.bill.findMany({
        where: { serviceAccount: { citizenId } },
        include: { serviceAccount: true },
        orderBy: { dueDate: "desc" },
        take: 5,
      });
      return JSON.stringify(bills);
    },
  },
  FETCH_MY_APPLICATIONS: {
    name: "fetch_my_applications",
    description: "Fetch status of recent applications submitted by the user.",
    execute: async (citizenId) => {
      const apps = await prisma.application.findMany({
        where: { citizenId },
        select: {
          id: true,
          department: true,
          serviceType: true,
          status: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      });
      return JSON.stringify(apps);
    },
  },
  FETCH_MY_GRIEVANCES: {
    name: "fetch_my_grievances",
    description: "Fetch status of recent grievances.",
    execute: async (citizenId) => {
      const grievances = await prisma.grievance.findMany({
        where: { citizenId },
        select: {
          id: true,
          department: true,
          description: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      return JSON.stringify(grievances);
    },
  },
};

const TOOL_DEFINITIONS = Object.values(TOOLS).map((t) => ({
  name: t.name,
  description: t.description,
}));

async function executeTool(toolName, citizenId) {
  const tool = Object.values(TOOLS).find((t) => t.name === toolName);
  if (!tool) return "Tool not found or unauthorized.";

  try {
    const data = await tool.execute(citizenId);
    return `[DATA FROM DATABASE]: ${data}`;
  } catch (error) {
    return `[ERROR EXECUTING TOOL]: ${error.message}`;
  }
}

module.exports = { TOOL_DEFINITIONS, executeTool };
