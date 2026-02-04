const { handleChatInteraction } = require("../src/services/llm");
const { prisma } = require("../src/prisma");

// Mock Citizen ID (Make sure user exists or use a dummy)
// For this test, we need a valid citizen ID if potential tools are called.
// If the LLM doesn't call a tool, any ID works.

async function testAI() {
  console.log("--- STARTING AI FLOW TEST ---");

  // 1. Test General Knowledge (Vector Context)
  console.log("\n\nTest 1: General Question (Knowledge Base)");
  try {
    const q1 = "What are the electricity tariffs?";
    const ans1 = await handleChatInteraction(q1, "dummy-citizen-id");
    console.log(`Q: ${q1}`);
    console.log(`A: ${ans1}`);
  } catch (e) {
    console.error("Test 1 Failed:", e.message);
  }

  // 2. Test Tool Invocation (Needs a real user preferably, but we'll see if it tries to call it)
  // We expect the LLM to output a JSON tool call if configured correctly,
  // or a text asking for ID if it's smart.
  console.log("\n\nTest 2: Personal Question (Tool Trigger)");
  try {
    const q2 = "Show me my recent grievances";
    // We pass a dummy ID.
    // If the tool execution fails due to DB, we'll see the error in the tool output.
    const ans2 = await handleChatInteraction(q2, "dummy-citizen-id");
    console.log(`Q: ${q2}`);
    console.log(`A: ${ans2}`);
  } catch (e) {
    console.error("Test 2 Failed:", e.message);
  }

  console.log("\n--- TEST COMPLETE ---");
  process.exit(0);
}

testAI();
