const { prisma } = require("../src/prisma");

const schemesWithEligibility = [
  {
    title: "Jal Jeevan Mission",
    department: "WATER",
    description:
      "Provide safe tap water (FHTC) to every rural household; ensures safe and regular drinking water.",
    eligibility: "Rural households without tap connection",
    eligibilityCriteria: [
      {
        questionText: "Is your household located in a rural area?",
        questionType: "YES_NO",
        isRequired: true,
        helpText:
          "Rural areas include villages and areas outside municipal corporation limits",
        weightage: 30,
        order: 1,
      },
      {
        questionText:
          "Does your household already have a functional tap water connection?",
        questionType: "YES_NO",
        isRequired: true,
        helpText:
          "Select 'No' if you don't have tap water or if the existing connection is non-functional",
        weightage: 40,
        order: 2,
      },
      {
        questionText: "What is your household's annual income?",
        questionType: "SINGLE_CHOICE",
        options: [
          "Below ₹1 lakh",
          "₹1-3 lakhs",
          "₹3-5 lakhs",
          "Above ₹5 lakhs",
        ],
        isRequired: true,
        weightage: 20,
        order: 3,
      },
      {
        questionText: "Number of family members",
        questionType: "NUMBER",
        isRequired: true,
        helpText: "Enter the total number of people living in your household",
        validationRules: { min: 1, max: 20 },
        weightage: 10,
        order: 4,
      },
    ],
    requiredDocuments: [
      {
        documentName: "Aadhaar Card",
        description: "Aadhaar card of the household head",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 1,
      },
      {
        documentName: "Residence Proof",
        description:
          "Proof of residence in rural area (Ration card/Voter ID/Electricity bill)",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 2,
      },
      {
        documentName: "Income Certificate",
        description: "Income certificate from competent authority",
        isMandatory: false,
        acceptedFormats: ["pdf"],
        maxSizeKB: 2048,
        order: 3,
      },
    ],
  },
  {
    title: "PM Kisan Samman Nidhi",
    department: "MUNICIPAL",
    description:
      "Direct income support of ₹6,000 per year to all farmer families with cultivable land holding",
    eligibility: "Small and marginal farmers with cultivable land",
    eligibilityCriteria: [
      {
        questionText: "Do you own agricultural land?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "You must own or cultivate agricultural land to be eligible",
        weightage: 40,
        order: 1,
      },
      {
        questionText: "What is your total land holding?",
        questionType: "SINGLE_CHOICE",
        options: [
          "Less than 1 hectare",
          "1-2 hectares",
          "2-5 hectares",
          "More than 5 hectares",
        ],
        isRequired: true,
        weightage: 30,
        order: 2,
      },
      {
        questionText:
          "Are you a beneficiary of any other farmer welfare scheme?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "This will not disqualify you, but helps us track benefits",
        weightage: 10,
        order: 3,
      },
      {
        questionText: "Do you have a valid bank account in your name?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "Bank account is mandatory for direct benefit transfer",
        weightage: 20,
        order: 4,
      },
    ],
    requiredDocuments: [
      {
        documentName: "Land Records",
        description: "Land ownership documents (Khata/Khasra/7/12 extract)",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 3072,
        order: 1,
      },
      {
        documentName: "Aadhaar Card",
        description: "Aadhaar card of the applicant",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 2,
      },
      {
        documentName: "Bank Passbook",
        description: "First page of bank passbook with account details",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 3,
      },
    ],
  },
  {
    title: "PM Ujjwala Yojana",
    department: "GAS",
    description:
      "Free LPG connection to BPL households for clean cooking fuel and better health",
    eligibility:
      "BPL families, especially women from disadvantaged communities",
    eligibilityCriteria: [
      {
        questionText: "Do you belong to a Below Poverty Line (BPL) family?",
        questionType: "YES_NO",
        isRequired: true,
        helpText:
          "You must have a valid BPL card or be from priority household category",
        weightage: 40,
        order: 1,
      },
      {
        questionText:
          "Does any member of your household already have an LPG connection?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "Select 'No' to be eligible for a new connection",
        weightage: 30,
        order: 2,
      },
      {
        questionText: "What is your gender?",
        questionType: "SINGLE_CHOICE",
        options: ["Female", "Male", "Other"],
        isRequired: true,
        helpText: "Preference is given to women applicants",
        weightage: 15,
        order: 3,
      },
      {
        questionText: "Do you belong to any of these categories?",
        questionType: "SINGLE_CHOICE",
        options: [
          "SC/ST",
          "Pradhan Mantri Awas Yojana beneficiary",
          "Antyodaya Anna Yojana",
          "Forest dwellers",
          "Island dwellers",
          "River island dwellers",
          "None of the above",
        ],
        isRequired: true,
        weightage: 15,
        order: 4,
      },
    ],
    requiredDocuments: [
      {
        documentName: "BPL Card/SECC List",
        description: "BPL card or proof of inclusion in SECC-2011 list",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 1,
      },
      {
        documentName: "Aadhaar Card",
        description: "Aadhaar card of the applicant (preferably female member)",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 2,
      },
      {
        documentName: "Address Proof",
        description:
          "Current address proof (Ration card/Voter ID/Electricity bill)",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 3,
      },
      {
        documentName: "Bank Account Details",
        description: "Bank passbook or cancelled cheque",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 4,
      },
    ],
  },
  {
    title: "Pradhan Mantri Awas Yojana - Gramin",
    department: "MUNICIPAL",
    description:
      "Financial assistance for construction of pucca house with basic amenities to houseless and kutcha house holders in rural areas",
    eligibility: "Houseless or kutcha house dwellers in rural areas",
    eligibilityCriteria: [
      {
        questionText: "Do you currently own a pucca (permanent) house?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "Select 'No' if you live in kutcha house or are houseless",
        weightage: 40,
        order: 1,
      },
      {
        questionText: "What is your current housing condition?",
        questionType: "SINGLE_CHOICE",
        options: [
          "Houseless",
          "Kutcha house",
          "Semi-pucca house",
          "Pucca house",
        ],
        isRequired: true,
        weightage: 30,
        order: 2,
      },
      {
        questionText: "Is your household location in rural area?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "This scheme is only for rural areas",
        weightage: 20,
        order: 3,
      },
      {
        questionText: "What is your annual household income?",
        questionType: "SINGLE_CHOICE",
        options: [
          "Below ₹1 lakh",
          "₹1-2 lakhs",
          "₹2-3 lakhs",
          "Above ₹3 lakhs",
        ],
        isRequired: true,
        weightage: 10,
        order: 4,
      },
    ],
    requiredDocuments: [
      {
        documentName: "Aadhaar Card",
        description: "Aadhaar card of all adult family members",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 3072,
        order: 1,
      },
      {
        documentName: "SECC Data",
        description: "Proof of inclusion in SECC-2011 data",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 2,
      },
      {
        documentName: "Bank Account Passbook",
        description: "Bank account details with IFSC code",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 3,
      },
      {
        documentName: "Land Documents",
        description: "Proof of land ownership or Gram Panchayat certificate",
        isMandatory: false,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 3072,
        order: 4,
      },
    ],
  },
  {
    title: "Ayushman Bharat - PM-JAY",
    department: "SANITATION",
    description:
      "Health insurance cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization",
    eligibility: "Economically vulnerable families as per SECC database",
    eligibilityCriteria: [
      {
        questionText: "Is your family listed in the SECC-2011 database?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "You must be part of SECC database to be eligible",
        weightage: 50,
        order: 1,
      },
      {
        questionText: "Does your family meet any of these criteria?",
        questionType: "MULTIPLE_CHOICE",
        options: [
          "Only one room with kucha walls and roof",
          "No adult member between age 16 to 59",
          "Female headed household with no adult male member",
          "Disabled member with no other able bodied member",
          "SC/ST household",
          "Landless household deriving income from manual casual labour",
        ],
        isRequired: true,
        weightage: 30,
        order: 2,
      },
      {
        questionText:
          "Do you already have health insurance coverage above ₹5 lakhs?",
        questionType: "YES_NO",
        isRequired: true,
        helpText: "This scheme is for those without adequate health coverage",
        weightage: 20,
        order: 3,
      },
    ],
    requiredDocuments: [
      {
        documentName: "Aadhaar Card",
        description: "Aadhaar cards of all family members",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 3072,
        order: 1,
      },
      {
        documentName: "Ration Card",
        description: "Family ration card",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 2048,
        order: 2,
      },
      {
        documentName: "Income Certificate",
        description: "Income certificate or BPL certificate",
        isMandatory: false,
        acceptedFormats: ["pdf"],
        maxSizeKB: 2048,
        order: 3,
      },
      {
        documentName: "Mobile Number Proof",
        description: "Mobile number linked to Aadhaar for OTP verification",
        isMandatory: true,
        acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxSizeKB: 1024,
        order: 4,
      },
    ],
  },
];

