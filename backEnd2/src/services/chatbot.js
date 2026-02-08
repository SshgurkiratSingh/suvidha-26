const axios = require("axios");
const { PaymentStatus, ApplicationStatus } = require("@prisma/client");
const { prisma } = require("../prisma");
const {
  generateEmbedding,
  findSimilarEntries,
  deserializeEmbedding,
} = require("./embedding");

/**
 * Suvidha AI Assistant - Chatbot Service
 * Provides conversational AI with RAG, function calling, and context awareness
 */

// Function definitions for the AI assistant
const ASSISTANT_FUNCTIONS = [
  {
    name: "get_user_profile",
    description:
      "Get the user's profile information including name, contact details, and registered service accounts",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_bills",
    description:
      "Get the user's bills for all service accounts or a specific department. Can filter by paid/unpaid status.",
    parameters: {
      type: "object",
      properties: {
        department: {
          type: "string",
          enum: ["ELECTRICITY", "WATER", "GAS", "SANITATION", "MUNICIPAL"],
          description: "Filter bills by department (optional)",
        },
        isPaid: {
          type: "boolean",
          description:
            "Filter by payment status: true for paid bills, false for unpaid (optional)",
        },
      },
    },
  },
  {
    name: "get_user_applications",
    description:
      "Get the user's submitted applications and their status. Can filter by department or status.",
    parameters: {
      type: "object",
      properties: {
        department: {
          type: "string",
          enum: ["ELECTRICITY", "WATER", "GAS", "SANITATION", "MUNICIPAL"],
          description: "Filter applications by department (optional)",
        },
        status: {
          type: "string",
          enum: [
            "SUBMITTED",
            "UNDER_PROCESS",
            "APPROVED",
            "REJECTED",
            "COMPLETED",
          ],
          description: "Filter by application status (optional)",
        },
      },
    },
  },
  {
    name: "get_scheme_applications",
    description:
      "Get the user's scheme applications and their status. Can filter by status.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "DRAFT",
            "SUBMITTED",
            "UNDER_REVIEW",
            "DOCUMENTS_REQUIRED",
            "APPROVED",
            "REJECTED",
          ],
          description: "Filter by scheme application status (optional)",
        },
      },
    },
  },
  {
    name: "get_user_grievances",
    description:
      "Get the user's filed grievances and their resolution status",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"],
          description: "Filter by grievance status (optional)",
        },
      },
    },
  },
  {
    name: "create_grievance",
    description:
      "File a new grievance/complaint on behalf of the user. Requires department and description.",
    parameters: {
      type: "object",
      properties: {
        department: {
          type: "string",
          enum: ["ELECTRICITY", "WATER", "GAS", "SANITATION", "MUNICIPAL"],
          description: "Department for the grievance",
        },
        description: {
          type: "string",
          description: "Detailed description of the grievance",
        },
      },
      required: ["department", "description"],
    },
  },
  {
    name: "get_scheme_details",
    description:
      "Get detailed information about a specific government scheme including eligibility criteria and benefits",
    parameters: {
      type: "object",
      properties: {
        schemeName: {
          type: "string",
          description: "Name or partial name of the scheme to search for",
        },
      },
      required: ["schemeName"],
    },
  },
  {
    name: "check_scheme_eligibility",
    description:
      "Check if the user is eligible for a specific scheme based on their profile",
    parameters: {
      type: "object",
      properties: {
        schemeId: {
          type: "string",
          description: "ID of the scheme to check eligibility for",
        },
      },
      required: ["schemeId"],
    },
  },
  {
    name: "pay_bill",
    description:
      "Pay a single unpaid bill for the user. This will mark the bill as paid and create a payment record.",
    parameters: {
      type: "object",
      properties: {
        billId: {
          type: "string",
          description: "Bill ID to pay",
        },
      },
      required: ["billId"],
    },
  },
  {
    name: "bulk_pay_bills",
    description:
      "Pay multiple unpaid bills for the user in a single action.",
    parameters: {
      type: "object",
      properties: {
        billIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of bill IDs to pay",
        },
      },
      required: ["billIds"],
    },
  },
  {
    name: "navigate_to_page",
    description:
      "Navigate the user to a specific page in the application. Use this when user asks to go somewhere or wants to perform an action that requires a specific page.",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: [
            "login",
            "dashboard",
            "profile",
            "all-bills",
            "all-usage",
            "my-applications",
            "grievances",
            "schemes",
            "policies",
            "tariffs",
            "track-status",
            "scheme-detail",
            "scheme-apply",
          ],
          description: "The page to navigate to",
        },
        params: {
          type: "object",
          description:
            "Optional parameters for the page (e.g., scheme ID, application ID)",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the knowledge base for information about schemes, policies, procedures, and FAQs. Use this for general queries about services.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The query to search for in the knowledge base",
        },
        category: {
          type: "string",
          enum: ["scheme", "policy", "tariff", "faq", "service"],
          description: "Category to filter search results (optional)",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Execute a function call from the AI assistant
 */
async function executeFunctionCall(functionName, args, citizenId) {
  try {
    if (!citizenId && [
      "get_user_profile",
      "get_user_bills",
      "get_user_applications",
      "get_scheme_applications",
      "get_user_grievances",
      "create_grievance",
      "check_scheme_eligibility",
      "pay_bill",
      "bulk_pay_bills",
    ].includes(functionName)) {
      return {
        action: "navigate",
        page: "login",
        message: "Please log in to continue.",
      };
    }

    console.log(
      `Executing function: ${functionName} with args:`,
      JSON.stringify(args),
    );

    switch (functionName) {
      case "get_user_profile":
        return await getUserProfile(citizenId);

      case "get_user_bills":
        return await getUserBills(citizenId, args.department, args.isPaid);

      case "get_user_applications":
        return await getUserApplications(
          citizenId,
          args.department,
          args.status,
        );

      case "get_scheme_applications":
        return await getSchemeApplications(citizenId, args.status);

      case "get_user_grievances":
        return await getUserGrievances(citizenId, args.status);

      case "create_grievance":
        return await createGrievance(citizenId, args.department, args.description);

      case "get_scheme_details":
        return await getSchemeDetails(args.schemeName);

      case "check_scheme_eligibility":
        return await checkSchemeEligibility(citizenId, args.schemeId);

      case "pay_bill":
        return await payBill(citizenId, args.billId);

      case "bulk_pay_bills":
        return await bulkPayBills(citizenId, args.billIds);

      case "navigate_to_page":
        return {
          action: "navigate",
          page: args.page,
          params: args.params || {},
        };

      case "search_knowledge_base":
        return await searchKnowledgeBase(args.query, args.category);

      default:
        return { error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return { error: error.message };
  }
}

// Function implementations

async function getUserProfile(citizenId) {
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
    include: {
      citizenProfile: true,
      serviceAccounts: {
        include: {
          bills: {
            where: { isPaid: false },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!citizen) {
    return { error: "User profile not found" };
  }

  return {
    name: citizen.fullName,
    mobile: citizen.mobileNumber,
    email: citizen.email,
    profile: citizen.citizenProfile,
    serviceAccounts: citizen.serviceAccounts.map((acc) => ({
      department: acc.department,
      consumerId: acc.consumerId,
      address: acc.address,
      nextBillDue: acc.bills[0]
        ? {
            amount: acc.bills[0].amount,
            dueDate: acc.bills[0].dueDate,
          }
        : null,
    })),
  };
}

async function getUserBills(citizenId, department, isPaid) {
  const where = {
    serviceAccount: {
      citizenId: citizenId,
    },
  };

  if (department) {
    where.serviceAccount.department = department;
  }

  if (isPaid !== undefined) {
    where.isPaid = isPaid;
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      serviceAccount: true,
    },
    orderBy: { dueDate: "desc" },
    take: 10,
  });

  return {
    bills: bills.map((bill) => ({
      id: bill.id,
      department: bill.serviceAccount.department,
      consumerId: bill.serviceAccount.consumerId,
      amount: bill.amount,
      dueDate: bill.dueDate,
      isPaid: bill.isPaid,
    })),
    totalUnpaid: bills.filter((b) => !b.isPaid).length,
    totalAmount: bills
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0),
  };
}

async function getUserApplications(citizenId, department, status) {
  const where = { citizenId };

  if (department) {
    where.department = department;
  }

  if (status) {
    where.status = status;
  }

  const applications = await prisma.application.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: 10,
  });

  return {
    applications: applications.map((app) => ({
      id: app.id,
      department: app.department,
      serviceType: app.serviceType,
      status: app.status,
      submittedAt: app.submittedAt,
    })),
    total: applications.length,
  };
}

async function getSchemeApplications(citizenId, status) {
  const where = { citizenId };

  if (status) {
    where.status = status;
  }

  const applications = await prisma.schemeApplication.findMany({
    where,
    include: {
      scheme: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    applications: applications.map((app) => ({
      id: app.id,
      schemeId: app.schemeId,
      schemeTitle: app.scheme?.title,
      status: app.status,
      submittedAt: app.submittedAt,
    })),
    total: applications.length,
  };
}

async function getUserGrievances(citizenId, status) {
  const where = { citizenId };

  if (status) {
    where.status = status;
  }

  const grievances = await prisma.grievance.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    grievances: grievances.map((g) => ({
      id: g.id,
      department: g.department,
      category: g.category,
      description: g.description,
      status: g.status,
      createdAt: g.createdAt,
    })),
    total: grievances.length,
  };
}

async function createGrievance(citizenId, department, description) {
  if (!department || !description) {
    return { error: "Department and description are required." };
  }

  const grievance = await prisma.grievance.create({
    data: {
      citizenId,
      department,
      description,
      status: ApplicationStatus.SUBMITTED,
    },
  });

  return {
    message: "Grievance filed successfully",
    grievance: {
      id: grievance.id,
      department: grievance.department,
      status: grievance.status,
      createdAt: grievance.createdAt,
    },
  };
}

async function getSchemeDetails(schemeName) {
  const schemes = await prisma.publicScheme.findMany({
    where: {
      title: {
        contains: schemeName,
        mode: "insensitive",
      },
    },
    include: {
      eligibilityCriteria: true,
      requiredDocuments: true,
    },
    take: 3,
  });

  if (schemes.length === 0) {
    return { error: `No schemes found matching "${schemeName}"` };
  }

  return {
    schemes: schemes.map((s) => ({
      id: s.id,
      title: s.title,
      department: s.department,
      description: s.description,
      eligibility: s.eligibility,
      eligibilityCriteria: s.eligibilityCriteria.map((c) => c.questionText),
      requiredDocuments: s.requiredDocuments.map((d) => d.documentName),
    })),
  };
}

async function checkSchemeEligibility(citizenId, schemeId) {
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
    include: {
      citizenProfile: true,
    },
  });

  const scheme = await prisma.publicScheme.findUnique({
    where: { id: schemeId },
    include: {
      eligibilityCriteria: true,
    },
  });

  if (!scheme) {
    return { error: "Scheme not found" };
  }

  // Check if user has saved eligibility answers
  const savedAnswers = citizen.citizenProfile?.savedEligibilityAnswers || {};

  return {
    scheme: {
      id: scheme.id,
      title: scheme.title,
      department: scheme.department,
    },
    eligibilityCriteria: scheme.eligibilityCriteria.map((c) => ({
      question: c.questionText,
      type: c.questionType,
      options: c.options,
    })),
    hasSavedAnswers: Object.keys(savedAnswers).length > 0,
    recommendation:
      "Please answer the eligibility questions to check if you qualify for this scheme.",
  };
}

