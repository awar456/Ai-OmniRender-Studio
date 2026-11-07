import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  Music,
  Disc3,
  FileText,
} from 'lucide-react';

interface AudioPlayerVisualizerProps {
  audioUrl: string;
  lyrics?: string;
  title?: string;
  modelUsed?: string;
}

export const AudioPlayerVisualizer: React.FC<AudioPlayerVisualizerProps> = ({
  audioUrl,
  lyrics,
  title = 'AI Generated Soundtrack',
  modelUsed = 'lyria-3-clip-preview',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);

  // Audio waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 48;
      const barWidth = canvas.width / numBars - 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);

        // Calculate dynamic height based on playing state
        let height = 4;
        if (isPlaying) {
          const freq = Math.sin(phase + i * 0.25) * 0.5 + 0.5;
          const bass = Math.cos(phase * 1.5 + i * 0.1) * 0.3 + 0.7;
          height = Math.max(6, (freq * bass * (canvas.height * 0.85)));
        } else {
          // Resting waveform
          const staticWave = Math.sin(i * 0.2) * 0.3 + 0.5;
          height = staticWave * 20;
        }

        const grad = ctx.createLinearGradient(0, centerY - height / 2, 0, centerY + height / 2);
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#06b6d4');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, centerY - height / 2, barWidth, height, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.12;
      }
      animId = requestAnimationFrame(renderWaveform);
    };

    renderWaveform();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#0f1124] border border-fuchsia-900/40 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center p-[1px]">
            <div className="w-full h-full bg-[#12142b] rounded-[11px] flex items-center justify-center">
              <Disc3 className={`w-5 h-5 text-fuchsia-400 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide truncate max-w-xs">{title}</h4>
            <p className="text-[11px] text-fuchsia-400 font-mono flex items-center gap-1.5">
              <span>{modelUsed}</span>
              <span>•</span>
              <span>44.1kHz Hi-Fi Stereo</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lyrics && (
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showLyrics
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
                  : 'bg-[#181a36] text-slate-300 border-slate-700/60 hover:text-white'
              }`}
              title="Toggle lyrics & track metadata"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lyrics</span>
            </button>
          )}

          <a
            href={audioUrl}
            download={`omni_soundtrack_${Date.now()}.mp3`}
            className="p-2 rounded-lg bg-[#181a36] text-slate-300 border border-slate-700/60 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
            title="Download Audio Track"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="h-16 rounded-xl bg-[#090a14] border border-slate-800/80 p-2 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={480} height={64} className="w-full h-full" />
      </div>

      {/* Controls & Scrubber */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 30}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-fuchsia-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = 0;
              }}
              className="hover:text-white"
              title="Replay from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:scale-105 transition-transform shadow-lg shadow-fuchsia-600/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="hover:text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Lyrics Drawer */}
      {showLyrics && lyrics && (
        <div className="p-3 rounded-xl bg-[#0a0b17] border border-fuchsia-950/60 text-xs text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed animate-in fade-in duration-150">
          <p className="font-semibold text-fuchsia-400 mb-1 font-mono text-[11px]">GENERATED LYRICS & MOOD:</p>
          {lyrics}
        </div>
      )}
    </div>
  );
};
