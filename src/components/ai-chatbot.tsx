'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Health OS assistant. I have access to your Patient and Appointment database. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsgText = inputMessage.trim();
    const userMessage: Message = {
      role: 'user',
      content: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Auto-resize textarea back to default
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          conversationHistory: historyPayload
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        throw new Error(data?.error || `Server Error: ${response.status}`);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'No response text received.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message || 'Something went wrong.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = '44px';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = Math.min(scrollHeight, 100) + 'px';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Window - Bottom Left */}
      <div className={cn(
        "fixed left-4 md:left-6 z-[45] transition-all duration-300 ease-out",
        // Responsive bottom positioning - accounts for dock
        "bottom-24 sm:bottom-28 md:bottom-32",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <div className={cn(
          "flex flex-col shadow-2xl border border-border/40 overflow-hidden transition-all duration-300 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
          // Responsive sizing
          isMinimized 
            ? "w-[280px] sm:w-[320px] md:w-[360px] h-14" 
            : "w-[280px] sm:w-[340px] md:w-[380px] lg:w-[400px]",
          // Responsive height - fits within viewport
          !isMinimized && "h-[calc(100vh-200px)] max-h-[500px] min-h-[400px]"
        )}>
          {/* Header */}
          <div 
            className="relative shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 cursor-pointer select-none"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <Sparkles className="h-4 w-4 text-white" />
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Health OS AI</h3>
                  <p className="text-blue-100 text-[10px]">Always here to help</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} 
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Minimize2 className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex gap-2 md:gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border-2",
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 border-teal-400/50' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400/50'
                    )}>
                      {msg.role === 'user' ? (
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={cn(
                      "flex flex-col gap-0.5 max-w-[75%]",
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    )}>
                      <div className={cn(
                        "px-3 py-2 md:px-3.5 md:py-2.5 rounded-2xl text-[13px] md:text-sm leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-slate-700'
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1.5">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md border-2 border-blue-400/50">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-sm border border-gray-200 dark:border-slate-700 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="shrink-0 p-3 border-t border-border/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <div className="relative flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      disabled={isLoading}
                      className="w-full resize-none rounded-xl md:rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-[13px] md:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        height: '40px',
                        maxHeight: '100px',
                        minHeight: '40px'
                      }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg shrink-0",
                      inputMessage.trim() && !isLoading
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 active:scale-95"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 md:h-4.5 md:w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 md:h-4.5 md:w-4.5" />
                    )}
                  </button>
                </div>

                {/* Quick Actions */}
                {!isLoading && messages.length === 1 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-hide">
                    <button
                      onClick={() => setInputMessage("Show me today's appointments")}
                      className="px-2.5 py-1 text-[11px] rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap"
                    >
                      📅 Today
                    </button>
                    <button
                      onClick={() => setInputMessage("Find patient records")}
                      className="px-2.5 py-1 text-[11px] rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors whitespace-nowrap"
                    >
                      👤 Patients
                    </button>
                    <button
                      onClick={() => setInputMessage("Database statistics")}
                      className="px-2.5 py-1 text-[11px] rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors whitespace-nowrap"
                    >
                      📊 Stats
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Toggle Button - Bottom Left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed left-4 md:left-6 z-40 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
          // Position above dock
          "bottom-4 sm:bottom-6",
          isOpen 
            ? "bg-gray-600 hover:bg-gray-700" 
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
        )}
      </button>
    </>
  );
}