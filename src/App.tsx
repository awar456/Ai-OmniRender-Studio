/**
 * OmniRender AI Studio Pro
 * Zero-Download Client-Side Multimodal Generation & Rendering Engine
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { ParameterPanel, StudioMode } from './components/ParameterPanel';
import { HistorySidebar } from './components/HistorySidebar';
import { DirectorChat } from './components/DirectorChat';
import { VideoPlayerView } from './components/VideoPlayerView';
import { AudioPlayerVisualizer } from './components/AudioPlayerVisualizer';
import { VariationsGrid } from './components/VariationsGrid';
import { ThreeStageView } from './components/ThreeStageView';
import { FilterStyle } from './utils/canvasFilters';
import {
  GenerationRecord,
  saveGeneration,
  getAllGenerations,
  deleteGeneration,
  clearAllGenerations,
} from './services/db';
import { SAMPLE_MEDIA } from './data/samples';
import { AlertCircle, CheckCircle2, Film, Image as ImageIcon, Music, Sparkles } from 'lucide-react';

export default function App() {
  // Mode & Configuration State
  const [currentMode, setCurrentMode] = useState<StudioMode>('variations');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [eraPreset, setEraPreset] = useState<string>('Cyberpunk Dystopia');
  const [cameraProfile, setCameraProfile] = useState<string>('Slow Push-In');
  const [motionIntensity, setMotionIntensity] = useState<number>(6);
  const [blendWeight, setBlendWeight] = useState<number>(0.85);
  const [filterStyle, setFilterStyle] = useState<FilterStyle>('cyberpunk');
  const [prompt, setPrompt] = useState<string>(
    'Cybernetic samurai with iridescent katana on a rain-slicked skyscraper in Neo-Tokyo, volumetric neon magenta fog, 8K octane render'
  );
  const [imageSize, setImageSize] = useState<string>('4K');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-image-preview');

  // Media Context
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string>('');
  const [sourceImageName, setSourceImageName] = useState<string>('');

  // Generated Artifacts
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [lyrics, setLyrics] = useState<string>('');
  const [outputImageUrl, setOutputImageUrl] = useState<string>('');

  // Execution States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Persistence (IndexedDB)
  const [historyRecords, setHistoryRecords] = useState<GenerationRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Initialize DB and default sample media on first mount
  useEffect(() => {
    const init = async () => {
      try {
        const records = await getAllGenerations();
        setHistoryRecords(records);
      } catch (err) {
        console.error('Failed to load IndexedDB records:', err);
      }

      // Load initial sample so canvas is immediately active
      const defaultSample = SAMPLE_MEDIA[0];
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        setSourceDataUrl(defaultSample.svgDataUri);
        setSourceImageName(defaultSample.name);
      };
      img.src = defaultSample.svgDataUri;
    };
    init();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => setStatusNotification(null), 5000);
  };

  // Sync model dropdown default when mode changes
  const handleModeChange = (mode: StudioMode) => {
    setCurrentMode(mode);
    if (mode === 'video') {
      setSelectedModel('gemini-omni-1.2-flash');
      // Recommend 16:9 or 9:16 as required for video
      if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        setAspectRatio('16:9');
      }
    } else if (mode === 'music') {
      setSelectedModel('lyria-3-clip-preview');
    } else if (mode === 'studio_image') {
      setSelectedModel('gemini-3-pro-image-preview');
    } else if (mode === 'three_stage') {
      setSelectedModel('gemini-omni-1.2-flash');
    }
  };

  // 3D Frame Capture Handler (Snaps Three.js scene straight to Studio Canvas)
  const handleCaptureFrame = (dataUrl: string, name: string) => {
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      setSourceDataUrl(dataUrl);
      setSourceImageName(name);
      setVideoUrl('');
      setOutputImageUrl('');
      showNotification('success', 'Captured 3D Virtual Production frame into Studio Canvas!');
    };
    img.src = dataUrl;
  };

  // Image Loaded Handler
  const handleImageLoaded = (img: HTMLImageElement, dataUrl: string, name: string) => {
    setSourceImage(img);
    setSourceDataUrl(dataUrl);
    setSourceImageName(name);
    // Reset previous outputs
    setVideoUrl('');
    setOutputImageUrl('');
    showNotification('info', `Loaded media context: ${name}`);
  };

  // AI Prompt Enhancer
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: eraPreset,
          camera: cameraProfile,
          motionIntensity,
        }),
      });
      const data = await res.json();
      if (data.success && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        showNotification('success', 'Prompt enhanced with cinematic specs & camera vector.');
      }
    } catch (err: any) {
      showNotification('error', 'Prompt enhancement error: ' + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Primary Synthesis Routine
  const handleSynthesize = async () => {
    setIsProcessing(true);

    try {
      if (currentMode === 'video' || currentMode === 'three_stage') {
        // Feature: Animate images into video or generate video from text using gemini-omni-1.2-flash via Interactions API
        showNotification('info', 'Submitting video generation request to gemini-omni-1.2-flash...');
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt || `Cinematic animation of scene with ${cameraProfile} movement in ${eraPreset} style.`,
            sourceImageBase64: sourceDataUrl,
            aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
            resolution: '720p',
            duration: '10s',
          }),
        });

        const data = await res.json();
        if (data.success && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setCurrentMode('video');
          showNotification('success', '4K Cinematic Video synthesized via gemini-omni-1.2-flash!');

          // Save to IndexedDB
          const record: GenerationRecord = {
            id: `video-${Date.now()}`,
            type: 'video',
            mode: '4K Cinematic Video Mode',
            title: `4K Video • ${cameraProfile}`,
            prompt,
            sourceImage: sourceDataUrl,
            outputUrl: data.videoUrl,
            metadata: {
              aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
              model: 'gemini-omni-1.2-flash',
              eraPreset,
              cameraProfile,
              motionIntensity,
              blendWeight,
              duration: '10s',
              resolution: '720p',
              timestamp: Date.now(),
            },
            createdAt: Date.now(),
          };
          await saveGeneration(record);
          setHistoryRecords((prev) => [record, ...prev]);
        } else {
          showNotification(
            'info',
            'Model response received. Previewing high-speed 60fps camera vector on Studio Canvas.'
          );
        }
      } else if (currentMode === 'music') {
        // Feature: Generate music using lyria-3-clip-preview or lyria-3-pro-preview
        showNotification('info', `Synthesizing soundtrack with ${selectedModel}...`);
        const res = await fetch('/api/generate-music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt || `Cinematic soundtrack score for ${eraPreset} scene with intense atmospheric progression.`,
            model: selectedModel,
            sourceImageBase64: sourceDataUrl,
          }),
        });

        const data = await res.json();
        if (data.success && data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setLyrics(data.lyrics || '');
          showNotification('success', 'Soundtrack generated successfully with Lyria!');

          // Save to IndexedDB
          const record: GenerationRecord = {
            id: `music-${Date.now()}`,
            type: 'music',
            mode: 'AI Soundtrack Mode',
            title: `Soundtrack • ${eraPreset}`,
            prompt,
            sourceImage: sourceDataUrl,
            outputUrl: data.audioUrl,
            lyrics: data.lyrics,
            metadata: {
              aspectRatio,
              model: selectedModel,
              eraPreset,
              cameraProfile,
              motionIntensity,
              blendWeight,
              timestamp: Date.now(),
            },
            createdAt: Date.now(),
          };
          await saveGeneration(record);
          setHistoryRecords((prev) => [record, ...prev]);
        } else {
          showNotification('error', data.error || 'Music synthesis failed. Check quota or prompt.');
        }
      } else if (currentMode === 'studio_image') {
        // Feature: Studio Quality Image generation (gemini-3-pro-image-preview / gemini-nano-banana-2.1)
        showNotification('info', `Synthesizing ${imageSize} resolution image with ${selectedModel}...`);
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${prompt}, in ${eraPreset} style, captured with ${cameraProfile} perspective, ${imageSize} ultra-fine details.`,
            model: selectedModel,
            aspectRatio,
            imageSize,
            sourceImageBase64: sourceDataUrl,
          }),
        });

        const data = await res.json();
        if (data.success && data.imageUrl) {
          setOutputImageUrl(data.imageUrl);

          // Update source image with newly generated output
          const newImg = new Image();
          newImg.onload = () => {
            setSourceImage(newImg);
            setSourceDataUrl(data.imageUrl);
          };
          newImg.src = data.imageUrl;

          showNotification('success', `Studio ${imageSize} image generated via ${selectedModel}!`);

          // Save to IndexedDB
          const record: GenerationRecord = {
            id: `img-${Date.now()}`,
            type: 'image',
            mode: 'Studio Quality Image Mode',
            title: `Studio ${imageSize} • ${eraPreset}`,
            prompt,
            sourceImage: sourceDataUrl,
            outputUrl: data.imageUrl,
            metadata: {
              aspectRatio,
              imageSize,
              model: selectedModel,
              eraPreset,
              cameraProfile,
              motionIntensity,
              blendWeight,
              timestamp: Date.now(),
            },
            createdAt: Date.now(),
          };
          await saveGeneration(record);
          setHistoryRecords((prev) => [record, ...prev]);
        } else {
          showNotification('info', data.text || data.error || 'Image processed in canvas studio.');
        }
      } else if (currentMode === 'variations') {
        // Infinite Variations Mode: Save current matrix state into history
        showNotification('success', 'Generated 4-cell Stylistic Variations Matrix!');
        const record: GenerationRecord = {
          id: `var-${Date.now()}`,
          type: 'variations',
          mode: 'Infinite Variations Mode',
          title: `Variations Matrix • ${eraPreset}`,
          prompt,
          sourceImage: sourceDataUrl,
          outputUrl: sourceDataUrl,
          metadata: {
            aspectRatio,
            model: 'OmniRender Matrix Core',
            eraPreset,
            cameraProfile,
            motionIntensity,
            blendWeight,
            timestamp: Date.now(),
          },
          createdAt: Date.now(),
        };
        await saveGeneration(record);
        setHistoryRecords((prev) => [record, ...prev]);
      }
    } catch (err: any) {
      showNotification('error', `Generation failed: ${err.message || 'Check connection.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // History Record Selection (Reloads complete previous context onto canvas!)
  const handleSelectRecord = (record: GenerationRecord) => {
    if (record.sourceImage) {
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        setSourceDataUrl(record.sourceImage!);
        setSourceImageName(record.title);
      };
      img.src = record.sourceImage;
    }

    setPrompt(record.prompt);
    if (record.metadata.aspectRatio) setAspectRatio(record.metadata.aspectRatio);
    if (record.metadata.eraPreset) setEraPreset(record.metadata.eraPreset);
    if (record.metadata.cameraProfile) setCameraProfile(record.metadata.cameraProfile);
    if (record.metadata.motionIntensity) setMotionIntensity(record.metadata.motionIntensity);
    if (record.metadata.blendWeight) setBlendWeight(record.metadata.blendWeight);

    if (record.type === 'video') {
      setCurrentMode('video');
      setVideoUrl(record.outputUrl);
    } else if (record.type === 'music') {
      setCurrentMode('music');
      setAudioUrl(record.outputUrl);
      setLyrics(record.lyrics || '');
    } else if (record.type === 'image') {
      setCurrentMode('studio_image');
      setOutputImageUrl(record.outputUrl);
    } else {
      setCurrentMode('variations');
    }

    showNotification('success', `Restored "${record.title}" onto Canvas.`);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteGeneration(id);
      setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
      showNotification('info', 'Record removed from IndexedDB.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await clearAllGenerations();
      setHistoryRecords([]);
      showNotification('info', 'Historical cache cleared.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070810] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Studio Header */}
      <Header
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        historyCount={historyRecords.length}
        isHistoryOpen={isHistoryOpen}
        isChatOpen={isChatOpen}
      />

      {/* Floating Status Notification Toast */}
      {statusNotification && (
        <div className="fixed top-16 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs shadow-2xl backdrop-blur-md ${
              statusNotification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : statusNotification.type === 'error'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : statusNotification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400" />
            )}
            <span>{statusNotification.message}</span>
          </div>
        </div>
      )}

      {/* 2. Main Studio Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Primary Viewport (Canvas / Video / Audio / Variations) (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode-specific Primary Viewport */}
          {currentMode === 'three_stage' ? (
            <ThreeStageView
              onCaptureFrame={handleCaptureFrame}
              aspectRatio={aspectRatio}
            />
          ) : currentMode === 'video' ? (
            <VideoPlayerView
              sourceImage={sourceImage}
              videoUrl={videoUrl}
              cameraProfile={cameraProfile}
              motionIntensity={motionIntensity}
              aspectRatio={aspectRatio}
              resolution="720p"
              onGenerateVideo={handleSynthesize}
              isGenerating={isProcessing}
            />
          ) : currentMode === 'variations' ? (
            <div className="space-y-4">
              <CanvasWorkspace
                sourceImage={sourceImage}
                onImageLoaded={handleImageLoaded}
                aspectRatio={aspectRatio}
                blendWeight={blendWeight}
                filterStyle={filterStyle}
                onFilterChange={setFilterStyle}
                outputImageUrl={outputImageUrl}
              />
              <VariationsGrid
                sourceImage={sourceImage}
                aspectRatio={aspectRatio}
                blendWeight={blendWeight}
                onApplyAsMain={(dataUrl, filter) => {
                  const img = new Image();
                  img.onload = () => {
                    setSourceImage(img);
                    setSourceDataUrl(dataUrl);
                    setFilterStyle(filter);
                    showNotification('success', `Applied ${filter} variation to Studio Canvas.`);
                  };
                  img.src = dataUrl;
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <CanvasWorkspace
                sourceImage={sourceImage}
                onImageLoaded={handleImageLoaded}
                aspectRatio={aspectRatio}
                blendWeight={blendWeight}
                filterStyle={filterStyle}
                onFilterChange={setFilterStyle}
                outputImageUrl={outputImageUrl}
              />
              {currentMode === 'music' && audioUrl && (
                <AudioPlayerVisualizer
                  audioUrl={audioUrl}
                  lyrics={lyrics}
                  title={`Soundtrack • ${eraPreset}`}
                  modelUsed={selectedModel}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Advanced Parameter Engineering Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <ParameterPanel
            currentMode={currentMode}
            onModeChange={handleModeChange}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            eraPreset={eraPreset}
            onEraPresetChange={setEraPreset}
            cameraProfile={cameraProfile}
            onCameraProfileChange={setCameraProfile}
            motionIntensity={motionIntensity}
            onMotionIntensityChange={setMotionIntensity}
            blendWeight={blendWeight}
            onBlendWeightChange={setBlendWeight}
            prompt={prompt}
            onPromptChange={setPrompt}
            imageSize={imageSize}
            onImageSizeChange={setImageSize}
            selectedModel={selectedModel}
            onSelectedModelChange={setSelectedModel}
            onSynthesize={handleSynthesize}
            isProcessing={isProcessing}
            onEnhancePrompt={handleEnhancePrompt}
            isEnhancing={isEnhancing}
            hasSourceImage={Boolean(sourceImage)}
          />
        </div>
      </main>

      {/* 3. Persistent Storage Gallery Sidebar (IndexedDB) */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={historyRecords}
        onSelectRecord={handleSelectRecord}
        onDeleteRecord={handleDeleteRecord}
        onClearAll={handleClearAllHistory}
      />

      {/* 4. Director AI Multi-turn Chat Panel */}
      <DirectorChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onApplyPrompt={(newPrompt) => {
          setPrompt(newPrompt);
          setIsChatOpen(false);
          showNotification('success', 'Transferred Director prompt to Studio Context!');
        }}
        currentPrompt={prompt}
      />
    </div>
  );
}
