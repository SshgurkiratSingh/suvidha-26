const axios = require("axios");

/**
 * AWS Bedrock Titan Embeddings Service
 * Generates embeddings for text using AWS Bedrock Titan Embeddings model
 */

const EMBEDDING_MODEL = "amazon.titan-embed-text-v1";
const EMBEDDING_DIMENSION = 1536; // Titan Embeddings v1 returns 1536-dimensional vectors

/**
 * Generate embedding for a single text
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} Embedding vector
 */
async function generateEmbedding(text) {
  try {
    const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
    const endpoint = process.env.AWS_BEDROCK_ENDPOINT;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!token || !endpoint) {
      throw new Error(
        "AWS Bedrock credentials not configured. Set AWS_BEARER_TOKEN_BEDROCK and AWS_BEDROCK_ENDPOINT",
      );
    }

    // Clean and prepare text
    const cleanText = text.replace(/\s+/g, " ").trim();
    if (cleanText.length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }

    // Truncate if too long (Titan supports up to ~8k tokens)
    const maxLength = 8000;
    const truncatedText =
      cleanText.length > maxLength
        ? cleanText.substring(0, maxLength)
        : cleanText;

    const invokeUrl = endpoint.includes("/model/")
      ? endpoint
      : `${endpoint}/model/${EMBEDDING_MODEL}/invoke`;

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          invokeUrl,
          {
            inputText: truncatedText,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              "x-amz-bedrock-model-id": EMBEDDING_MODEL,
            },
            timeout: 60000,
          },
        );

        if (response.data && response.data.embedding) {
          return response.data.embedding;
        }

        throw new Error(
          "Invalid response format from Bedrock Embeddings API: " +
            JSON.stringify(response.data),
        );
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const shouldRetry = !status || status >= 500;

        if (!shouldRetry || attempt === maxRetries) {
          throw error;
        }

        const backoff = 500 * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts) {
  const embeddings = [];
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(
        `Failed to generate embedding for text: ${text.substring(0, 50)}...`,
      );
      embeddings.push(null);
    }
  }
  return embeddings;
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {number[]} embeddingA - First embedding vector
 * @param {number[]} embeddingB - Second embedding vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(embeddingA, embeddingB) {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error("Embedding dimensions must match");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find most similar knowledge base entries to a query
 * @param {string} query - User query text
 * @param {Array} knowledgeBaseEntries - Array of KB entries with embeddings
 * @param {number} topK - Number of top results to return
 * @returns {Promise<Array>} Top K most similar entries with similarity scores
 */
async function findSimilarEntries(query, knowledgeBaseEntries, topK = 5) {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Calculate similarity scores for all entries
    const scoredEntries = knowledgeBaseEntries
      .map((entry) => {
        if (!entry.embedding) {
          return null;
        }

        let embeddingVector;
        try {
          // Parse embedding if it's stored as string
          embeddingVector =
            typeof entry.embedding === "string"
              ? JSON.parse(entry.embedding)
              : entry.embedding;
        } catch (error) {
          console.error(
            `Failed to parse embedding for entry ${entry.id}:`,
            error,
          );
          return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, embeddingVector);
        return {
          ...entry,
          similarity,
        };
      })
      .filter((entry) => entry !== null);

    // Sort by similarity (highest first) and return top K
    const topResults = scoredEntries
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return topResults;
  } catch (error) {
    console.error("Error finding similar entries:", error);
    throw error;
  }
}

/**
 * Store embedding as JSON string for database storage
 * @param {number[]} embedding - Embedding vector
 * @returns {string} JSON string representation
 */
function serializeEmbedding(embedding) {
  return JSON.stringify(embedding);
}

/**
 * Parse embedding from JSON string
 * @param {string} embeddingString - JSON string representation
 * @returns {number[]} Embedding vector
 */
function deserializeEmbedding(embeddingString) {
  return JSON.parse(embeddingString);
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
  findSimilarEntries,
  serializeEmbedding,
  deserializeEmbedding,
  EMBEDDING_DIMENSION,
};
