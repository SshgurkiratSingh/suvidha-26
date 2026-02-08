const express = require("express");
const router = express.Router();
const axios = require("axios");

/**
 * Test AWS Bedrock API Connection
 * GET /api/test/bedrock
 */
router.get("/bedrock", async (req, res, next) => {
  try {
    // Check for required environment variables
    const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
    const endpoint = process.env.AWS_BEDROCK_ENDPOINT;
    const region = process.env.AWS_REGION || "us-east-1";
    const modelId = process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-v2";

    console.log("=== AWS Bedrock Configuration Test ===");
    console.log("Token present:", !!token);
    console.log("Endpoint:", endpoint || "Not set (will use default)");
    console.log("Region:", region);
    console.log("Model ID:", modelId);

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "AWS_BEARER_TOKEN_BEDROCK not found in environment variables",
        message: "Please set AWS_BEARER_TOKEN_BEDROCK in your .env file",
        config: {
          tokenPresent: false,
          endpoint: endpoint || null,
          region: region,
          modelId: modelId,
        },
      });
    }

    // Construct the Bedrock endpoint
    const bedrockUrl =
      endpoint ||
      `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;

    console.log("Testing connection to:", bedrockUrl);

    // Test prompt
    const testPrompt = "Hello! Please respond with a brief greeting.";

    // Prepare the request body based on the model
    let requestBody;
    if (modelId.includes("claude")) {
      // Anthropic Claude format
      requestBody = {
        prompt: `\n\nHuman: ${testPrompt}\n\nAssistant:`,
        max_tokens_to_sample: 200,
        temperature: 0.7,
        top_p: 0.9,
      };
    } else if (modelId.includes("titan")) {
      // Amazon Titan format
      requestBody = {
        inputText: testPrompt,
        textGenerationConfig: {
          maxTokenCount: 200,
          temperature: 0.7,
          topP: 0.9,
        },
      };
    } else {
      // Generic format
      requestBody = {
        prompt: testPrompt,
        max_tokens: 200,
        temperature: 0.7,
      };
    }

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Make the API call
    const startTime = Date.now();
    const response = await axios.post(bedrockUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
    const responseTime = Date.now() - startTime;

    console.log("Response received in", responseTime, "ms");
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    // Extract the completion text based on model
    let completionText;
    if (response.data.completion) {
      completionText = response.data.completion;
    } else if (response.data.results && response.data.results[0]) {
      completionText = response.data.results[0].outputText;
    } else if (response.data.text) {
      completionText = response.data.text;
    } else {
      completionText = JSON.stringify(response.data);
    }

    return res.json({
      success: true,
      message: "AWS Bedrock API is working correctly!",
      test: {
        prompt: testPrompt,
        response: completionText,
        responseTime: `${responseTime}ms`,
      },
      config: {
        endpoint: bedrockUrl,
        region: region,
        modelId: modelId,
        tokenPresent: true,
        tokenLength: token.length,
      },
      rawResponse: response.data,
    });
  } catch (error) {
    console.error("=== Bedrock API Test Failed ===");
    console.error("Error:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);

      return res.status(error.response.status).json({
        success: false,
        error: "AWS Bedrock API request failed",
        details: {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          message: error.message,
        },
        troubleshooting: {
          possibleIssues: [
            "Invalid or expired AWS bearer token",
            "Incorrect model ID or endpoint",
            "AWS account permissions issue",
            "Network connectivity problem",
            "Rate limiting or quota exceeded",
          ],
          suggestions: [
            "Verify AWS_BEARER_TOKEN_BEDROCK is valid and not expired",
            "Check AWS_BEDROCK_ENDPOINT and AWS_BEDROCK_MODEL_ID are correct",
            "Ensure AWS account has Bedrock access enabled",
            "Check AWS CloudWatch logs for more details",
          ],
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to connect to AWS Bedrock",
      message: error.message,
      troubleshooting: {
        possibleIssues: [
          "Network timeout or connectivity issue",
          "Invalid endpoint URL",
          "Firewall or proxy blocking the request",
        ],
        suggestions: [
          "Check your internet connection",
          "Verify the AWS_BEDROCK_ENDPOINT URL is accessible",
          "Check for any proxy or firewall rules",
        ],
      },
    });
  }
});

/**
 * List Environment Variables (for debugging)
 * GET /api/test/env
 */
router.get("/env", (req, res) => {
  const envVars = {
    AWS_BEARER_TOKEN_BEDROCK: process.env.AWS_BEARER_TOKEN_BEDROCK
      ? `${process.env.AWS_BEARER_TOKEN_BEDROCK.substring(0, 10)}...${process.env.AWS_BEARER_TOKEN_BEDROCK.substring(process.env.AWS_BEARER_TOKEN_BEDROCK.length - 10)}`
      : "Not set",
    AWS_BEDROCK_ENDPOINT: process.env.AWS_BEDROCK_ENDPOINT || "Not set",
    AWS_REGION: process.env.AWS_REGION || "Not set (default: us-east-1)",
    AWS_BEDROCK_MODEL_ID:
      process.env.AWS_BEDROCK_MODEL_ID ||
      "Not set (default: anthropic.claude-v2)",
    AWS_KNOWLEDGE_BASE_ID: process.env.AWS_KNOWLEDGE_BASE_ID || "Not set",
    NODE_ENV: process.env.NODE_ENV || "development",
  };

  res.json({
    message: "AWS Bedrock Environment Variables",
    variables: envVars,
    note: "Token is partially masked for security",
  });
});

module.exports = router;
