import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Message {
  sender: string;
  text: string;
  timestamp?: string;
}

interface ConversationHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  // Helper function to convert messages to conversation history format
  const buildConversationHistory = (currentMessages: Message[]): ConversationHistoryItem[] => {
    return currentMessages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
      timestamp: msg.timestamp || new Date().toISOString()
    }));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const timestamp = new Date().toISOString();
    const userMessage: Message = { 
      sender: "user", 
      text: input,
      timestamp
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history from current messages (excluding the message we're about to send)
      const conversationHistory = buildConversationHistory(messages);

      // Create the payload in the format you specified
      const payload = {
        message: currentInput,
        conversationHistory: conversationHistory
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2)); // For debugging

      const res = await axios.post("http://localhost:8080/chat", payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const botMessage: Message = { 
        sender: "bot", 
        text: res.data.reply,
        timestamp: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Error connecting to server. Please try again later.",
          timestamp: new Date().toISOString()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Chat Bubble */}
      <button
        onClick={toggleChat}
        className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-4 rounded-full shadow-2xl hover:from-blue-800 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 border border-blue-700"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        )}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 md:w-[28rem] bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 flex items-center justify-between border-b border-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold text-lg">AI Assistant</span>
            </div>
            <button
              onClick={toggleChat}
              className="hover:bg-blue-800 p-1 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-80 min-h-[20rem] bg-gradient-to-b from-slate-900 to-slate-800">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-slate-400 mt-8">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start a conversation!</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[85%] shadow-lg ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white ml-4"
                      : "bg-slate-700 text-slate-100 mr-4 border border-slate-600"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          // Custom styling for links
                          a: ({ href, children, ...props }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#22c55e',
                                fontWeight: 'bold',
                                textDecoration: 'underline'
                              }}
                              {...props}
                            >
                              {children}
                            </a>
                          ),
                          // Custom styling for images
                          img: ({ src, alt, ...props }) => (
                            <img
                              src={src}
                              alt={alt}
                              style={{
                                width: '120px',
                                height: 'auto',
                                borderRadius: '8px',
                                margin: '5px 0',
                                objectFit: 'cover'
                              }}
                              {...props}
                            />
                          )
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 px-4 py-3 rounded-2xl max-w-[85%] mr-4 border border-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-300">
                      AI is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 p-3 rounded-xl bg-slate-700 text-white outline-none resize-none border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 min-h-[44px] max-h-32"
                placeholder="Type your message... (Shift+Enter for new line)"
                rows={1}
                style={{ height: "auto", minHeight: "44px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px";
                }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                <PaperAirplaneIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}