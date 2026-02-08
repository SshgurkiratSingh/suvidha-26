import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { useLanguage } from "../context/LanguageContext";

const ChatWidget = () => {
  const {
    isOpen,
    messages,
    isTyping,
    isRecording,
    isSpeaking,
    sendMessage,
    startRecording,
    stopRecording,
    speak,
    stopAudio,
    toggleChat,
    closeChat,
  } = useChat();

  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSpeakMessage = (text) => {
    if (isSpeaking) {
      stopAudio();
    } else {
      speak(text);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Siri/Gemini-like breathing animation
  const micPulseVariants = isRecording ? "scale-110" : "scale-100";

  return (
    <>
      {/* Floating Gemini/Siri-style Orb - Always visible */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleChat}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-pink-600 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 active:scale-95 group overflow-hidden flex items-center justify-center"
            aria-label="Open Suvidha AI"
          >
            {/* Animated gradient pulse */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-300 to-pink-400 opacity-0 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>

            {/* Inner glow */}
            <div className="absolute inset-1 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"></div>

            {/* Icon */}
            <svg
              className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110 relative z-10"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            </svg>

            {/* Notification dot */}
            {messages.length > 1 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
            )}

            {/* Outer ring animation when hovering */}
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-white/30 animate-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ animationDuration: "3s" }}
            ></div>
          </button>
        </div>
      )}

      {/* Main Chat Interface - Siri/Gemini Style */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 backdrop-blur-sm animate-fade-in">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/25 rounded-full blur-3xl animate-blob"></div>
            <div
              className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-blob"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-blob"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Header - Minimal */}
            <div className="pt-6 px-6 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-light text-white tracking-wide">
                  Suvidha AI
                </h2>
                <p className="text-sm text-blue-200 mt-1">
                  Always here to help
                </p>
              </div>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 group"
                aria-label="Close chat"
              >
                <svg
                  className="w-6 h-6 text-white/70 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages Container - Center focused */}
            <div className="flex-1 overflow-y-auto px-6 py-12 space-y-8 flex flex-col justify-center scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-pink-500 flex items-center justify-center shadow-xl">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-lg font-light">
                      How can I help?
                    </p>
                    <p className="text-blue-200 text-sm mt-2">
                      Ask me anything about schemes, bills, or services
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className={`max-w-[75%] group ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-purple-500/50 to-pink-500/40 backdrop-blur-md text-white rounded-3xl rounded-tr-sm border border-purple-400/30"
                          : "bg-white/10 backdrop-blur-md text-white rounded-3xl rounded-tl-sm border border-white/20"
                      } px-6 py-3.5 transition-all duration-300`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-light">
                        {message.content}
                      </p>
                      <div
                        className={`flex items-center justify-between mt-3 text-xs ${message.role === "user" ? "text-purple-100" : "text-white/60"}`}
                      >
                        <span>{formatTime(message.createdAt)}</span>
                        <div className="flex items-center space-x-2 ml-3">
                          {message.role === "assistant" && (
                            <button
                              onClick={() =>
                                handleSpeakMessage(message.content)
                              }
                              className={`p-1.5 rounded-full transition-all duration-200 ${isSpeaking ? "bg-gradient-to-br from-violet-500 to-pink-500 text-white" : "hover:bg-white/10 text-white/70 hover:text-white"}`}
                              title={isSpeaking ? "Stop" : "Listen"}
                            >
                              {isSpeaking ? (
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                          {message.isVoice && (
                            <div className="flex items-center space-x-0.5">
                              <div className="w-0.5 h-2 bg-white/60 rounded-full animate-sound-wave"></div>
                              <div className="w-0.5 h-3 bg-white/60 rounded-full animate-sound-wave animation-delay-100"></div>
                              <div className="w-0.5 h-2 bg-white/60 rounded-full animate-sound-wave animation-delay-200"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator - Siri style */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl rounded-tl-sm px-6 py-4 border border-white/20">
                    <div className="flex space-x-1.5">
                      <div
                        className="w-2 h-2 bg-gradient-to-b from-violet-400 to-pink-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gradient-to-b from-violet-400 to-pink-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gradient-to-b from-violet-400 to-pink-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Bottom section */}
            <div className="pb-8 px-6 space-y-4">
              {/* Voice Wave Visualizer */}
              {isRecording && (
                <div className="flex items-center justify-center space-x-1 py-4 animate-fade-in">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-pink-400 to-violet-300 rounded-full"
                      style={{
                        height: `${Math.random() * 32 + 8}px`,
                        animation: `sound-wave 0.6s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-3"
              >
                {/* Voice Button - Prominent */}
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`relative p-4 rounded-full transition-all duration-300 flex-shrink-0 ${
                    isRecording
                      ? "bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-pink-500/50 scale-110"
                      : "bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-purple-500/50 hover:scale-105"
                  }`}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-75"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-pink-300 animate-pulse"></div>
                    </>
                  )}
                  <svg
                    className="w-6 h-6 text-white relative z-10"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Input Field */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      isRecording ? "Listening..." : "Ask something..."
                    }
                    className="w-full px-6 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-200 placeholder-white/50 text-white font-light"
                    disabled={isRecording}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isRecording}
                  className="p-4 bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-full hover:from-violet-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/75 flex-shrink-0 active:scale-95 group disabled:hover:shadow-purple-500/50"
                  title="Send message"
                >
                  <svg
                    className="w-6 h-6 transition-transform group-active:scale-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </form>

              {/* Hint text */}
              <p className="text-center text-white/50 text-xs font-light">
                {isRecording
                  ? "Listening to your voice..."
                  : "Type or tap the mic to speak"}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        @keyframes sound-wave {
          0%,
          100% {
            height: 8px;
          }
          50% {
            height: 32px;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-blob {
          animation: blob 8s infinite;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-white\/20::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .scrollbar-thumb-white\/20::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
