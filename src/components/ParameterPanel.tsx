import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Film,
  Image as ImageIcon,
  Music,
  Grid,
  Sliders,
  Camera,
  Compass,
  Wand2,
  Maximize2,
  Cpu,
  Clock,
  Zap,
  Box,
} from 'lucide-react';
import { FilterStyle } from '../utils/canvasFilters';

export type StudioMode =
  | 'variations'
  | 'video'
  | 'studio_image'
  | 'music'
  | 'three_stage';

interface ParameterPanelProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  eraPreset: string;
  onEraPresetChange: (era: string) => void;
  cameraProfile: string;
  onCameraProfileChange: (camera: string) => void;
  motionIntensity: number;
  onMotionIntensityChange: (val: number) => void;
  blendWeight: number;
  onBlendWeightChange: (val: number) => void;
  prompt: string;
  onPromptChange: (val: string) => void;
  imageSize: string;
  onImageSizeChange: (size: string) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
  onSynthesize: () => void;
  isProcessing: boolean;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
  hasSourceImage: boolean;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  currentMode,
  onModeChange,
  aspectRatio,
  onAspectRatioChange,
  eraPreset,
  onEraPresetChange,
  cameraProfile,
  onCameraProfileChange,
  motionIntensity,
  onMotionIntensityChange,
  blendWeight,
  onBlendWeightChange,
  prompt,
  onPromptChange,
  imageSize,
  onImageSizeChange,
  selectedModel,
  onSelectedModelChange,
  onSynthesize,
  isProcessing,
  onEnhancePrompt,
  isEnhancing,
  hasSourceImage,
}) => {
  const eraPresets = [
    'Cyberpunk Dystopia',
    'Renaissance Painting',
    'Steampunk Era',
    'Masterpiece Anime',
    'Hyper-Realistic 8K',
    'Synthwave 80s',
    'Dark Fantasy Gothic',
    'Claymation/Stop-Motion',
    'Surrealist Dali',
    'Minimalist Bauhaus',
    'Film Noir 35mm',
  ];

  const cameraProfiles = [
    'Slow Push-In',
    'Orbital Crane',
    'Drone Hyperlapse',
    '360 Dutch Angle',
    'Handheld Shaky-Cam',
    'Macro Zoom Pull',
    'Whip Pan Dynamic',
    'Cinematic Dolly Zoom',
  ];

  const aspectRatios = [
    { ratio: '16:9', label: '16:9 Widescreen', sub: 'Cinema/Desktop' },
    { ratio: '9:16', label: '9:16 Vertical', sub: 'Short/Social' },
    { ratio: '1:1', label: '1:1 Square', sub: 'Feed/Square' },
    { ratio: '2.39:1', label: '2.39:1 Scope', sub: 'Anamorphic' },
    { ratio: '4:3', label: '4:3 Classic', sub: 'Standard' },
    { ratio: '21:9', label: '21:9 Ultra', sub: 'Ultra-Wide' },
  ];

  const imageSizes = ['1K', '2K', '4K'];

  const quickPromptTags = [
    '+Volumetric Fog',
    '+Panavision 35mm',
    '+Octane 8K',
    '+God Rays',
    '+Chiaroscuro',
    '+Iridescent Chrome',
  ];

  return (
    <div className="bg-[#0b0c1b] border border-cyan-900/30 rounded-2xl p-5 space-y-6 shadow-xl">
      {/* 1. CONFIGURATION PROFILES SELECTOR */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Configuration Profile
          </span>
          <span className="text-[10px] font-mono text-cyan-400">ACTIVE ENGINE</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Mode 1: Variations */}
          <button
            onClick={() => onModeChange('variations')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              currentMode === 'variations'
                ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border-cyan-400 shadow-lg shadow-cyan-950/50 text-white'
                : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Grid className="w-4 h-4 text-cyan-400" />
              {currentMode === 'variations' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight">Infinite Variations</p>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Matrix Grid</span>
          </button>

          {/* Mode 2: Video */}
          <button
            onClick={() => onModeChange('video')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              currentMode === 'video'
                ? 'bg-gradient-to-br from-rose-950/80 to-purple-950/80 border-rose-400 shadow-lg shadow-rose-950/50 text-white'
                : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Film className="w-4 h-4 text-rose-400" />
              {currentMode === 'video' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight">4K Video</p>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Text/Photo</span>
          </button>

          {/* Mode 3: Studio Image */}
          <button
            onClick={() => onModeChange('studio_image')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              currentMode === 'studio_image'
                ? 'bg-gradient-to-br from-indigo-950/80 to-cyan-950/80 border-indigo-400 shadow-lg shadow-indigo-950/50 text-white'
                : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              {currentMode === 'studio_image' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight">Studio Image</p>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">1K / 2K / 4K</span>
          </button>

          {/* Mode 4: Music & Soundtrack */}
          <button
            onClick={() => onModeChange('music')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              currentMode === 'music'
                ? 'bg-gradient-to-br from-fuchsia-950/80 to-purple-950/80 border-fuchsia-400 shadow-lg shadow-fuchsia-950/50 text-white'
                : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Music className="w-4 h-4 text-fuchsia-400" />
              {currentMode === 'music' && (
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight">Soundtrack</p>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Lyria Music</span>
          </button>

          {/* Mode 5: Three.js 3D Virtual Production Stage */}
          <button
            onClick={() => onModeChange('three_stage')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              currentMode === 'three_stage'
                ? 'bg-gradient-to-br from-emerald-950/80 to-cyan-950/80 border-emerald-400 shadow-lg shadow-emerald-950/50 text-white'
                : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Box className="w-4 h-4 text-emerald-400" />
              {currentMode === 'three_stage' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight">3D Stage</p>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Three.js PBR</span>
          </button>
        </div>
      </div>

      {/* 2. ASPECT RATIO MATRICES */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            Aspect Ratio Profile
          </span>
          <span className="text-[10px] font-mono text-cyan-400">{aspectRatio}</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {aspectRatios.map((item) => (
            <button
              key={item.ratio}
              onClick={() => onAspectRatioChange(item.ratio)}
              className={`p-2 rounded-xl border text-left transition-all ${
                aspectRatio === item.ratio
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/40'
                  : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[10px] font-mono opacity-60">{item.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. DROPDOWN ARRAYS: ERA PRESETS & CAMERA PROFILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Style / Historical Era */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Historical Era / Style Preset
          </label>
          <select
            value={eraPreset}
            onChange={(e) => onEraPresetChange(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl bg-[#121429] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {eraPresets.map((era) => (
              <option key={era} value={era}>
                {era}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Profile */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            Camera Motion Profile
          </label>
          <select
            value={cameraProfile}
            onChange={(e) => onCameraProfileChange(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl bg-[#121429] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {cameraProfiles.map((cam) => (
              <option key={cam} value={cam}>
                {cam}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. CREATIVE METADATA ENGINE: SLIDERS */}
      <div className="space-y-4 pt-2 border-t border-slate-800/80">
        {/* Motion Intensity Scale (1 to 10) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Motion Intensity Scale
            </span>
            <span className="font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
              {motionIntensity} / 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={motionIntensity}
            onChange={(e) => onMotionIntensityChange(Number(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1 (Subtle Cinematic Drift)</span>
            <span>5 (Balanced Dynamics)</span>
            <span>10 (Aggressive Kinetic Surge)</span>
          </div>
        </div>

        {/* Stylization Blend Weight (0.0 to 1.0) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Stylization Blend Weight
            </span>
            <span className="font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
              {(blendWeight * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={blendWeight}
            onChange={(e) => onBlendWeightChange(Number(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0% (Raw Source Passthrough)</span>
            <span>50% (Organic Equilibrium)</span>
            <span>100% (Pure Stylistic Matrix)</span>
          </div>
        </div>
      </div>

      {/* 5. RESOLUTION & MODEL SETTINGS (Dynamic per mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        {/* Model Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Target Generative Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onSelectedModelChange(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl bg-[#121429] border border-slate-800 text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {currentMode === 'video' ? (
              <option value="gemini-omni-1.2-flash">gemini-omni-1.2-flash (Interactions API)</option>
            ) : currentMode === 'music' ? (
              <>
                <option value="lyria-3-clip-preview">lyria-3-clip-preview (30s Clips)</option>
                <option value="lyria-3-pro-preview">lyria-3-pro-preview (Full Tracks)</option>
              </>
            ) : (
              <>
                <option value="gemini-3-pro-image-preview">
                  gemini-3-pro-image-preview (Studio 4K Quality)
                </option>
                <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1 (Ultra High Fidelity)</option>
                <option value="gemini-3.1-flash-lite-image">
                  gemini-3.1-flash-lite-image (High Speed)
                </option>
              </>
            )}
          </select>
        </div>

        {/* Resolution selector (for Studio Image or Video) */}
        {currentMode === 'studio_image' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              Target Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {imageSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => onImageSizeChange(s)}
                  className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors ${
                    imageSize === s
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-[#121429] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. PROMPT CONTEXT OVERRIDE FIELD WITH AI ENHANCER */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            Prompt Context Override
          </label>

          <button
            onClick={onEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white text-[11px] font-semibold transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
            title="Use Gemini 3.8 Flash to inject cinematic specs"
          >
            <Sparkles className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
            {isEnhancing ? 'Enhancing...' : 'AI Prompt Enhancer'}
          </button>
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe your scene or creative intent (e.g. Cybernetic street runner in neon rain with volumetric lighting...)"
          className="w-full text-xs p-3 rounded-xl bg-[#121429] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
        />

        {/* Quick prompt token chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
          <span className="text-slate-500 font-mono">TOKENS:</span>
          {quickPromptTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onPromptChange(prompt ? `${prompt}, ${tag.replace('+', '')}` : tag.replace('+', ''))}
              className="px-2 py-0.5 rounded-md bg-[#161834] border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 7. PRIMARY MASTER ACTION BUTTON */}
      <button
        onClick={onSynthesize}
        disabled={isProcessing}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-xl shadow-cyan-600/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
      >
        <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
        {isProcessing
          ? 'Executing Neural Pipeline...'
          : currentMode === 'three_stage'
          ? 'Capture 3D Frame & Synthesize 4K Output'
          : currentMode === 'video'
          ? 'Generate 4K Video (Text or Photo)'
          : currentMode === 'music'
          ? 'Synthesize Soundtrack (Lyria)'
          : currentMode === 'variations'
          ? 'Generate Matrix Variations (4K)'
          : 'Synthesize Studio Quality Image'}
      </button>
    </div>
  );
};
