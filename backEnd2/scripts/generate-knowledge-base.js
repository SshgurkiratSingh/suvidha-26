require("dotenv").config();
const { prisma } = require("../src/prisma");
const {
  generateEmbedding,
  serializeEmbedding,
} = require("../src/services/embedding");

/**
 * Generate knowledge base from existing data in the database
 * Creates embeddings for schemes, policies, tariffs, and other content
 */

async function generateKnowledgeBase() {
  console.log("🚀 Starting knowledge base generation...\n");

  try {
    // Clear existing knowledge base
    console.log("Clearing existing knowledge base...");
    await prisma.knowledgeBase.deleteMany({});
    console.log("✓ Cleared existing entries\n");

    let totalEntries = 0;

    // ==========================================
    // 1. Generate embeddings for Schemes
    // ==========================================
    console.log("📋 Processing Schemes...");
    const schemes = await prisma.publicScheme.findMany({
      include: {
        eligibilityCriteria: true,
        requiredDocuments: true,
      },
    });

    for (const scheme of schemes) {
      const content = `
    Scheme: ${scheme.title}
    Department: ${scheme.department}
    Description: ${scheme.description}
    Eligibility (Summary): ${scheme.eligibility || "N/A"}
    Eligibility (Questions): ${scheme.eligibilityCriteria.map((c) => c.questionText).join("; ")}
    Required Documents: ${scheme.requiredDocuments.map((d) => d.documentName).join(", ")}
      `.trim();

      try {
        const embedding = await generateEmbedding(content);
        await prisma.knowledgeBase.create({
          data: {
            category: "scheme",
            title: scheme.title,
            content: content,
            metadata: {
              schemeId: scheme.id,
              department: scheme.department,
              eligibility: scheme.eligibility,
              eligibilityCriteria: scheme.eligibilityCriteria.map((c) => ({
                question: c.questionText,
                type: c.questionType,
              })),
              requiredDocuments: scheme.requiredDocuments.map(
                (d) => d.documentName,
              ),
            },
            embedding: serializeEmbedding(embedding),
            sourceUrl: `/schemes/${scheme.id}`,
            department: scheme.department,
          },
        });
        totalEntries++;
        console.log(`  ✓ Added: ${scheme.title}`);
      } catch (error) {
        console.error(`  ✗ Failed for scheme ${scheme.title}:`, error.message);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // ==========================================
    // 2. Generate embeddings for Policies
    // ==========================================
    console.log("\n📜 Processing Policies...");
    const policies = await prisma.policy.findMany();

    for (const policy of policies) {
      const content = `
    Policy: ${policy.title}
    Department: ${policy.department}
    Description: ${policy.description}
    Category: ${policy.category || "N/A"}
    Effective From: ${policy.effectiveFrom ? policy.effectiveFrom.toDateString() : "N/A"}
    Document URL: ${policy.documentUrl || "N/A"}
      `.trim();

      try {
        const embedding = await generateEmbedding(content);
        await prisma.knowledgeBase.create({
          data: {
            category: "policy",
            title: policy.title,
            content: content,
            metadata: {
              policyId: policy.id,
              department: policy.department,
              effectiveFrom: policy.effectiveFrom,
            },
            embedding: serializeEmbedding(embedding),
            department: policy.department,
          },
        });
        totalEntries++;
        console.log(`  ✓ Added: ${policy.title}`);
      } catch (error) {
        console.error(`  ✗ Failed for policy ${policy.title}:`, error.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // ==========================================
    // 3. Generate embeddings for Tariffs
    // ==========================================
    console.log("\n💰 Processing Tariffs...");
    const tariffs = await prisma.tariff.findMany();

    for (const tariff of tariffs) {
      const content = `
    Tariff: ${tariff.name}
    Department: ${tariff.department}
    Description: ${tariff.description || ""}
    Rate: ${tariff.rate} ${tariff.unit}
    Category: ${tariff.category || "N/A"}
    Effective From: ${tariff.effectiveFrom ? tariff.effectiveFrom.toDateString() : "N/A"}
      `.trim();

      try {
        const embedding = await generateEmbedding(content);
        await prisma.knowledgeBase.create({
          data: {
            category: "tariff",
            title: tariff.name,
            content: content,
            metadata: {
              tariffId: tariff.id,
              department: tariff.department,
              rate: tariff.rate,
              unit: tariff.unit,
            },
            embedding: serializeEmbedding(embedding),
            department: tariff.department,
          },
        });
        totalEntries++;
        console.log(`  ✓ Added: ${tariff.name}`);
      } catch (error) {
        console.error(`  ✗ Failed for tariff ${tariff.name}:`, error.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // ==========================================
    // 4. Add Common FAQs
    // ==========================================
    console.log("\n❓ Adding Common FAQs...");
    const faqs = [
      {
        title: "How to pay my electricity bill",
        content:
          "To pay your electricity bill, navigate to the Bills section from the dashboard. Select your electricity service account, view the bill details, and click on Pay Now. You can pay using various methods including UPI, net banking, or credit/debit card.",
        category: "faq",
        department: "ELECTRICITY",
      },
      {
        title: "How to apply for a new water connection",
        content:
          "To apply for a new water connection: 1) Go to Dashboard 2) Click on 'New Application' 3) Select WATER department 4) Choose 'New Connection' service 5) Fill in your details including address and property information 6) Upload required documents (proof of address, property documents) 7) Submit application and pay the application fee.",
        category: "faq",
        department: "WATER",
      },
      {
        title: "How to book a gas cylinder refill",
        content:
          "To book a gas cylinder refill: 1) Go to Dashboard 2) Click on your gas service account 3) Select 'Book Refill' 4) Confirm your address and delivery preferences 5) Submit the request. You will receive a confirmation with estimated delivery date.",
        category: "faq",
        department: "GAS",
      },
      {
        title: "How to file a grievance",
        content:
          "To file a grievance: 1) Navigate to Grievances section 2) Click on 'File New Grievance' 3) Select the department and issue category 4) Provide detailed description of your issue 5) Attach any supporting documents or photos 6) Submit. You will receive a ticket number to track your grievance status.",
        category: "faq",
        department: "MUNICIPAL",
      },
      {
        title: "How to check my application status",
        content:
          "To check your application status: 1) Go to 'My Applications' from the dashboard 2) You will see all your submitted applications with their current status 3) Click on any application to view detailed status, timeline, and any remarks from officials 4) You will also receive notifications for status updates.",
        category: "faq",
        department: "MUNICIPAL",
      },
      {
        title: "What documents are needed for scheme applications",
        content:
          "Required documents vary by scheme but commonly include: 1) Aadhaar card 2) Income certificate 3) Ration card 4) Bank account details 5) Address proof 6) Caste certificate (if applicable) 7) Property documents (for housing schemes). Check the specific scheme details for exact requirements.",
        category: "faq",
        department: "MUNICIPAL",
      },
      {
        title: "How to update my profile information",
        content:
          "To update your profile: 1) Go to Profile section from the menu 2) Click on 'Edit Profile' 3) Update your details like email, address, etc. 4) Save changes. Note: Mobile number and Aadhaar details cannot be changed through the portal for security reasons.",
        category: "faq",
        department: "MUNICIPAL",
      },
    ];

    for (const faq of faqs) {
      try {
        const embedding = await generateEmbedding(faq.content);
        await prisma.knowledgeBase.create({
          data: {
            category: faq.category,
            title: faq.title,
            content: faq.content,
            metadata: {
              type: "faq",
            },
            embedding: serializeEmbedding(embedding),
            department: faq.department,
          },
        });
        totalEntries++;
        console.log(`  ✓ Added: ${faq.title}`);
      } catch (error) {
        console.error(`  ✗ Failed for FAQ ${faq.title}:`, error.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // ==========================================
    // 5. Add Service Information
    // ==========================================
    console.log("\n🏢 Adding Service Information...");
    const services = [
      {
        title: "Bill Payment Services",
        content:
          "The Suvidha portal allows citizens to pay bills for various services including electricity, water, gas, and municipal services. Bills are generated monthly and can be paid online through multiple payment methods. Citizens receive notifications before due dates and can view payment history.",
        category: "service",
        department: "MUNICIPAL",
      },
      {
        title: "Application Services",
        content:
          "Citizens can submit various applications through the portal including new connections, load changes, name changes, connection removals, and scheme applications. Each application requires specific documents and goes through a defined workflow with status updates at each stage.",
        category: "service",
        department: "MUNICIPAL",
      },
      {
        title: "Grievance Redressal System",
        content:
          "The grievance redressal system allows citizens to report issues and complaints related to any department. Each grievance is assigned a unique ticket number, tracked through resolution, and citizens are notified of updates. Target resolution time varies by issue category.",
        category: "service",
        department: "MUNICIPAL",
      },
    ];

    for (const service of services) {
      try {
        const embedding = await generateEmbedding(service.content);
        await prisma.knowledgeBase.create({
          data: {
            category: service.category,
            title: service.title,
            content: service.content,
            metadata: {
              type: "service_info",
            },
            embedding: serializeEmbedding(embedding),
            department: service.department,
          },
        });
        totalEntries++;
        console.log(`  ✓ Added: ${service.title}`);
      } catch (error) {
        console.error(
          `  ✗ Failed for service ${service.title}:`,
          error.message,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`\n✅ Knowledge base generation completed!`);
    console.log(`📊 Total entries created: ${totalEntries}`);
    console.log(`   - Schemes: ${schemes.length}`);
    console.log(`   - Policies: ${policies.length}`);
    console.log(`   - Tariffs: ${tariffs.length}`);
    console.log(`   - FAQs: ${faqs.length}`);
    console.log(`   - Services: ${services.length}`);
  } catch (error) {
    console.error("\n❌ Error generating knowledge base:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateKnowledgeBase()
    .then(() => {
      console.log("\n🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { generateKnowledgeBase };
