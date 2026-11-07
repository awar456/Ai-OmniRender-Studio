import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Layers,
  MessageSquare,
  ShieldCheck,
  Activity,
  Cpu,
  History,
  Film,
  Music,
  Camera,
} from 'lucide-react';

interface HeaderProps {
  onToggleHistory: () => void;
  onToggleChat: () => void;
  historyCount: number;
  isChatOpen: boolean;
  isHistoryOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleHistory,
  onToggleChat,
  historyCount,
  isChatOpen,
  isHistoryOpen,
}) => {
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(38);

  useEffect(() => {
    const checkStatus = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const end = performance.now();
          setLatencyMs(Math.round(end - start));
          setServerOnline(true);
        }
      } catch {
        setServerOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#0b0c16]/90 backdrop-blur-md border-b border-cyan-900/30 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0d0e1c] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                OmniRender <span className="text-cyan-400">AI Studio</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold uppercase tracking-wider">
                PRO 4K
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Generative Media Engine • Multimodal Neural Processing
            </p>
          </div>
        </div>

        {/* Server Status & Capabilities HUD */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121324] border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Neural Bridge:</span>
            <span className="text-cyan-300 font-mono font-medium">Gemini Omni & Pro</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121324] border border-slate-800 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="text-emerald-400 font-mono">{latencyMs}ms</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server Proxy Active</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* History Gallery Button */}
          <button
            onClick={onToggleHistory}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isHistoryOpen
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25'
                : 'bg-[#15162a] text-slate-300 hover:bg-[#1f213d] hover:text-white border border-slate-800'
            }`}
            title="Open Historical Gallery (IndexedDB)"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Gallery</span>
            {historyCount > 0 && (
              <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[10px] px-1.5 py-0.2 rounded-full border border-cyan-500/40">
                {historyCount}
              </span>
            )}
          </button>

          {/* AI Director Chat Button */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isChatOpen
                ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-[#15162a] text-slate-300 hover:bg-[#1f213d] hover:text-white border border-slate-800'
            }`}
            title="Open AI Director Assistant"
          >
            <MessageSquare className="w-4 h-4 text-fuchsia-400" />
            <span className="hidden sm:inline">Director AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
