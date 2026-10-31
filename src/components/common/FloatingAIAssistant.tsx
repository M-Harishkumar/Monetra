import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Maximize2,
  Trash2,
  Minimize2,
  Check,
  Copy,
  TrendingUp,
  Receipt,
  Repeat,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const FloatingAIAssistant: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'model'; text: string; time: string }>>([
    {
      sender: 'model',
      text:
        role === 'CUSTOMER'
          ? `Hi ${user?.name || 'there'}! Ask me about your subscriptions, renewal dates, or invoice status.`
          : `Hello ${user?.name || 'there'}! How can I assist you with subscriptions, revenue, or invoices today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || isLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage({
        model: 'gemini-3.8-flash',
        messages: messages.map((m) => ({
          sender: m.sender,
          content: m.text,
        })),
        message: q,
      });

      const assistantMsg = {
        sender: 'model' as const,
        text: res.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'model',
          text: `⚠️ ${err.message || 'Error communicating with assistant. Please try again.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickPills = () => {
    if (role === 'CUSTOMER') {
      return [
        'My active subscriptions?',
        'Do I have unpaid invoices?',
      ];
    }
    if (role === 'STAFF') {
      return [
        'How many active subscriptions?',
        'Which invoices are overdue?',
      ];
    }
    return [
      'What is current MRR?',
      'How many active subscriptions?',
      'Which invoices are overdue?',
    ];
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#368CE7] hover:bg-[#2e79cc] text-white px-4 py-3 shadow-lg shadow-[#368CE7]/30 transition-all duration-300 hover:scale-105 cursor-pointer border border-[#58B4E8]/40"
          aria-label="Open AI Assistant"
          title="Open NEXORA AI Assistant"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-xs font-bold font-heading tracking-wide">AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-5rem)] flex flex-col rounded-2xl bg-white border border-[#D9E8F5] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#EAF4FF] border-b border-[#D9E8F5]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#368CE7] text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#243B53] font-heading flex items-center gap-1.5">
                  <span>NEXORA AI Copilot</span>
                  <span className="rounded bg-[#DCEEFF] px-1.5 py-0.2 text-[9px] font-bold text-[#368CE7]">
                    {role}
                  </span>
                </h3>
                <p className="text-[10px] text-[#647A91]">Live Database Grounded</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                className="p-1 rounded text-[#647A91] hover:text-[#243B53] hover:bg-white/60 transition-colors cursor-pointer"
                title="Open full page"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-[#647A91] hover:text-[#D9535D] hover:bg-white/60 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F4F9FF]">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-2 max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] ${
                      isUser
                        ? 'bg-[#368CE7] text-white'
                        : 'bg-white text-[#368CE7] border border-[#D9E8F5]'
                    }`}
                  >
                    {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>
                  <div
                    className={`rounded-xl p-2.5 text-xs ${
                      isUser
                        ? 'bg-[#368CE7] text-white rounded-tr-none shadow-xs'
                        : 'bg-white text-[#243B53] border border-[#D9E8F5] rounded-tl-none shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    <span
                      className={`block mt-1 text-[9px] ${
                        isUser ? 'text-white/70' : 'text-[#647A91]'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 mr-auto items-center text-xs text-[#647A91] bg-white border border-[#D9E8F5] rounded-xl p-2.5">
                <Bot className="h-3.5 w-3.5 text-[#368CE7]" />
                <span className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#368CE7] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#368CE7] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#368CE7] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[10px] ml-1">Analyzing database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Pill Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-[#D9E8F5] flex flex-wrap gap-1.5">
            {getQuickPills().map((pill, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(pill)}
                disabled={isLoading}
                className="rounded-md border border-[#D9E8F5] bg-[#F4F9FF] px-2 py-0.5 text-[10px] font-medium text-[#243B53] hover:border-[#368CE7] hover:bg-[#EAF4FF] hover:text-[#368CE7] transition-colors cursor-pointer disabled:opacity-50"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-white border-t border-[#D9E8F5]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask assistant..."
                disabled={isLoading}
                className="flex-1 rounded-lg border border-[#D9E8F5] bg-[#F4F9FF] px-3 py-1.5 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#368CE7] text-white hover:bg-[#2e79cc] disabled:opacity-50 cursor-pointer transition-colors shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
