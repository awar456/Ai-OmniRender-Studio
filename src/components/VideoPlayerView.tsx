import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Film,
  Camera,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { calculateCameraFrame, renderCanvasWithFilters } from '../utils/canvasFilters';

interface VideoPlayerViewProps {
  sourceImage: HTMLImageElement | null;
  videoUrl?: string; // MP4 data URL if generated
  cameraProfile: string;
  motionIntensity: number;
  aspectRatio: string;
  resolution: string;
  onGenerateVideo: () => void;
  isGenerating: boolean;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  sourceImage,
  videoUrl,
  cameraProfile,
  motionIntensity,
  aspectRatio,
  resolution,
  onGenerateVideo,
  isGenerating,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10); // 10s default
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);

  // Simulation animation frame loop when displaying canvas camera kinematics
  useEffect(() => {
    if (videoUrl) return; // If real video exists, use video element
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const totalDur = duration || 10;
      const rawProgress = (elapsed * playbackRate) % totalDur;
      const normalizedProgress = rawProgress / totalDur;

      if (isPlaying) {
        setCurrentTime(rawProgress);
      }

      // Calculate camera transformation offsets
      const cam = calculateCameraFrame(cameraProfile, normalizedProgress, motionIntensity);

      renderCanvasWithFilters(
        ctx,
        sourceImage,
        canvas.width,
        canvas.height,
        {
          zoom: cam.zoomOffset,
          panX: cam.panXOffset,
          panY: cam.panYOffset,
          rotation: cam.rotOffset,
          flipH: false,
          flipV: false,
          blendWeight: 0.7,
          filterStyle: 'anamorphic',
        },
        aspectRatio
      );

      // Draw Camera Vector HUD
      if (showHUD) {
        drawCameraHUD(ctx, canvas.width, canvas.height, cam, normalizedProgress, cameraProfile);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [videoUrl, sourceImage, isPlaying, cameraProfile, motionIntensity, aspectRatio, playbackRate, duration, showHUD]);

  // Handle native video time updates
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 10);
    }
  };

  const togglePlay = () => {
    if (videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoUrl && videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoUrl && videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="space-y-3">
      {/* Presentation Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-cyan-900/40 shadow-2xl flex items-center justify-center group">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className={`w-full max-h-[580px] object-contain ${
              aspectRatio === '9:16' ? 'max-w-sm mx-auto' : ''
            }`}
            autoPlay
            loop={isLooping}
            muted={isMuted}
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={() => !isLooping && setIsPlaying(false)}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={aspectRatio === '9:16' ? 720 : 1280}
            height={aspectRatio === '9:16' ? 1280 : 720}
            className={`w-full max-h-[580px] object-contain ${
              aspectRatio === '9:16' ? 'max-w-sm mx-auto' : ''
            }`}
          />
        )}

        {/* Top Floating HUD Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 shadow-md">
              <Film className="w-3 h-3 text-cyan-400 animate-pulse" />
              {videoUrl ? 'OMNI-FLASH 4K RENDER' : 'TEMPORAL KINEMATIC SIMULATOR'}
            </span>
            <span className="px-2 py-1 rounded-md bg-black/75 backdrop-blur-md border border-slate-700/60 text-slate-300 font-mono text-[11px]">
              {aspectRatio} • {resolution}
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowHUD(!showHUD)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono border backdrop-blur-md transition-colors ${
                showHUD
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-black/60 text-slate-400 border-slate-700'
              }`}
            >
              HUD {showHUD ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Generate / Animate Overlay Button when idle */}
        {!videoUrl && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto">
            <button
              onClick={onGenerateVideo}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 via-purple-600 to-cyan-600 text-white font-bold text-xs tracking-wide hover:brightness-110 disabled:opacity-50 transition-all shadow-xl shadow-purple-900/50 flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating
                ? 'Synthesizing with gemini-omni-1.2-flash...'
                : sourceImage
                ? 'Animate Photo into 4K Video via Gemini Omni'
                : 'Generate 4K Video from Text via Gemini Omni'}
            </button>
          </div>
        )}
      </div>

      {/* Playback Scrubber & Professional Deck */}
      <div className="bg-[#0e1022] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        {/* Scrubber Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-cyan-300">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span>CAMERA: {cameraProfile.toUpperCase()}</span>
              <span>•</span>
              <span>MOTION: {motionIntensity}/10</span>
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Player Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-600/30"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setCurrentTime(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="p-2 rounded-lg bg-[#161834] text-slate-300 hover:text-white transition-colors"
              title="Rewind to start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {videoUrl && (
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-2 rounded-lg bg-[#161834] text-slate-300 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                isLooping
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-[#161834] text-slate-400 border-slate-800'
              }`}
            >
              LOOP
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#14162e] p-1 rounded-lg border border-slate-800">
            {[0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackRate === s
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Download Artifact */}
          {videoUrl && (
            <a
              href={videoUrl}
              download={`omni_video_${Date.now()}.mp4`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Draws cinematic HUD crosshairs, pitch/yaw telemetry and vector lines
 */
function drawCameraHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cam: any,
  progress: number,
  profile: string
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 1;

  // Center crosshair
  const cx = w / 2;
  const cy = h / 2;
  const size = 24;

  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.moveTo(cx + 8, cy);
  ctx.lineTo(cx + size, cy);
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy - 8);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();

  // Corner brackets
  const inset = 40;
  const cornerLen = 20;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(inset, inset + cornerLen);
  ctx.lineTo(inset, inset);
  ctx.lineTo(inset + cornerLen, inset);
  // Top-right
  ctx.moveTo(w - inset - cornerLen, inset);
  ctx.lineTo(w - inset, inset);
  ctx.lineTo(w - inset, inset + cornerLen);
  // Bottom-left
  ctx.moveTo(inset, h - inset - cornerLen);
  ctx.lineTo(inset, h - inset);
  ctx.lineTo(inset + cornerLen, h - inset);
  // Bottom-right
  ctx.moveTo(w - inset - cornerLen, h - inset);
  ctx.lineTo(w - inset, h - inset);
  ctx.lineTo(w - inset, h - inset - cornerLen);
  ctx.stroke();

  // Telemetry Text
  ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.font = '11px monospace';
  ctx.fillText(`VECTOR: ${profile.toUpperCase()}`, inset + 10, inset + 25);
  ctx.fillText(`ZOOM: ${(cam.zoomOffset || 1.0).toFixed(2)}x`, inset + 10, inset + 42);
  ctx.fillText(`PAN_X: ${(cam.panXOffset || 0).toFixed(1)}px`, inset + 10, inset + 59);
  ctx.fillText(`ROT: ${(cam.rotOffset || 0).toFixed(2)}°`, inset + 10, inset + 76);

  ctx.fillText(`FPS: 60`, w - inset - 90, inset + 25);
  ctx.fillText(`REC: [TEMPORAL]`, w - inset - 90, inset + 42);
  ctx.restore();
}
