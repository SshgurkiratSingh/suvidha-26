import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiConfig";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const navigate = useNavigate();
  const { citizenToken } = useAuth();
  const chatBaseUrl = API_BASE_URL.endsWith("/api")
    ? `${API_BASE_URL}/chat`
    : `${API_BASE_URL}/api/chat`;
  const resolveNavigationPath = useCallback((page, params) => {
    switch (page) {
      case "login":
        return "/login";
      case "dashboard":
        return "/dashboard";
      case "profile":
        return "/profile";
      case "all-bills":
        return "/all-bills";
      case "all-usage":
        return "/all-usage";
      case "my-applications":
        return "/my-applications";
      case "grievances":
        return "/grievances";
      case "schemes":
        return "/schemes";
      case "policies":
        return "/policies";
      case "tariffs":
        return "/tariffs";
      case "track-status":
        return "/track-status";
      case "scheme-detail":
        return params?.schemeId ? `/schemes/${params.schemeId}` : "/schemes";
      case "scheme-apply":
        if (params?.schemeId && params?.applicationId) {
          return `/schemes/${params.schemeId}/apply/${params.applicationId}`;
        }
        if (params?.schemeId) {
          return `/schemes/${params.schemeId}/apply`;
        }
        return "/schemes";
      default:
        return "/dashboard";
    }
  }, []);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    const savedConversationId = sessionStorage.getItem("chat_conversation_id");
    const savedMessages = sessionStorage.getItem("chat_messages");
    const savedIsOpen = sessionStorage.getItem("chat_is_open");

    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.warn("Failed to parse saved chat messages");
      }
    }
    if (savedIsOpen) {
      setIsOpen(savedIsOpen === "true");
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem("chat_conversation_id", conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    sessionStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem("chat_is_open", String(isOpen));
  }, [isOpen]);

  // Initialize new conversation
  const initializeConversation = useCallback(async () => {
    try {
      const response = await axios.post(
        `${chatBaseUrl}/conversation`,
        {},
        citizenToken
          ? { headers: { Authorization: `Bearer ${citizenToken}` } }
          : undefined,
      );
      setConversationId(response.data.conversationId);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm Suvidha AI Assistant. I can help you with bills, applications, schemes, and more. How can I assist you today?",
          createdAt: new Date().toISOString(),
        },
      ]);
      return response.data.conversationId;
    } catch (error) {
      console.error("Error initializing conversation:", error);
      return null;
    }
  }, [citizenToken]);

  // Send text message
  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return;

      let currentConvId = conversationId;
      if (!currentConvId) {
        currentConvId = await initializeConversation();
        if (!currentConvId) {
          alert("Failed to initialize conversation");
          return;
        }
      }

      // Add user message to UI
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const response = await axios.post(
          `${chatBaseUrl}/message`,
          {
            conversationId: currentConvId,
            message,
          },
          citizenToken
            ? { headers: { Authorization: `Bearer ${citizenToken}` } }
            : undefined,
        );

        // Add assistant response
        const assistantMessage = {
          id: response.data.messageId,
          role: "assistant",
          content: response.data.response,
          createdAt: new Date().toISOString(),
          functionCall: response.data.functionCall,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Handle navigation if required
        if (
          response.data.requiresAction &&
          response.data.functionCall?.result?.action === "navigate"
        ) {
          const { page, params } = response.data.functionCall.result;
          const targetPath = resolveNavigationPath(page, params);
          setTimeout(() => {
            navigate(targetPath, { state: params });
          }, 1000);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, initializeConversation, navigate],
  );

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendVoiceMessage(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  }, []);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Send voice message
  const sendVoiceMessage = useCallback(
    async (audioBlob) => {
      let currentConvId = conversationId;
      if (!currentConvId) {
        currentConvId = await initializeConversation();
        if (!currentConvId) {
          alert("Failed to initialize conversation");
          return;
        }
      }

      setIsTyping(true);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("conversationId", currentConvId);
        formData.append("languageCode", "en-US"); // Can be made dynamic based on user preference

        const response = await axios.post(`${chatBaseUrl}/voice`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(citizenToken
              ? { Authorization: `Bearer ${citizenToken}` }
              : {}),
          },
        });

        // Add user message (transcribed)
        const userMessage = {
          id: `user-${Date.now()}`,
          role: "user",
          content: response.data.transcript,
          createdAt: new Date().toISOString(),
          isVoice: true,
        };
        setMessages((prev) => [...prev, userMessage]);

        // Add assistant response
        const assistantMessage = {
          id: response.data.messageId,
          role: "assistant",
          content: response.data.response,
          createdAt: new Date().toISOString(),
          audioUrl: response.data.audioUrl,
          functionCall: response.data.functionCall,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Auto-play audio response
        if (response.data.audioUrl) {
          playAudio(
            `${API_BASE_URL.replace("/api", "")}${response.data.audioUrl}`,
          );
        }

        // Handle navigation if required
        if (
          response.data.requiresAction &&
          response.data.functionCall?.result?.action === "navigate"
        ) {
          const { page, params } = response.data.functionCall.result;
          const targetPath = resolveNavigationPath(page, params);
          setTimeout(() => {
            navigate(targetPath, { state: params });
          }, 1000);
        }
      } catch (error) {
        console.error("Error sending voice message:", error);
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I'm sorry, I couldn't process your voice message. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, initializeConversation, navigate],
  );

  // Play audio
  const playAudio = useCallback((audioUrl) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      console.error("Error playing audio");
    };

    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
      setIsSpeaking(false);
    });
  }, []);

  // Stop audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setIsSpeaking(false);
    }
  }, []);

  // Convert text to speech
  const speak = useCallback(
    async (text) => {
      try {
        const response = await axios.post(
          `${chatBaseUrl}/tts`,
          {
            text,
            languageCode: "en-US",
          },
          citizenToken
            ? { headers: { Authorization: `Bearer ${citizenToken}` } }
            : undefined,
        );

        if (response.data.audioUrl) {
          playAudio(
            `${API_BASE_URL.replace("/api", "")}${response.data.audioUrl}`,
          );
        }
      } catch (error) {
        console.error("Error converting text to speech:", error);
      }
    },
    [playAudio],
  );

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);

    // Initialize conversation when opening for first time
    if (!conversationId && !isOpen) {
      initializeConversation();
    }
  }, [conversationId, isOpen, initializeConversation]);

  // Close chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    stopAudio();
    if (isRecording) {
      stopRecording();
    }
  }, [stopAudio, isRecording, stopRecording]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    initializeConversation();
  }, [initializeConversation]);

  const value = {
    isOpen,
    messages,
    isTyping,
    isRecording,
    isSpeaking,
    conversationId,
    sendMessage,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    speak,
    toggleChat,
    closeChat,
    clearConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
