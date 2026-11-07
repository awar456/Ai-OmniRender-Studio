import React, { useState } from 'react';
import {
  X,
  Trash2,
  Download,
  Film,
  Image as ImageIcon,
  Music,
  Grid,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
} from 'lucide-react';
import { GenerationRecord } from '../services/db';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  records: GenerationRecord[];
  onSelectRecord: (record: GenerationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch =
      !searchQuery ||
      r.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-rose-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />;
      case 'variations':
        return <Grid className="w-3.5 h-3.5 text-amber-400" />;
      case 'music':
        return <Music className="w-3.5 h-3.5 text-fuchsia-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0a0b17] border-l border-cyan-900/40 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1022]">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Historical Gallery</h2>
            <p className="text-[11px] text-cyan-400/80 font-mono">IndexedDB Local Cache</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {records.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all cached generation records from IndexedDB?')) {
                  onClearAll();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
              title="Clear all records"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 border-b border-slate-800/80 bg-[#0c0d1e] space-y-2">
        <input
          type="text"
          placeholder="Filter by prompt or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs px-3 py-1.5 rounded-lg bg-[#14162e] border border-slate-700/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          {['all', 'video', 'image', 'variations', 'music'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-30 text-cyan-400" />
            <p className="text-xs">No generations cached yet.</p>
            <p className="text-[11px] text-slate-600">
              Attach media and run any mode to start recording local history.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group relative bg-[#111326] border border-slate-800/80 hover:border-cyan-500/50 rounded-xl p-3 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-950/40"
              onClick={() => {
                onSelectRecord(item);
                onClose();
              }}
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail Preview */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/60 border border-slate-800 flex-shrink-0">
                  {item.type === 'video' ? (
                    item.outputUrl.startsWith('data:video') ? (
                      <video
                        src={item.outputUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={item.sourceImage || item.outputUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : item.type === 'music' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-fuchsia-950 p-2">
                      <Music className="w-6 h-6 text-fuchsia-400" />
                      <span className="text-[9px] font-mono text-fuchsia-300 mt-1">AUDIO</span>
                    </div>
                  ) : (
                    <img
                      src={item.outputUrl || item.sourceImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm flex items-center gap-1">
                    {getTypeIcon(item.type)}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {item.prompt || 'No prompt specified'}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a1c36] text-slate-300 border border-slate-700/50">
                      {item.metadata.aspectRatio}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1c36] text-slate-300 border border-slate-700/50">
                      {item.metadata.eraPreset}
                    </span>
                    {item.metadata.cameraProfile && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                        {item.metadata.cameraProfile}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover Actions */}
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-cyan-400 flex items-center gap-1 group-hover:underline">
                  Restore to Studio <ChevronRight className="w-3 h-3" />
                </span>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {item.outputUrl && (
                    <a
                      href={item.outputUrl}
                      download={`omni_${item.type}_${item.id}.${
                        item.type === 'video' ? 'mp4' : item.type === 'music' ? 'mp3' : 'png'
                      }`}
                      className="p-1 hover:text-cyan-400 transition-colors"
                      title="Download artifact"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => onDeleteRecord(item.id)}
                    className="p-1 hover:text-rose-400 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-800/80 bg-[#0a0b16] text-[11px] text-slate-500 text-center font-mono">
        Total Items: {records.length} • Stored locally in Browser
      </div>
    </aside>
  );
};
