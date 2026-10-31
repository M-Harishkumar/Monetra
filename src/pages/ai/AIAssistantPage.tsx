import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Receipt,
  Repeat,
  ShieldAlert,
  Users,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  content: string;
  timestamp: string;
  model?: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        sender: 'model',
        content:
          role === 'CUSTOMER'
            ? `Hello **${user?.name || 'Valued Customer'}**! I am your **NEXORA Account Assistant**.\n\nI have direct access to your verified subscription ledger, upcoming renewal dates, invoices, and payment receipts. How can I help you today?`
            : role === 'STAFF'
            ? `Hello **${user?.name || 'Staff Member'}**! I am your **NEXORA Operational Copilot**.\n\nI can analyze active subscriptions, expiring accounts, overdue invoices, and payment processing tasks across your operational portfolio. Ask me anything!`
            : `Hello **${user?.name || 'Administrator'}**! I am your **NEXORA Enterprise Intelligence Assistant**.\n\nI have full visibility into real-time MRR/ARR run rates, active enterprise subscriptions, customer health metrics, revenue leakage sentinel audits, and receivables. What insights would you like to review?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.8-flash',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Suggested questions based on authenticated role
  const getSuggestedQuestions = () => {
    if (role === 'CUSTOMER') {
      return [
        {
          label: 'My Active Subscriptions',
          query: 'How many active subscriptions do I have and what are their renewal dates?',
          icon: Repeat,
        },
        {
          label: 'Unpaid Invoices',
          query: 'Do I have any unpaid or overdue invoices and what is my total balance?',
          icon: Receipt,
        },
        {
          label: 'Payment History',
          query: 'What was my last completed payment amount and transaction date?',
          icon: CreditCard,
        },
      ];
    }

    if (role === 'STAFF') {
      return [
        {
          label: 'Active Subscriptions',
          query: 'How many active subscriptions do we have in total?',
          icon: Repeat,
        },
        {
          label: 'Expiring This Period',
          query: 'Which subscriptions are expiring this week or in the next 30 days?',
          icon: TrendingUp,
        },
        {
          label: 'Overdue Invoices',
          query: 'How many invoices are currently overdue and what is the total outstanding amount?',
          icon: Receipt,
        },
        {
          label: 'Failed Payments',
          query: 'Which customer payments have failed or require operational attention?',
          icon: CreditCard,
        },
      ];
    }

    // ADMIN
    return [
      {
        label: 'MRR & Revenue Telemetry',
        query: 'What is our current monthly recurring revenue (MRR) and annual run-rate (ARR)?',
        icon: TrendingUp,
      },
      {
        label: 'Active Subscriptions Count',
        query: 'How many active subscriptions do we have across all tiers?',
        icon: Repeat,
      },
      {
        label: 'Top Revenue Plans',
        query: 'Which plans generate the highest recurring revenue for NEXORA?',
        icon: Zap,
      },
      {
        label: 'Overdue Receivables',
        query: 'Which customers have overdue invoices and what is the total outstanding amount?',
        icon: Receipt,
      },
      {
        label: 'Failed Payments',
        query: 'Which payments have failed or are unmatched in the current cycle?',
        icon: CreditCard,
      },
      {
        label: 'Churn Risk Accounts',
        query: 'Which customers have the highest subscription value and which are at risk of cancellation?',
        icon: Users,
      },
    ];
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage({
        model: 'gemini-3.8-flash',
        messages: messages.map((m) => ({
          sender: m.sender,
          content: m.content,
        })),
        message: text,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'model',
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: res.model || 'gemini-3.8-flash',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'model',
          content: `⚠️ **Communication Notice:** ${
            err.message || 'Unable to retrieve answer. Please verify network connectivity.'
          }`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        sender: 'model',
        content: `Conversation refreshed. Connected to live **${role}** database snapshot. What would you like to analyze next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.8-flash',
      },
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper to render basic markdown tables and bold text nicely
  const formatAssistantContent = (content: string) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      // Table row detection
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cols = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        // Skip separator row like | :--- | :--- |
        if (!cols.every((c) => c.startsWith(':') || c.startsWith('-'))) {
          tableRows.push(cols);
        }
        return;
      } else if (inTable) {
        // Flush table
        inTable = false;
        if (tableRows.length > 0) {
          const header = tableRows[0];
          const rows = tableRows.slice(1);
          elements.push(
            <div key={`table-${lineIdx}`} className="my-3 overflow-x-auto rounded-lg border border-[#D9E8F5]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF4FF] text-[#243B53] font-bold">
                  <tr>
                    {header.map((h, i) => (
                      <th key={i} className="py-2 px-3 border-b border-[#D9E8F5]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E8F5] bg-white">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#F4F9FF]">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-3 text-[#243B53]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableRows = [];
        }
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={lineIdx} className="mt-3 mb-1 text-sm font-bold text-[#243B53] font-heading">
            {line.replace('### ', '')}
          </h4>
        );
        return;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h5 key={lineIdx} className="mt-2 mb-1 text-xs font-bold text-[#243B53]">
            {line.replace('#### ', '')}
          </h5>
        );
        return;
      }

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        elements.push(
          <div key={lineIdx} className="flex items-start gap-1.5 my-1 text-xs text-[#243B53]">
            <span className="text-[#368CE7] font-bold">•</span>
            <span>{line.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
        return;
      }

      // Sub-bullet
      if (line.trim().startsWith('• ')) {
        elements.push(
          <div key={lineIdx} className="flex items-start gap-1.5 ml-4 my-0.5 text-xs text-[#647A91]">
            <span className="text-[#58B4E8]">◦</span>
            <span>{line.replace(/^•\s*/, '')}</span>
          </div>
        );
        return;
      }

      // Plain line
      if (line.trim().length > 0) {
        elements.push(
          <p key={lineIdx} className="my-1.5 text-xs text-[#243B53] leading-relaxed">
            {line}
          </p>
        );
      }
    });

    // Flush any remaining table at the end
    if (inTable && tableRows.length > 0) {
      const header = tableRows[0];
      const rows = tableRows.slice(1);
      elements.push(
        <div key="table-end" className="my-3 overflow-x-auto rounded-lg border border-[#D9E8F5]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EAF4FF] text-[#243B53] font-bold">
              <tr>
                {header.map((h, i) => (
                  <th key={i} className="py-2 px-3 border-b border-[#D9E8F5]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E8F5] bg-white">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F4F9FF]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-1.5 px-3 text-[#243B53]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto space-y-4">
      {/* Header Banner with Role Access Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#D9E8F5] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#368CE7] border border-[#DCEEFF] shadow-xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#243B53] font-heading">
                NEXORA AI Revenue Assistant
              </h2>
              <span className="rounded-md bg-[#DCEEFF] px-2 py-0.5 text-[10px] font-bold text-[#368CE7] uppercase">
                {role} ACCESS
              </span>
            </div>
            <p className="text-xs text-[#647A91]">
              {role === 'CUSTOMER'
                ? 'Authorized personal customer assistant: ask about your subscriptions, renewal dates, and payment history.'
                : role === 'STAFF'
                ? 'Operational financial intelligence: analyze subscriptions, unpaid invoices, and collections.'
                : 'Executive financial copilot: live query MRR, ARR, revenue churn, invoice aging, and customer cohorts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-lg border border-[#D9E8F5] bg-[#F4F9FF] px-3 py-1.5 text-xs font-semibold text-[#647A91] hover:bg-[#EAF4FF] hover:text-[#243B53] transition-colors cursor-pointer"
            title="Clear Chat Conversation"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#647A91]" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col rounded-2xl bg-white border border-[#D9E8F5] shadow-xs overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    isUser
                      ? 'bg-[#368CE7] text-white shadow-xs'
                      : 'bg-[#EAF4FF] text-[#368CE7] border border-[#D9E8F5]'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative rounded-2xl p-3.5 sm:p-4 text-xs transition-all ${
                    isUser
                      ? 'bg-[#368CE7] text-white rounded-tr-none shadow-xs'
                      : 'bg-[#F4F9FF] text-[#243B53] border border-[#D9E8F5] rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div>{formatAssistantContent(msg.content)}</div>
                  )}

                  {/* Metadata and Copy Button */}
                  <div
                    className={`mt-2 flex items-center justify-between gap-4 pt-1 text-[10px] ${
                      isUser ? 'text-white/70' : 'text-[#647A91]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#368CE7] cursor-pointer flex items-center gap-1"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-[#249B70]" />
                            <span className="text-[#249B70] font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-md mr-auto animate-in fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#368CE7] border border-[#D9E8F5]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-[#F4F9FF] border border-[#D9E8F5] p-3.5 flex items-center gap-2 text-xs text-[#647A91]">
                <span className="flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-[#368CE7] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#368CE7] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#368CE7] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="ml-1 text-[11px] font-medium text-[#647A91]">
                  Querying authorized database ledger...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Shelf */}
        <div className="px-4 py-2.5 bg-[#F4F9FF] border-t border-[#D9E8F5] overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold text-[#647A91] uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-[#368CE7]" />
              SUGGESTED:
            </span>
            {suggestedQuestions.map((q, i) => {
              const Icon = q.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q.query)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-[#D9E8F5] bg-white px-2.5 py-1 text-[11px] font-medium text-[#243B53] hover:border-[#368CE7] hover:bg-[#EAF4FF] hover:text-[#368CE7] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Icon className="h-3 w-3 text-[#368CE7]" />
                  <span>{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-white border-t border-[#D9E8F5]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                role === 'CUSTOMER'
                  ? 'Ask about your subscriptions, unpaid invoices, or receipts...'
                  : 'Ask about MRR, active subscriptions, overdue invoices, or failed payments...'
              }
              disabled={isLoading}
              className="flex-1 rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] px-4 py-2.5 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#368CE7] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#368CE7] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#2e79cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#647A91]">
            <span>
              Grounding: <strong>Authorized Live Database Snapshot</strong> (zero hallucinations)
            </span>
            <span>Gemini 3.8 Flash Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
