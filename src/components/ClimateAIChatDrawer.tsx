import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  HelpCircle, 
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { LocationProfile } from '../types/climate';
import { sendClimateChatMessage, fetchAiConfig } from '../services/api';

interface ClimateAIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationProfile;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ClimateAIChatDrawer: React.FC<ClimateAIChatDrawerProps> = ({
  isOpen,
  onClose,
  location
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I am your AI Climate Intelligence & Resilience Copilot for **${location.name}**. You can ask me about real-time hydrology, flood gate deployment protocols, agricultural drought mitigation strategies, SME business continuity plans, or TCFD risk reporting. How can I assist your operations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLabel, setModelLabel] = useState('OpenAI (gpt-oss-20b:free)');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAiConfig().then((cfg) => {
      if (cfg) {
        const shortModel = cfg.model.replace(/^openai\//, '');
        setModelLabel(`${cfg.provider === 'openai' ? 'OpenRouter/OpenAI' : 'Gemini'} • ${shortModel}`);
      }
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const quickPrompts = [
    'What are the priority flood defenses for riverside SMEs?',
    'Explain how SPEI -1.82 affects crop yield & soil moisture.',
    'What are the emergency SOPs when river stage exceeds 4.5m?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setLoading(true);

    try {
      // Build conversation history format
      const history = messages.map(m => ({
        role: m.role,
        text: m.content
      }));

      const reply = await sendClimateChatMessage({
        message: query,
        locationContext: `${location.name}, ${location.country}. Elevation: ${location.elevationM}m. Basin: ${location.riverBasin || 'None'}. Primary Hazard: ${location.primaryRisk}. Vulnerability: ${location.vulnerabilityIndex}/100.`,
        conversationHistory: history
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply || 'I apologize, I could not retrieve climate analysis for that query at this time.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="climate-ai-chat-drawer" className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[560px] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Climate Resilience AI Copilot
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-teal-300/80 font-mono truncate max-w-[220px]">{modelLabel} • {location.name}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-teal-950 border border-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-teal-400" />
              </div>
            )}
            <div
              className={`max-w-[82%] p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-teal-600 text-slate-950 font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}
            >
              <div>{m.content}</div>
              <div className={`text-[9px] mt-1 text-right ${m.role === 'user' ? 'text-teal-950/70' : 'text-slate-500'}`}>
                {m.timestamp}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-[11px]">
            <Bot className="w-4 h-4 text-teal-400" />
            <span className="flex items-center gap-1">
              Analyzing climatological data models <RefreshCw className="w-3 h-3 animate-spin" />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI Copilot about flood defense, drought, SOPs..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="p-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-slate-950 rounded-xl transition-colors font-bold shadow-md shadow-teal-950/50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
