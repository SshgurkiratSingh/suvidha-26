const axios = require("axios");
const { buildGlobalContext } = require("../utils/ai/contextBuilder");

// A simple in-memory cache for the context
let globalContextCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

/**
 * MOCK VECTOR RETRIEVAL
 * In a real production environment, this would call AWS Bedrock Retrieve API
 * or an Amazon OpenSearch Vector store.
 *
 * Since we don't have AWS credentials for a real vector store, we simulate
 * the RAG process by fetching the built context (which represents our "Knowledge Base")
 * and ideally searching it.
 */
const retrieveContextFromVectorStore = async (query) => {
  const KNOWLEDGE_BASE_ID = process.env.AWS_KNOWLEDGE_BASE_ID;

  // 1. If Real AWS Knowledge Base ID is defined, try to use it (Stubbed)
  if (KNOWLEDGE_BASE_ID) {
    console.log(
      `[AI AGENT] Retrieving from AWS Knowledge Base: ${KNOWLEDGE_BASE_ID}`,
    );
    // Code to call Bedrock Agent Runtime would go here.
    // return await bedrockAgentRuntime.retrieve({ ... });
  }

  // 2. Fallback: Use our "Global Context" which contains all site info
  return await getCachedContext();
};

const getCachedContext = async () => {
  const now = Date.now();
  if (!globalContextCache || now - lastCacheTime > CACHE_TTL) {
    console.log("[AI AGENT] Refreshing Global Context/Vector Cache...");
    globalContextCache = await buildGlobalContext();
    lastCacheTime = now;
  }
  return globalContextCache;
};

const callBedrockLLM = async (prompt, context = "") => {
  const token = os.env.AWS_BEARER_TOKEN_BEDROCK;
  if (!token) {
    // Graceful fallback for demo if token is missing
    console.warn("AWS_BEARER_TOKEN_BEDROCK missing. Returning mock response.");
    return "I am Suvidha AI. I strictly rely on AWS Bedrock, but it seems I am not configured correctly on the backend yet.";
  }

  const bedrockEndpoint =
    process.env.AWS_BEDROCK_ENDPOINT ||
    "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2/invoke";

  try {
    const fullPrompt = `Context:\n${context}\n\nQuestion: ${prompt}`;

    const body = {
      prompt: `\n\nHuman: ${fullPrompt}\n\nAssistant:`,
      max_tokens_to_sample: 1000,
      temperature: 0.7,
      top_p: 0.9,
    };

    const response = await axios.post(bedrockEndpoint, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data.completion || response.data;
  } catch (error) {
    console.error("LLM Call Failed:", error.response?.data || error.message);
    // Graceful fallback
    return "I am currently unable to connect to the AI model. Please check the backend configuration.";
  }
};

/**
 * Advanced Chat Handler that orchestrates Tools + Vector Context
 */
const handleChatInteraction = async (userMessage, citizenId) => {
  const { TOOL_DEFINITIONS, executeTool } = require("../utils/ai/tools");

  // 1. Retrieve Context (Simulating AWS Vector Search)
  const systemContext = await retrieveContextFromVectorStore(userMessage);

  const instructions = `
You are 'Suvidha AI', a helpful assistant for a Smart City portal.
You have access to the following public information (Knowledge Base):
${systemContext}

You also have access to the following tools to fetch private user data. 
ONLY use these if the user explicitly asks for their personal info (bills, applications, grievances).
TOOLS: ${JSON.stringify(TOOL_DEFINITIONS)}

INSTRUCTIONS:
1. If the user asks general questions, answer based on the Knowledge Base context.
2. If the user asks for personal data (e.g. "show my bills"), you must output a JSON object EXACTLY like this:
   {"tool": "tool_name_here"}
   Do not add any other text if you are calling a tool.
3. If you don't need a tool, just answer normally.
`;

  // First Call
  const initialResponse = await callBedrockLLM(userMessage, instructions);

  // Check for Tool Call
  try {
    const cleanResponse = initialResponse.trim();
    // Sometimes LLM wraps JSON in markdown blocks
    const jsonMatch = cleanResponse.match(/\{.*"tool":.*"(.+?)".*\}/s);

    if (
      jsonMatch ||
      (cleanResponse.startsWith("{") && cleanResponse.includes("tool"))
    ) {
      let toolCall;
      if (jsonMatch) {
        try {
          toolCall = JSON.parse(jsonMatch[0]);
        } catch (e) {}
      } else {
        try {
          toolCall = JSON.parse(cleanResponse);
        } catch (e) {}
      }

      if (toolCall && toolCall.tool) {
        console.log(`[AI AGENT] Executing Tool: ${toolCall.tool}`);
        const toolResult = await executeTool(toolCall.tool, citizenId);

        // Follow-up Call with Data
        const followUpContext = `
${instructions}
---
USER ASKED: ${userMessage}
SYSTEM TOOL EXECUTED: ${toolCall.tool}
TOOL RESULT: ${toolResult}
---
Now answer the user's question based on this data.
`;
        return await callBedrockLLM(
          "Summarize this for the user.",
          followUpContext,
        );
      }
    }
  } catch (e) {
    console.error("Error parsing tool call", e);
  }

  return initialResponse;
};

module.exports = { callBedrockLLM, handleChatInteraction };
