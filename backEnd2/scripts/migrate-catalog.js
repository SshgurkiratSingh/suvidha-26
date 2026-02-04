const { Department, ServiceType } = require("@prisma/client");
const { prisma } = require("../src/prisma");
const {
  servicesCatalog,
  tariffsCatalog,
  policiesCatalog,
} = require("../src/data/publicCatalog");

async function main() {
  console.log("Starting catalog migration...");

  // 1. Migrate Services
  console.log("Migrating Services...");
  for (const [dept, services] of Object.entries(servicesCatalog)) {
    for (const service of services) {
      // Check for existing to avoid duplicates
      const existing = await prisma.publicService.findFirst({
        where: {
          department: dept,
          serviceType: service.serviceType,
        },
      });

      if (!existing) {
        await prisma.publicService.create({
          data: {
            department: dept,
            serviceType: service.serviceType,
            name: service.serviceType.replace(/_/g, " "), // Simple name generation
            fees: service.fees,
            requiredDocuments: service.requiredDocuments,
            description: "Standard service",
          },
        });
        console.log(`Created Service: ${dept} - ${service.serviceType}`);
      }
    }
  }

  // 2. Migrate Tariffs
  console.log("Migrating Tariffs...");
  for (const [dept, details] of Object.entries(tariffsCatalog)) {
    // Unit Rate
    const unitRateExists = await prisma.tariff.findFirst({
      where: { department: dept, name: "Unit Rate" },
    });
    if (!unitRateExists && details.unitRate) {
      await prisma.tariff.create({
        data: {
          department: dept,
          name: "Unit Rate",
          rate: parseFloat(details.unitRate),
          unit: "per unit",
          description: details.notes || "Standard unit rate",
          category: "Usage",
        },
      });
      console.log(`Created Tariff: ${dept} - Unit Rate`);
    }

    // Fixed Charge
    const fixedChargeExists = await prisma.tariff.findFirst({
      where: { department: dept, name: "Fixed Charge" },
    });
    if (!fixedChargeExists && details.fixedCharge) {
      await prisma.tariff.create({
        data: {
          department: dept,
          name: "Fixed Charge",
          rate: parseFloat(details.fixedCharge),
          unit: "fixed/month",
          description: "Monthly fixed charge",
          category: "Fixed",
        },
      });
      console.log(`Created Tariff: ${dept} - Fixed Charge`);
    }
  }

  // 3. Migrate Policies
  console.log("Migrating Policies...");
  for (const [dept, policies] of Object.entries(policiesCatalog)) {
    for (const policyText of policies) {
      const existing = await prisma.policy.findFirst({
        where: { department: dept, description: policyText },
      });

      if (!existing) {
        await prisma.policy.create({
          data: {
            department: dept,
            title: "Policy Announcement",
            description: policyText,
            category: "General",
            effectiveFrom: new Date(),
          },
        });
        console.log(`Created Policy: ${dept}`);
      }
    }
  }

  console.log("Migration completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