async function payBill(citizenId, billId) {
  if (!billId) {
    return { error: "billId is required." };
  }

  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      serviceAccount: { citizenId },
      isPaid: false,
    },
    include: { serviceAccount: true },
  });

  if (!bill) {
    return { error: "Bill not found, already paid, or not accessible." };
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        citizenId,
        billId: bill.id,
        amount: bill.amount,
        status: PaymentStatus.SUCCESS,
        receiptNo: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    await tx.bill.update({
      where: { id: bill.id },
      data: { isPaid: true },
    });

    return createdPayment;
  });

  return {
    message: "Payment successful",
    payment: {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      receiptNo: payment.receiptNo,
    },
    bill: {
      id: bill.id,
      department: bill.serviceAccount.department,
      amount: bill.amount,
    },
  };
}

async function bulkPayBills(citizenId, billIds) {
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
    return { error: "billIds array is required." };
  }

  const bills = await prisma.bill.findMany({
    where: {
      id: { in: billIds },
      serviceAccount: { citizenId },
      isPaid: false,
    },
    include: { serviceAccount: true },
  });

  if (bills.length !== billIds.length) {
    return {
      error:
        "Some bills are invalid, already paid, or do not belong to you.",
    };
  }

  const results = await prisma.$transaction(async (tx) => {
    const payments = [];
    for (const bill of bills) {
      const payment = await tx.payment.create({
        data: {
          citizenId,
          billId: bill.id,
          amount: bill.amount,
          status: PaymentStatus.SUCCESS,
          receiptNo: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      });

      await tx.bill.update({
        where: { id: bill.id },
        data: { isPaid: true },
      });

      payments.push(payment);
    }
    return payments;
  });

  return {
    message: "Bulk payment successful",
    count: results.length,
    totalAmount: results.reduce((sum, p) => sum + p.amount, 0),
    payments: results.map((p) => ({
      id: p.id,
      amount: p.amount,
      receiptNo: p.receiptNo,
      status: p.status,
    })),
  };
}