async function main() {
  console.log("Starting scheme seeding with eligibility criteria...");

  // Delete existing schemes and related data
  console.log("Deleting existing schemes and related data...");
  await prisma.schemeApplicationDocument.deleteMany({});
  await prisma.schemeApplication.deleteMany({});
  await prisma.schemeRequiredDocument.deleteMany({});
  await prisma.schemeEligibilityCriteria.deleteMany({});
  await prisma.publicScheme.deleteMany({});

  console.log("Existing schemes deleted.");

  // Create new schemes with eligibility criteria
  for (const schemeData of schemesWithEligibility) {
    console.log(`Creating scheme: ${schemeData.title}...`);

    const { eligibilityCriteria, requiredDocuments, ...schemeInfo } =
      schemeData;

    const scheme = await prisma.publicScheme.create({
      data: {
        ...schemeInfo,
        eligibilityCriteria: {
          create: eligibilityCriteria,
        },
        requiredDocuments: {
          create: requiredDocuments,
        },
      },
      include: {
        eligibilityCriteria: true,
        requiredDocuments: true,
      },
    });

    console.log(`✓ Created: ${scheme.title}`);
    console.log(
      `  - ${scheme.eligibilityCriteria.length} eligibility questions`,
    );
    console.log(`  - ${scheme.requiredDocuments.length} required documents`);
  }

  console.log(
    "\n✅ All schemes created successfully with eligibility criteria!",
  );
}

main()
  .catch((e) => {
    console.error("Error seeding schemes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
