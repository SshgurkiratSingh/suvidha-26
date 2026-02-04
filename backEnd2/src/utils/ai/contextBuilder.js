const { prisma } = require("../../prisma");

/**
 * Fetches all public data (Schemes, Services, Tariffs, Policies)
 * and formats it into a system context string.
 */
async function buildGlobalContext() {
  try {
    const [schemes, services, tariffs, policies, advisories, departments] =
      await Promise.all([
        prisma.publicScheme.findMany(),
        prisma.publicService.findMany(),
        prisma.tariff.findMany(),
        prisma.policy.findMany(),
        prisma.advisory.findMany(),
        // Enum values are not directly queryable like this usually, but we know them.
        // We'll just skip fetching enum definition since it appears in the data.
      ]);

    let context = "=== SUVIDHA VALID INFORMATION ===\n\n";

    context += "-- DEPARTMENTS --\n";
    context +=
      " Departments: ELECTRICITY, WATER, GAS, SANITATION, MUNICIPAL\n\n";

    context += "-- AVAILABLE SERVICES --\n";
    services.forEach((s) => {
      context += `- [${s.department}] ${s.name}: ${s.description || ""} (Fees: ₹${s.fees}, Docs: ${s.requiredDocuments.join(", ")})\n`;
    });
    context += "\n";

    context += "-- PUBLIC SCHEMES --\n";
    schemes.forEach((s) => {
      context += `- [${s.department}] ${s.title}: ${s.description} (Eligibility: ${s.eligibility})\n`;
    });
    context += "\n";

    context += "-- TARIFFS & RATES --\n";
    tariffs.forEach((t) => {
      context += `- [${t.department}] ${t.name}: ₹${t.rate} / ${t.unit} (${t.description || ""})\n`;
    });
    context += "\n";

    context += "-- OFFICIAL POLICIES --\n";
    policies.forEach((p) => {
      context += `- [${p.department}] ${p.title}: ${p.description}\n`;
    });
    context += "\n";

    context += "-- ACTIVE ADVISORIES --\n";
    advisories.forEach((a) => {
      context += `- [${a.department}] ${a.message} (Valid till: ${a.validTill.toISOString().split("T")[0]})\n`;
    });

    return context;
  } catch (error) {
    console.error("Error building global context:", error);
    return "Error loading system context.";
  }
}

module.exports = { buildGlobalContext };
