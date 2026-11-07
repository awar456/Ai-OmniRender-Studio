import React, { useRef, useEffect, useState } from 'react';
import {
  Download,
  Sparkles,
  Maximize2,
  Check,
  RefreshCw,
  Palette,
  Eye,
  Camera,
} from 'lucide-react';
import { exportHighResolutionCanvas, FilterStyle, renderCanvasWithFilters } from '../utils/canvasFilters';

interface VariationConcept {
  id: string;
  title: string;
  style: string;
  filterType: FilterStyle;
  promptModifier: string;
  colorPalette: string[];
  camera: string;
}

interface VariationsGridProps {
  sourceImage: HTMLImageElement | null;
  aspectRatio: string;
  blendWeight: number;
  onApplyAsMain: (dataUrl: string, filterType: FilterStyle) => void;
}

export const DEFAULT_VARIATIONS: VariationConcept[] = [
  {
    id: 'var-1',
    title: 'Cyberpunk Neon Flare',
    style: 'Cyberpunk Dystopia',
    filterType: 'cyberpunk',
    promptModifier: 'volumetric neon light shafts, iridescent rain, chrome reflections, 8K',
    colorPalette: ['#00f0ff', '#ff007f', '#7928ca'],
    camera: 'Slow Push-In',
  },
  {
    id: 'var-2',
    title: 'Baroque Oil Impasto',
    style: 'Renaissance Painting',
    filterType: 'renaissance',
    promptModifier: 'oil glaze, chiaroscuro golden hour illumination, Caravaggio canvas grain',
    colorPalette: ['#d4af37', '#8b4513', '#1c1c1c'],
    camera: 'Orbital Crane',
  },
  {
    id: 'var-3',
    title: 'Anamorphic Cinema Scope',
    style: 'Hyper-Realistic 8K',
    filterType: 'anamorphic',
    promptModifier: 'Panavision 2.39:1 anamorphic horizontal lens flare, 35mm film grain',
    colorPalette: ['#38bdf8', '#fbbf24', '#0f172a'],
    camera: 'Drone Hyperlapse',
  },
  {
    id: 'var-4',
    title: 'Film Noir 35mm Silver',
    style: 'Film Noir 35mm',
    filterType: 'noir',
    promptModifier: 'high contrast monochrome silver halide, Venetian blind shadows, moody rain haze',
    colorPalette: ['#ffffff', '#9ca3af', '#000000'],
    camera: 'Cinematic Dolly Zoom',
  },
];

export const VariationsGrid: React.FC<VariationsGridProps> = ({
  sourceImage,
  aspectRatio,
  blendWeight,
  onApplyAsMain,
}) => {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedAll, setDownloadedAll] = useState<boolean>(false);

  useEffect(() => {
    if (!sourceImage) return;

    DEFAULT_VARIATIONS.forEach((v) => {
      const canvas = canvasRefs.current[v.id];
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      renderCanvasWithFilters(
        ctx,
        sourceImage,
        canvas.width,
        canvas.height,
        {
          zoom: 1.0,
          panX: 0,
          panY: 0,
          rotation: 0,
          flipH: false,
          flipV: false,
          blendWeight: blendWeight || 0.85,
          filterStyle: v.filterType,
        },
        aspectRatio
      );
    });
  }, [sourceImage, aspectRatio, blendWeight]);

  const handleDownloadSingle = async (variation: VariationConcept) => {
    if (!sourceImage) return;
    setDownloadingId(variation.id);
    try {
      const dataUrl = await exportHighResolutionCanvas(
        sourceImage,
        {
          zoom: 1.0,
          panX: 0,
          panY: 0,
          rotation: 0,
          flipH: false,
          flipV: false,
          blendWeight: blendWeight || 0.85,
          filterStyle: variation.filterType,
        },
        3840,
        aspectRatio
      );

      const link = document.createElement('a');
      link.download = `omni_variation_${variation.filterType}_4K.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBatchDownload = async () => {
    if (!sourceImage) return;
    setDownloadedAll(true);
    for (const v of DEFAULT_VARIATIONS) {
      await handleDownloadSingle(v);
      await new Promise((r) => setTimeout(r, 400));
    }
    setTimeout(() => setDownloadedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0f1124] border border-cyan-900/40">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Infinite Variations Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Multi-vector stylistic projections with independent 4K ultra-resolution exporters
          </p>
        </div>

        <button
          onClick={handleBatchDownload}
          disabled={!sourceImage || downloadedAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-cyan-600/25"
        >
          {downloadedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              Batch Exported!
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Export All 4 Variations (4K)
            </>
          )}
        </button>
      </div>

      {/* 4-Cell Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFAULT_VARIATIONS.map((v) => (
          <div
            key={v.id}
            className="group relative bg-[#0e1022] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3.5 space-y-3 transition-all hover:shadow-xl hover:shadow-cyan-950/30"
          >
            {/* Cell Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {v.colorPalette.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-black/40"
                      style={{ backgroundColor: c }}
                      title={`Hex: ${c}`}
                    />
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {v.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">{v.style}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161834] text-cyan-300 border border-slate-700/60">
                <Camera className="w-2.5 h-2.5 inline mr-1" />
                {v.camera}
              </span>
            </div>

            {/* Canvas Viewport */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black/70 border border-slate-800 flex items-center justify-center">
              <canvas
                ref={(el) => {
                  canvasRefs.current[v.id] = el;
                }}
                width={640}
                height={360}
                className="w-full h-full object-contain"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const canvas = canvasRefs.current[v.id];
                    if (canvas) {
                      onApplyAsMain(canvas.toDataURL(), v.filterType);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 transition-colors flex items-center gap-1 shadow-lg"
                  title="Apply this style to Studio Canvas"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Apply to Main
                </button>

                <button
                  onClick={() => handleDownloadSingle(v)}
                  disabled={downloadingId === v.id}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
                  title="Download in 4K resolution"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingId === v.id ? 'Exporting...' : '4K Export'}
                </button>
              </div>
            </div>

            {/* Prompt Modifier Footer */}
            <div className="text-[11px] text-slate-400 bg-[#121429] p-2 rounded-lg border border-slate-800/80 font-mono">
              <span className="text-cyan-400 font-semibold">+Vector: </span>
              {v.promptModifier}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