async function searchKnowledgeBase(query, category) {
  const where = { isActive: true };

  if (category) {
    where.category = category;
  }

  const kbEntries = await prisma.knowledgeBase.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      metadata: true,
      embedding: true,
      department: true,
    },
  });

  // Parse embeddings
  const entriesWithEmbeddings = kbEntries.map((entry) => ({
    ...entry,
    embedding: entry.embedding ? deserializeEmbedding(entry.embedding) : null,
  }));

  // Find similar entries using embedding similarity
  const similarEntries = await findSimilarEntries(
    query,
    entriesWithEmbeddings,
    5,
  );

  return {
    results: similarEntries.map((entry) => ({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      department: entry.department,
      relevanceScore: entry.similarity,
    })),
    totalResults: similarEntries.length,
  };
}

/**
 * Generate AI response using AWS Bedrock Claude
 */
async function generateAIResponse(
  messages,
  citizenId,
  useKnowledgeBase = true,
) {
  try {
    const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
    const endpoint = process.env.AWS_BEDROCK_ENDPOINT;
    const modelId = process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-v2";
    const fallbackModelId =
      process.env.AWS_BEDROCK_FALLBACK_MODEL_ID || "amazon.titan-text-express-v1";

    if (!token || !endpoint) {
      throw new Error("AWS Bedrock credentials not configured");
    }

    // Get the last user message for RAG
    const lastUserMessage = messages
      .filter((m) => m.role === "user")
      .pop()?.content;

    let contextFromKB = "";
    if (useKnowledgeBase && lastUserMessage) {
      // Search knowledge base for relevant context
      const kbResults = await searchKnowledgeBase(lastUserMessage);
      if (kbResults.results && kbResults.results.length > 0) {
        contextFromKB = "\n\nRelevant Information from Knowledge Base:\n";
        kbResults.results.forEach((result, idx) => {
          contextFromKB += `\n${idx + 1}. ${result.title}\n${result.content}\n(Relevance: ${(result.relevanceScore * 100).toFixed(1)}%)\n`;
        });
      }
    }

    // Build the system prompt
    const systemPrompt = `You are Suvidha AI Assistant, a helpful and knowledgeable assistant for the Suvidha Citizen Services Portal. You help citizens with:
- Information about government schemes, policies, and tariffs
- Checking bill payments and application status
- Filing grievances and tracking them
- Navigating the portal and completing tasks
- Answering questions about various municipal services

You have access to the user's data and can help them with personalized information. When needed, use the available functions to access user data or perform actions.

  Before executing any action that changes data (payments, filing grievances), confirm the user's intent explicitly.

Always be polite, professional, and helpful. Provide accurate information and guide users step by step when needed. If you're unsure about something, admit it and suggest alternatives.

${contextFromKB}`;

    // Prepare messages for Claude
    const claudeMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    // Use Titan Text as the default model (Claude access pending approval)
    const titanInvokeUrl = endpoint.includes("/model/")
      ? endpoint
      : `${endpoint}/model/${fallbackModelId}/invoke`;

    console.log("Using Titan Text model:", fallbackModelId);

    // Build prompt for Titan with conversation history
    const promptText = `${systemPrompt}\n\nConversation History:\n${messages.map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n')}\n\nAssistant:`;

    const titanBody = {
      inputText: promptText,
      textGenerationConfig: {
        maxTokenCount: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    };

    const response = await axios.post(titanInvokeUrl, titanBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "x-amz-bedrock-model-id": fallbackModelId,
      },
      timeout: 60000,
    });

    if (!response?.data) {
      throw new Error("Empty response from Bedrock API");
    }

    // Extract Titan Text response
    const content = response.data?.results?.[0]?.outputText || "I apologize, but I'm having trouble generating a response. Please try again.";
    
    return { content };

    // Note: Titan Text doesn't support function calling directly
    // Once Claude access is approved, you can switch back for advanced features like function calling
    
    /*
    // Claude code (requires approval):
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: claudeMessages,
      tools: ASSISTANT_FUNCTIONS.map((fn) => ({
        name: fn.name,
        description: fn.description,
        input_schema: fn.parameters,
      })),
    };

    const claudeInvokeUrl = endpoint.includes("/model/")
      ? endpoint
      : `${endpoint}/model/${modelId}/invoke`;

    const response = await axios.post(claudeInvokeUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-amz-bedrock-model-id": modelId,
      },
      timeout: 60000,
    });

    if (response.data.stop_reason === "tool_use") {
      const toolUse = response.data.content.find((c) => c.type === "tool_use");
      if (toolUse) {
        console.log("Claude requested function call:", toolUse.name);

        // Execute the function
        const functionResult = await executeFunctionCall(
          toolUse.name,
          toolUse.input,
          citizenId,
        );

        // If it's a navigation action, return immediately
        if (functionResult.action === "navigate") {
          return {
            content: `I'll help you navigate to ${functionResult.page}.`,
            functionCall: {
              name: toolUse.name,
              arguments: toolUse.input,
              result: functionResult,
            },
            requiresAction: true,
          };
        }

        // Add function result to conversation and get final response
        const messagesWithFunctionResult = [
          ...claudeMessages,
          {
            role: "assistant",
            content: response.data.content,
          },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify(functionResult),
              },
            ],
          },
        ];

        // Call again to get the final response with function results
        const finalRequestBody = {
          ...requestBody,
          messages: messagesWithFunctionResult,
        };

        const finalResponse = await axios.post(
          invokeUrl,
          finalRequestBody,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-amz-bedrock-model-id": modelId,
            },
            timeout: 60000,
          },
        );

        const textContent = finalResponse.data.content.find(
          (c) => c.type === "text",
        );

        return {
          content: textContent?.text || "I've retrieved the information.",
          functionCall: {
            name: toolUse.name,
            arguments: toolUse.input,
            result: functionResult,
          },
        };
      }
    }

    // Regular text response
    const textContent = response.data.content.find((c) => c.type === "text");
    return {
      content:
        textContent?.text || "I'm sorry, I couldn't generate a response.",
    };
    */
  } catch (error) {
    console.error("Error generating AI response:", error);
    if (error.response) {
      console.error("API Error:", error.response.data);
    }

    const lastUserMessage = messages
      .filter((m) => m.role === "user")
      .pop()?.content;

    const apiMessage = error.response?.data?.message || "";
    const isModelAccessIssue =
      error.response?.status === 404 &&
      apiMessage.toLowerCase().includes("use case details");

    if (lastUserMessage) {
      try {
        const kbResults = await searchKnowledgeBase(lastUserMessage);
        if (kbResults.results && kbResults.results.length > 0) {
          const top = kbResults.results.slice(0, 3);
          const summary = top
            .map((r, idx) => `${idx + 1}. ${r.title}\n${r.content}`)
            .join("\n\n");

          return {
            content:
              (isModelAccessIssue
                ? "I can’t access the AI model yet (model use case not approved). Here’s relevant information from the knowledge base:\n\n"
                : "Here’s relevant information from the knowledge base:\n\n") +
              summary,
          };
        }
      } catch (kbError) {
        console.error("Knowledge base fallback failed:", kbError);
      }
    }

    return {
      content:
        isModelAccessIssue
          ? "The AI model isn’t enabled for this account yet. Please complete the Bedrock model use case approval and try again."
          : "I’m having trouble reaching the AI model right now. Please try again in a moment.",
    };
  }
}

/**
 * Handle a chat message from user
 */
async function handleChatMessage(conversationId, userMessage, citizenId) {
  try {
    // Get or create conversation
    let conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.chatConversation.create({
        data: {
          id: conversationId,
          citizenId: citizenId || null,
          sessionId: conversationId,
          isAnonymous: !citizenId,
        },
        include: {
          messages: true,
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: userMessage,
      },
    });

    // Build message history for AI
    const messageHistory = [
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Generate AI response
    const aiResponse = await generateAIResponse(
      messageHistory,
      citizenId,
      true,
    );

    // Save assistant response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse.content,
        metadata: aiResponse.functionCall
          ? {
              functionCall: aiResponse.functionCall,
            }
          : undefined,
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return {
      messageId: assistantMessage.id,
      content: aiResponse.content,
      requiresAction: aiResponse.requiresAction,
      functionCall: aiResponse.functionCall,
    };
  } catch (error) {
    console.error("Error handling chat message:", error);
    throw error;
  }
}

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return conversation;
}

module.exports = {
  handleChatMessage,
  getConversationHistory,
  generateAIResponse,
  executeFunctionCall,
  ASSISTANT_FUNCTIONS,
};
