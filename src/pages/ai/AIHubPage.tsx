import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  CheckCircle2,
  Radio,
  Zap,
  Sliders,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

type Tab = 'chat' | 'voice' | 'transcribe';

export const AIHubPage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  // -------------------------------------------------------------
  // 1. GEMINI MULTI-TURN CHATBOT STATE
  // -------------------------------------------------------------
  const [chatModel, setChatModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [systemRole, setSystemRole] = useState<string>('financial_analyst');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'model'; content: string; timestamp: string }>>([
    {
      sender: 'model',
      content:
        'Hello! I am your NEXORA Revenue Intelligence Assistant. I can analyze recurring subscriptions, run cohort churn projections, interpret billing anomalies, and assist with revenue leakage prevention. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const systemInstructions: Record<string, string> = {
    financial_analyst:
      'You are a Chief Financial Officer and Senior SaaS Revenue Analyst. You provide rigorous analysis of MRR, ARR, Net Revenue Retention (NRR), customer lifetime value (LTV), and churn risk factors.',
    billing_operator:
      'You are an Enterprise Billing and Invoicing Specialist. You assist with proration calculations, payment allocations, dunning schedules, and idempotent billing cycles.',
    customer_advisor:
      'You are a Customer Success and Account Retention Strategist. You explain subscription health scores (0-100), identify churn triggers, and suggest renewal retention strategies.',
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = {
      sender: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await api.sendChatMessage({
        model: chatModel,
        systemInstruction: systemInstructions[systemRole],
        messages: chatMessages,
        message: userMsg.content,
      });

      const modelMsg = {
        sender: 'model' as const,
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'model',
          content: `Error: ${err.message || 'Failed to generate response. Please verify server connectivity.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. REAL-TIME VOICE CONVERSATIONS (gemini-3.8-live)
  // -------------------------------------------------------------
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('Disconnected');
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const voiceWsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startVoiceConversation = async () => {
    try {
      setVoiceStatus('Connecting to Gemini 3.8 Live API...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      voiceWsRef.current = ws;

      ws.onopen = async () => {
        setIsVoiceConnected(true);
        setVoiceStatus('Live voice channel active (gemini-3.8-live)');
        setVoiceLog((prev) => [...prev, '[Session Started] Real-time voice conversation connected. Speak into your microphone.']);

        // Initialize AudioContext & Mic Stream
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to 16-bit PCM
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
              }
              const bytes = new Uint8Array(pcm16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Audio = btoa(binary);
              ws.send(JSON.stringify({ audio: base64Audio }));
            }
          };
        } catch (micErr: any) {
          setVoiceLog((prev) => [...prev, `[Microphone Note] ${micErr.message}`]);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.info) {
            setVoiceLog((prev) => [...prev, `[Live Info] ${data.info}`]);
          }
          if (data.text) {
            setVoiceLog((prev) => [...prev, `[Assistant Voice Response] ${data.text}`]);
          }
          if (data.audio) {
            setVoiceLog((prev) => [...prev, `[Live Audio Stream] Receiving 24kHz PCM voice packet...`]);
          }
          if (data.interrupted) {
            setVoiceLog((prev) => [...prev, `[Interrupted] Playback cleared for new user input.`]);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onerror = () => {
        setVoiceStatus('WebSocket connection failed.');
        setIsVoiceConnected(false);
      };

      ws.onclose = () => {
        setVoiceStatus('Session closed.');
        setIsVoiceConnected(false);
      };
    } catch (err: any) {
      setVoiceStatus(`Error: ${err.message}`);
      setIsVoiceConnected(false);
    }
  };

  const stopVoiceConversation = () => {
    if (voiceWsRef.current) {
      voiceWsRef.current.close();
      voiceWsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsVoiceConnected(false);
    setVoiceStatus('Disconnected');
    setVoiceLog((prev) => [...prev, '[Session Ended] Voice stream disconnected.']);
  };

  // -------------------------------------------------------------
  // 3. AUDIO TRANSCRIPTION (gemini-3.5-transcribe)
  // -------------------------------------------------------------
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeHistory, setTranscribeHistory] = useState<Array<{ id: string; text: string; date: string }>>([
    {
      id: 'TR-01',
      text: 'Verified customer renewal quotation for Acme Cloud Solutions with Net 30 payment terms and 18% standard GST applied.',
      date: 'Today, 10:14 AM',
    },
  ]);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioTranscription(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert(`Microphone permission error: ${err.message}`);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const processAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await api.transcribeAudio({
          audio: base64Data,
          mimeType: blob.type || 'audio/webm',
        });
        const text = res.transcript || 'No speech detected.';
        setTranscribedText(text);
        setTranscribeHistory((prev) => [
          {
            id: `TR-${Date.now().toString().slice(-4)}`,
            text,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ]);
      };
    } catch (err: any) {
      setTranscribedText(`Transcription error: ${err.message || 'Failed to process audio'}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 text-slate-100 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20">
              <Sparkles className="h-6 w-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white font-heading">
                  NEXORA Intelligence &amp; AI Studio
                </h1>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/30">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-turn reasoning, real-time Live voice streaming, and high-accuracy audio speech transcription.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-teal-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Multi-Turn Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-teal-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>Live Voice (3.8 Live)</span>
            </button>
            <button
              onClick={() => setActiveTab('transcribe')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'transcribe'
                  ? 'bg-teal-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>Transcribe Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: GEMINI MULTI-TURN CHATBOT                               */}
      {/* ============================================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Config Panel */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white font-heading">
              <Sliders className="h-4 w-4 text-teal-400" />
              <span>Assistant Configuration</span>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gemini Model
              </label>
              <select
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (General Tasks)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
                <option value="gemini-4-argon">gemini-4-argon (Complex Tasks)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                {chatModel === 'gemini-4-argon'
                  ? 'Best for deep mathematical & architectural reasoning.'
                  : chatModel === 'gemini-3.1-flash-lite'
                  ? 'Optimized for lowest latency quick queries.'
                  : 'Balanced performance for revenue analytics.'}
              </p>
            </div>

            {/* System Persona */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                System Role &amp; Persona
              </label>
              <select
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="financial_analyst">Chief Revenue Analyst</option>
                <option value="billing_operator">Billing Operations Specialist</option>
                <option value="customer_advisor">Customer Success Advisor</option>
              </select>
            </div>

            {/* Instruction description */}
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-teal-400 block mb-1">System Instruction Active:</span>
              {systemInstructions[systemRole]}
            </div>

            {/* Clear history */}
            <button
              onClick={() =>
                setChatMessages([
                  {
                    sender: 'model',
                    content: 'Conversation thread refreshed. What would you like to examine next?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-2 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Conversation</span>
            </button>
          </div>

          {/* Right Message Thread */}
          <div className="lg:col-span-3 flex flex-col h-[650px] rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
            {/* Thread Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white">Active Chat Thread</span>
                <span className="text-[10px] text-slate-400 font-mono">({chatModel})</span>
              </div>
              <span className="text-[11px] text-slate-400">{chatMessages.length} messages</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {chatMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        isUser
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-slate-800 text-teal-400 border border-slate-700'
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-teal-500/15 text-slate-100 border border-teal-500/30'
                          : 'bg-slate-950/90 text-slate-200 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-60">
                        <span className="font-semibold uppercase">{isUser ? 'You' : 'NEXORA AI'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-teal-400 border border-slate-700">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-slate-950/90 p-4 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
                      <span className="ml-1 text-[11px]">Reasoning with {chatModel}...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about revenue leakage, contract renewals, churn health..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="flex items-center justify-center rounded-xl bg-teal-500 p-3 text-slate-950 shadow-md shadow-teal-500/20 hover:bg-teal-400 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LIVE VOICE CONVERSATIONS (gemini-3.8-live)              */}
      {/* ============================================================== */}
      {activeTab === 'voice' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>GEMINI 3.8 LIVE API (LOW-LATENCY VOICE)</span>
            </div>

            <h2 className="text-2xl font-bold text-white font-heading">
              Real-Time Voice Assistant
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Engage in a continuous, interactive spoken dialogue. Audio is captured from your microphone at 16kHz PCM, streamed across WebSockets directly to Gemini Live, and synthesized back at 24kHz.
            </p>

            {/* Interactive Voice Orb */}
            <div className="relative py-8 flex items-center justify-center">
              <div
                className={`relative flex h-36 w-36 items-center justify-center rounded-full transition-all duration-500 ${
                  isVoiceConnected
                    ? 'bg-teal-500/20 shadow-2xl shadow-teal-500/40 ring-4 ring-teal-400/50 animate-pulse'
                    : 'bg-slate-800/80 border border-slate-700'
                }`}
              >
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full transition-colors ${
                    isVoiceConnected ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {isVoiceConnected ? <Mic className="h-10 w-10" /> : <MicOff className="h-10 w-10" />}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-slate-400">Connection Status:</span>
              <span
                className={`text-xs font-mono font-semibold ${
                  isVoiceConnected ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {voiceStatus}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isVoiceConnected ? (
                <button
                  onClick={startVoiceConversation}
                  className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/25 hover:bg-teal-400 transition-colors cursor-pointer"
                >
                  <Radio className="h-4 w-4" />
                  <span>Start Voice Conversation</span>
                </button>
              ) : (
                <button
                  onClick={stopVoiceConversation}
                  className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 transition-colors cursor-pointer"
                >
                  <MicOff className="h-4 w-4" />
                  <span>End Voice Session</span>
                </button>
              )}
            </div>

            {/* Voice Stream Log Console */}
            <div className="mt-8 text-left rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <span>Real-Time Voice Stream Events</span>
                <span className="text-[10px] font-mono text-teal-400">WebSocket /ws/live</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs font-mono text-slate-300">
                {voiceLog.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">Click &quot;Start Voice Conversation&quot; to begin audio streaming.</p>
                ) : (
                  voiceLog.map((log, i) => <p key={i}>{log}</p>)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: AUDIO SPEECH-TO-TEXT TRANSCRIPTION (gemini-3.5-transcribe) */}
      {/* ============================================================== */}
      {activeTab === 'transcribe' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recorder Controls */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-white font-heading">
              <Mic className="h-4 w-4 text-teal-400" />
              <span>Voice Dictation &amp; Recorder</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capture your voice input via microphone and transcribe it with{' '}
              <code className="text-teal-400 font-mono">gemini-3.5-transcribe</code>. Ideal for dictating subscription renewal notes and audit observations.
            </p>

            {/* Recording visualizer card */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full mb-4 transition-all ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 ring-4 ring-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Mic className="h-8 w-8" />
              </div>

              <span className="text-2xl font-mono font-bold text-white">
                00:{String(recordingSeconds).padStart(2, '0')}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {isRecording ? 'Listening and capturing audio...' : 'Microphone ready'}
              </p>
            </div>

            {/* Recording Button */}
            {!isRecording ? (
              <button
                onClick={startAudioRecording}
                disabled={isTranscribing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 hover:bg-teal-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Mic className="h-4 w-4" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopAudioRecording}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-400 transition-colors cursor-pointer"
              >
                <MicOff className="h-4 w-4" />
                <span>Stop &amp; Transcribe</span>
              </button>
            )}

            {isTranscribing && (
              <div className="flex items-center justify-center gap-2 text-xs text-teal-400 animate-pulse">
                <Sparkles className="h-4 w-4" />
                <span>Transcribing via gemini-3.5-transcribe...</span>
              </div>
            )}
          </div>

          {/* Transcript Output & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Transcript Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <span>Transcription Output</span>
                </div>
                {transcribedText && (
                  <button
                    onClick={() => copyToClipboard(transcribedText)}
                    className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}
              </div>

              <div className="min-h-36 rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {transcribedText || (
                  <span className="text-slate-500 italic">
                    Your transcribed text will appear here once audio recording is stopped.
                  </span>
                )}
              </div>
            </div>

            {/* Previous Transcriptions Log */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Saved Transcriptions History
              </h3>
              <div className="space-y-2.5">
                {transcribeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-teal-400">{item.id}</span>
                        <span className="text-[10px] text-slate-500">{item.date}</span>
                      </div>
                      <p className="text-slate-300">{item.text}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.text)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
