import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Cpu,
  Clapperboard,
  Camera,
  Wand2,
  Box,
} from 'lucide-react';
import { ChatMessage, saveChatMessage, getChatHistory, clearChatHistory } from '../services/db';

interface DirectorChatProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (promptText: string) => void;
  currentPrompt: string;
}

export const DirectorChat: React.FC<DirectorChatProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
  currentPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<
    'Creative Director' | 'Cinematographer' | 'Prompt Architect' | '3D Stage Supervisor'
  >('Creative Director');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat history from IndexedDB
    const loadHistory = async () => {
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Add default welcome message
          const welcomeMsg: ChatMessage = {
            id: 'welcome-1',
            role: 'assistant',
            content:
              "Welcome to OmniRender AI Studio Pro. I am your Generative Director & VFX Architect. How can I assist you with scene composition, camera movement, or prompt engineering today?",
            model: 'gemini-3.8-flash',
            agentRole: 'Creative Director',
            timestamp: Date.now(),
          };
          setMessages([welcomeMsg]);
          saveChatMessage(welcomeMsg);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      model: selectedModel,
      agentRole: selectedRole,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      await saveChatMessage(userMessage);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10), // Send last 10 for context
          role: selectedRole,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chat request failed');
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        model: selectedModel,
        agentRole: selectedRole,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
      await saveChatMessage(botMessage);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error coordinating with ${selectedModel}: ${error.message || 'Please check API connection.'}`,
        model: selectedModel,
        agentRole: selectedRole,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Suggest cinematic lighting & camera movement for my current scene',
    'Write a production-grade 4K prompt with Panavision anamorphic optics',
    'Recommend musical soundtrack mood & BPM for this scene',
  ];

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#0a0b17] border-l border-indigo-900/40 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1024]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0e1c] rounded-[7px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Gemini Director AI
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-fuchsia-950/80 border border-fuchsia-500/30 text-fuchsia-300">
                Multi-Turn
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Cinematic Prompt & VFX Consultant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              if (confirm('Clear Director conversation history?')) {
                await clearChatHistory();
                setMessages([]);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
            title="Clear Chat History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role & Model Controls */}
      <div className="p-3 border-b border-slate-800/80 bg-[#0c0d1e] space-y-2 text-xs">
        {/* Role Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Role:</span>
          {(['Creative Director', 'Cinematographer', 'Prompt Architect', '3D Stage Supervisor'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                selectedRole === r
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-[#14162e]'
              }`}
            >
              {r === 'Creative Director' && <Clapperboard className="w-3 h-3 inline mr-1" />}
              {r === 'Cinematographer' && <Camera className="w-3 h-3 inline mr-1" />}
              {r === 'Prompt Architect' && <Wand2 className="w-3 h-3 inline mr-1" />}
              {r === '3D Stage Supervisor' && <Box className="w-3 h-3 inline mr-1" />}
              {r.replace(' Stage', '')}
            </button>
          ))}
        </div>

        {/* Model Selector */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Gemini Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-2 py-1 rounded bg-[#14162e] border border-slate-700/60 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (General Tasks)</option>
            <option value="gemini-4-argon">gemini-4-argon (Complex STEM & Reasoning)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
          </select>
        </div>
      </div>

      {/* Messages Scroll Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 font-mono">
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-cyan-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-fuchsia-400" />
                  <span className="text-fuchsia-400 font-semibold">{msg.agentRole}</span>
                  <span>• {msg.model}</span>
                </>
              )}
            </div>

            <div
              className={`relative group max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                  : 'bg-[#13152a] text-slate-200 border border-slate-800 rounded-tl-none shadow-md'
              }`}
            >
              {msg.content}

              {msg.role === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <button
                    onClick={() => onApplyPrompt(msg.content)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                    title="Apply text to Studio Prompt Context"
                  >
                    Apply to Studio <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-fuchsia-400 p-2 rounded-lg bg-fuchsia-950/20 border border-fuchsia-900/30 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Director is analyzing camera vectors and generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="p-2 border-t border-slate-800/80 bg-[#0b0c1b] flex items-center gap-1 overflow-x-auto text-[10px]">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-full bg-[#151730] border border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-[#0e1022]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask ${selectedRole.toLowerCase()} about cinematography, prompt, or VFX...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-[#14162e] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-fuchsia-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
