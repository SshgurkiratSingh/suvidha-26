const { Department, ServiceType } = require("@prisma/client");

const servicesCatalog = {
  [Department.ELECTRICITY]: [
    {
      serviceType: ServiceType.BILL_PAYMENT,
      requiredDocuments: ["Previous bill copy", "Consumer ID"],
      fees: 0,
    },
    {
      serviceType: ServiceType.NEW_CONNECTION,
      requiredDocuments: ["ID proof", "Address proof"],
      fees: 250,
    },
    {
      serviceType: ServiceType.LOAD_CHANGE,
      requiredDocuments: ["Existing connection proof"],
      fees: 100,
    },
  ],
  [Department.GAS]: [
    {
      serviceType: ServiceType.BILL_PAYMENT,
      requiredDocuments: ["Consumer ID"],
      fees: 0,
    },
    {
      serviceType: ServiceType.REFILL,
      requiredDocuments: ["LPG consumer ID"],
      fees: 50,
    },
  ],
  [Department.WATER]: [
    {
      serviceType: ServiceType.BILL_PAYMENT,
      requiredDocuments: ["Consumer ID"],
      fees: 0,
    },
    {
      serviceType: ServiceType.NEW_CONNECTION,
      requiredDocuments: ["ID proof", "Address proof"],
      fees: 200,
    },
    {
      serviceType: ServiceType.WATER_QUALITY_TEST,
      requiredDocuments: ["Address proof"],
      fees: 150,
    },
  ],
  [Department.SANITATION]: [
    {
      serviceType: ServiceType.GRIEVANCE,
      requiredDocuments: ["Photo evidence"],
      fees: 0,
    },
  ],
  [Department.MUNICIPAL]: [
    {
      serviceType: ServiceType.SCHEME_APPLICATION,
      requiredDocuments: ["ID proof", "Income certificate"],
      fees: 0,
    },
  ],
};

const tariffsCatalog = {
  [Department.GAS]: {
    unitRate: 32,
    fixedCharge: 120,
    notes: "Rates may vary per slab.",
  },
  [Department.ELECTRICITY]: {
    unitRate: 7.2,
    fixedCharge: 75,
    notes: "Domestic tariff snapshot.",
  },
  [Department.WATER]: {
    unitRate: 18,
    fixedCharge: 40,
    notes: "Urban residential tariff.",
  },
};

const policiesCatalog = {
  [Department.WATER]: [
    "Rainwater harvesting mandatory for new buildings.",
    "Water quality tests available on demand.",
  ],
  [Department.GAS]: ["Annual safety inspection recommended."],
  [Department.ELECTRICITY]: ["Subsidy for solar rooftop installations."],
};

module.exports = {
  servicesCatalog,
  tariffsCatalog,
  policiesCatalog,
};
