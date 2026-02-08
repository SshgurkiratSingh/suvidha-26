const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

/**
 * AWS Voice Services - Transcribe (Speech-to-Text) and Polly (Text-to-Speech)
 * Handles voice input and output for the chatbot
 */

/**
 * Transcribe audio to text using AWS Transcribe
 * @param {Buffer|string} audioData - Audio file buffer or file path
 * @param {string} languageCode - Language code (e.g., 'en-US', 'hi-IN')
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioData, languageCode = "en-US") {
  try {
    const endpoint = process.env.AWS_TRANSCRIBE_ENDPOINT;
    const token = process.env.AWS_BEARER_TOKEN_BEDROCK;

    if (!endpoint || !token) {
      throw new Error(
        "AWS Transcribe not configured. Set AWS_TRANSCRIBE_ENDPOINT and AWS_BEARER_TOKEN_BEDROCK",
      );
    }

    // Prepare audio data
    let audioBuffer;
    if (typeof audioData === "string") {
      // If it's a file path
      audioBuffer = fs.readFileSync(audioData);
    } else {
      audioBuffer = audioData;
    }

    const formData = new FormData();
    formData.append("audio", audioBuffer, {
      filename: "audio.webm",
      contentType: "audio/webm",
    });
    formData.append("languageCode", languageCode);

    const response = await axios.post(`${endpoint}/transcribe`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    if (response.data && response.data.transcript) {
      return response.data.transcript;
    } else {
      throw new Error("Invalid response from Transcribe API");
    }
  } catch (error) {
    console.error("Error transcribing audio:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Convert text to speech using AWS Polly
 * @param {string} text - Text to convert to speech
 * @param {string} languageCode - Language code (e.g., 'en-US', 'hi-IN')
 * @param {string} voiceId - Voice ID (e.g., 'Joanna', 'Matthew', 'Aditi')
 * @returns {Promise<Buffer>} Audio buffer
 */
async function textToSpeech(text, languageCode = "en-US", voiceId = "Joanna") {
  try {
    const endpoint = process.env.AWS_POLLY_ENDPOINT;
    const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!endpoint || !token) {
      throw new Error(
        "AWS Polly not configured. Set AWS_POLLY_ENDPOINT and AWS_BEARER_TOKEN_BEDROCK",
      );
    }

    // Map language codes to appropriate voices
    const voiceMap = {
      "en-US": "Joanna",
      "en-GB": "Amy",
      "hi-IN": "Aditi",
      "ta-IN": "undefined", // No native Tamil voice, will use Aditi
      "te-IN": "undefined", // No native Telugu voice
      "pa-IN": "undefined", // No native Punjabi voice
      "bn-IN": "undefined", // No native Bengali voice
    };

    const selectedVoice =
      voiceId || voiceMap[languageCode] || voiceMap["en-US"];

    const response = await axios.post(
      `${endpoint}/synthesize-speech`,
      {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: selectedVoice,
        Engine: "neural", // Use neural engine for better quality
        LanguageCode: languageCode,
        TextType: "text",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
        timeout: 30000,
      },
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error converting text to speech:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
}

/**
 * Get available voices for a language
 * @param {string} languageCode - Language code
 * @returns {Array} Available voices
 */
function getAvailableVoices(languageCode = "en-US") {
  const voices = {
    "en-US": [
      { id: "Joanna", name: "Joanna", gender: "Female" },
      { id: "Matthew", name: "Matthew", gender: "Male" },
      { id: "Ivy", name: "Ivy", gender: "Female" },
      { id: "Justin", name: "Justin", gender: "Male" },
      { id: "Kendra", name: "Kendra", gender: "Female" },
      { id: "Kevin", name: "Kevin", gender: "Male" },
    ],
    "en-GB": [
      { id: "Amy", name: "Amy", gender: "Female" },
      { id: "Emma", name: "Emma", gender: "Female" },
      { id: "Brian", name: "Brian", gender: "Male" },
    ],
    "hi-IN": [{ id: "Aditi", name: "Aditi", gender: "Female" }],
  };

  return voices[languageCode] || voices["en-US"];
}

/**
 * Detect language from text (simple heuristic)
 * @param {string} text - Text to detect language from
 * @returns {string} Language code
 */
function detectLanguage(text) {
  // Simple character-based detection
  const devanagariRegex = /[\u0900-\u097F]/; // Hindi/Devanagari
  const tamilRegex = /[\u0B80-\u0BFF]/; // Tamil
  const teluguRegex = /[\u0C00-\u0C7F]/; // Telugu
  const bengaliRegex = /[\u0980-\u09FF]/; // Bengali
  const gurmukhiRegex = /[\u0A00-\u0A7F]/; // Punjabi/Gurmukhi

  if (devanagariRegex.test(text)) return "hi-IN";
  if (tamilRegex.test(text)) return "ta-IN";
  if (teluguRegex.test(text)) return "te-IN";
  if (bengaliRegex.test(text)) return "bn-IN";
  if (gurmukhiRegex.test(text)) return "pa-IN";

  return "en-US";
}

module.exports = {
  transcribeAudio,
  textToSpeech,
  getAvailableVoices,
  detectLanguage,
};
