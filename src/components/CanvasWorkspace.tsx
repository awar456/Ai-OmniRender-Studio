import React, { useRef, useEffect, useState } from 'react';
import {
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Layers,
  SplitSquareVertical,
  Check,
  RefreshCw,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import {
  CanvasTransform,
  FilterStyle,
  renderCanvasWithFilters,
  exportHighResolutionCanvas,
} from '../utils/canvasFilters';
import { SAMPLE_MEDIA, SampleMedia } from '../data/samples';

interface CanvasWorkspaceProps {
  sourceImage: HTMLImageElement | null;
  onImageLoaded: (img: HTMLImageElement, dataUrl: string, name: string) => void;
  aspectRatio: string;
  blendWeight: number;
  filterStyle: FilterStyle;
  onFilterChange: (style: FilterStyle) => void;
  outputImageUrl?: string;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  sourceImage,
  onImageLoaded,
  aspectRatio,
  blendWeight,
  filterStyle,
  onFilterChange,
  outputImageUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showSplitCompare, setShowSplitCompare] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50); // 0 to 100%

  // Handle global paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            loadFileBlob(blob, 'pasted_image.png');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const loadFileBlob = (file: File | Blob, name: string) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageLoaded(img, dataUrl, name);
        resetTransforms();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const resetTransforms = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  // Render canvas pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const transform: CanvasTransform = {
      zoom,
      panX: pan.x,
      panY: pan.y,
      rotation,
      flipH,
      flipV,
      blendWeight,
      filterStyle,
    };

    if (showSplitCompare) {
      // Split-screen comparator rendering:
      // Left side: original without filter
      // Right side: with matrix filter
      renderCanvasWithFilters(ctx, sourceImage, canvas.width, canvas.height, {
        ...transform,
        filterStyle: 'none',
        blendWeight: 0,
      }, aspectRatio);

      // Save left image data
      const splitX = Math.round((canvas.width * splitPos) / 100);

      // Create temp offscreen for filtered right side
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (tempCtx) {
        renderCanvasWithFilters(tempCtx, sourceImage, canvas.width, canvas.height, transform, aspectRatio);
        // Clip right portion over canvas
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();

        // Draw dividing neon line
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();

        // Draw HUD labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('ORIGINAL [RAW]', 20, 30);
        ctx.fillText(`FILTER [${filterStyle.toUpperCase()}]`, canvas.width - 160, 30);
      }
    } else {
      renderCanvasWithFilters(ctx, sourceImage, canvas.width, canvas.height, transform, aspectRatio);
    }
  }, [sourceImage, zoom, pan, rotation, flipH, flipV, blendWeight, filterStyle, aspectRatio, showSplitCompare, splitPos]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(4.0, Math.max(0.25, prev * zoomFactor)));
  };

  // High-Resolution 4K Export
  const handleExport4K = async () => {
    if (!sourceImage) return;
    setIsExporting(true);
    try {
      const transform: CanvasTransform = {
        zoom,
        panX: pan.x,
        panY: pan.y,
        rotation,
        flipH,
        flipV,
        blendWeight,
        filterStyle,
      };

      const highResDataUrl = await exportHighResolutionCanvas(
        sourceImage,
        transform,
        3840,
        aspectRatio
      );

      const link = document.createElement('a');
      link.download = `omni_render_4K_${aspectRatio.replace(':', '_')}.png`;
      link.href = highResDataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const loadSample = (sample: SampleMedia) => {
    const img = new Image();
    img.onload = () => {
      onImageLoaded(img, sample.svgDataUri, sample.name);
      resetTransforms();
    };
    img.src = sample.svgDataUri;
  };

  const filtersList: { id: FilterStyle; label: string }[] = [
    { id: 'none', label: 'Raw Bypass' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon' },
    { id: 'renaissance', label: 'Renaissance Glaze' },
    { id: 'steampunk', label: 'Steampunk Patina' },
    { id: 'anamorphic', label: 'Anamorphic Flare' },
    { id: 'noir', label: 'Noir 35mm Silver' },
    { id: 'anime', label: 'Cel-Shade Anime' },
    { id: 'thermal', label: 'Thermal Infrared' },
  ];

  return (
    <div className="space-y-3">
      {/* Canvas Viewport or Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            loadFileBlob(e.dataTransfer.files[0], e.dataTransfer.files[0].name);
          }
        }}
        className={`relative rounded-2xl overflow-hidden bg-[#080914] border transition-all min-h-[440px] flex items-center justify-center ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/20 scale-[0.99]'
            : 'border-slate-800 hover:border-cyan-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              loadFileBlob(e.target.files[0], e.target.files[0].name);
            }
          }}
        />

        {sourceImage ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={aspectRatio === '9:16' ? 720 : 1280}
              height={aspectRatio === '9:16' ? 1280 : 720}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`max-h-[580px] w-full object-contain cursor-grab active:cursor-grabbing select-none ${
                aspectRatio === '9:16' ? 'max-w-sm mx-auto' : ''
              }`}
            />

            {/* Split Screen Slider Overlay */}
            {showSplitCompare && (
              <div className="absolute inset-x-4 bottom-4 pointer-events-auto bg-black/75 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 flex items-center gap-3 max-w-md mx-auto">
                <span className="text-[10px] font-mono text-cyan-400">SPLIT COMPARATOR:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={splitPos}
                  onChange={(e) => setSplitPos(Number(e.target.value))}
                  className="flex-1 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-300 w-8">{splitPos}%</span>
              </div>
            )}

            {/* Floating Top Telemetry Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-cyan-500/30 text-cyan-300 font-mono text-[11px] shadow-md">
                {aspectRatio} MATRIX
              </span>
              <span className="px-2 py-1 rounded-md bg-black/75 backdrop-blur-md border border-slate-700/60 text-slate-300 font-mono text-[11px]">
                {Math.round(zoom * 100)}% ZOOM
              </span>
              {filterStyle !== 'none' && (
                <span className="px-2 py-1 rounded-md bg-fuchsia-950/80 backdrop-blur-md border border-fuchsia-500/40 text-fuchsia-300 font-mono text-[11px] uppercase">
                  {filterStyle} BLEND ({(blendWeight * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Empty Drag & Drop Zone */
          <div className="p-8 text-center space-y-4 max-w-lg">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-900/20 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Drop Source Media or Paste Frame
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Supports PNG, JPG, WebP. Zero client download overhead, hardware GPU accelerated.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Browse Local File
              </button>
            </div>

            {/* Instant Sample Presets */}
            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-[11px] font-mono text-slate-400 mb-2.5">
                OR LOAD 1-CLICK INSTANT PRESET MEDIA:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_MEDIA.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s)}
                    className="p-2 rounded-xl bg-[#121429] hover:bg-[#1a1c3d] border border-slate-800 hover:border-cyan-500/50 text-left transition-all group/btn"
                  >
                    <p className="text-[11px] font-semibold text-slate-200 group-hover/btn:text-cyan-300 truncate">
                      {s.name}
                    </p>
                    <span className="text-[9px] font-mono text-cyan-400">{s.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Tool Deck (Zoom, Pan, Rotate, Filters, Split, 4K Download) */}
      {sourceImage && (
        <div className="bg-[#0e1022] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((prev) => Math.max(0.25, prev - 0.15))}
              className="p-2 rounded-lg bg-[#161834] text-slate-300 hover:text-white hover:bg-[#1f224a] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoom((prev) => Math.min(4.0, prev + 0.15))}
              className="p-2 rounded-lg bg-[#161834] text-slate-300 hover:text-white hover:bg-[#1f224a] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetTransforms}
              className="px-2.5 py-1.5 rounded-lg bg-[#161834] text-slate-300 hover:text-white hover:bg-[#1f224a] font-mono text-[11px] transition-colors"
              title="Reset Zoom & Pan"
            >
              100% Reset
            </button>

            <div className="w-[1px] h-5 bg-slate-800 mx-1" />

            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 rounded-lg bg-[#161834] text-slate-300 hover:text-white hover:bg-[#1f224a] transition-colors"
              title="Rotate 90 Degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setFlipH(!flipH)}
              className={`p-2 rounded-lg transition-colors ${
                flipH ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#161834] text-slate-300 hover:text-white'
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setFlipV(!flipV)}
              className={`p-2 rounded-lg transition-colors ${
                flipV ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#161834] text-slate-300 hover:text-white'
              }`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowSplitCompare(!showSplitCompare)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-[11px] font-mono ${
                showSplitCompare
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-[#161834] text-slate-300 hover:text-white'
              }`}
              title="Toggle Before/After Split Comparator"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          {/* Matrix Filter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-mono text-[11px]">Filter:</span>
            <select
              value={filterStyle}
              onChange={(e) => onFilterChange(e.target.value as FilterStyle)}
              className="px-2.5 py-1.5 rounded-lg bg-[#14162e] border border-slate-700/80 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
            >
              {filtersList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Triggers: Replace Image & 4K Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#161834] hover:bg-[#20234a] text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Replace
            </button>

            <button
              onClick={handleExport4K}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
              title="Export ultra-crisp 4K canvas output natively"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Rendering 4K...' : 'Export 4K Canvas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
