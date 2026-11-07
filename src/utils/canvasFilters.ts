/**
 * High-performance HTML5 Canvas Processing Engine
 * Includes matrix filter blends, 4K rendering, transformation pipelines, and temporal camera kinematics.
 */

export type FilterStyle =
  | 'none'
  | 'cyberpunk'
  | 'renaissance'
  | 'steampunk'
  | 'anamorphic'
  | 'noir'
  | 'anime'
  | 'thermal';

export interface CanvasTransform {
  zoom: number; // 0.25 to 4.0
  panX: number;
  panY: number;
  rotation: number; // degrees: 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  blendWeight: number; // 0.0 to 1.0
  filterStyle: FilterStyle;
}

/**
 * Render image with transformations and hardware pixel matrix manipulation
 */
export function renderCanvasWithFilters(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
  transform: CanvasTransform,
  aspectRatioString = '16:9'
) {
  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background letterbox fill
  ctx.fillStyle = '#080811';
  ctx.fillRect(0, 0, width, height);

  // Center coordinates
  const cx = width / 2;
  const cy = height / 2;

  ctx.translate(cx + transform.panX, cy + transform.panY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(
    transform.zoom * (transform.flipH ? -1 : 1),
    transform.zoom * (transform.flipV ? -1 : 1)
  );

  // Calculate draw dimensions preserving image aspect ratio
  const imgAspect = (img as any).naturalWidth
    ? (img as HTMLImageElement).naturalWidth / (img as HTMLImageElement).naturalHeight
    : img.width / img.height;

  let drawW = width;
  let drawH = width / imgAspect;

  if (drawH < height) {
    drawH = height;
    drawW = height * imgAspect;
  }

  // Draw base image centered
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // If filter is applied and blendWeight > 0, apply pixel matrix manipulation
  if (transform.filterStyle !== 'none' && transform.blendWeight > 0) {
    applyMatrixFilter(ctx, width, height, transform.filterStyle, transform.blendWeight);
  }

  // Cinematic Aspect Ratio Matte (if 2.39:1 scope is chosen or anamorphic)
  if (aspectRatioString === '2.39:1' || transform.filterStyle === 'anamorphic') {
    drawCinematicLetterbox(ctx, width, height, 2.39);
  }
}

/**
 * Direct pixel data transformation for matrix blends
 */
function applyMatrixFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: FilterStyle,
  weight: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let tr = r;
    let tg = g;
    let tb = b;

    if (style === 'cyberpunk') {
      // High contrast, neon cyan/magenta split, boosted highlights
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 128) {
        // Deep shadows towards violet-cyan
        tr = Math.min(255, r * 1.3 + 25);
        tg = Math.max(0, g * 0.7);
        tb = Math.min(255, b * 1.5 + 40);
      } else {
        // Highlights towards hot neon pink and electric cyan
        tr = Math.min(255, r * 1.2 + 30);
        tg = Math.min(255, g * 1.1 + 10);
        tb = Math.min(255, b * 1.4 + 20);
      }
    } else if (style === 'renaissance') {
      // Warm chiaroscuro, Caravaggio golden glaze, deep shadows
      tr = r * 0.393 + g * 0.769 + b * 0.189 + 15;
      tg = r * 0.349 + g * 0.686 + b * 0.168;
      tb = r * 0.272 + g * 0.534 + b * 0.131 - 20;
    } else if (style === 'steampunk') {
      // Copper patina & sepia brass
      const avg = (r + g + b) / 3;
      tr = Math.min(255, avg * 1.2 + 20);
      tg = Math.min(255, avg * 0.9 + 10);
      tb = Math.max(0, avg * 0.6 - 15);
    } else if (style === 'anamorphic') {
      // Teal and Orange Hollywood cinema grade
      tr = Math.min(255, r * 1.15 + (r > 120 ? 25 : 5));
      tg = g * 0.98;
      tb = Math.min(255, b * 1.25 + (b < 120 ? 30 : 0));
    } else if (style === 'noir') {
      // High-contrast silver halide 35mm monochrome
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrastLum = lum < 128 ? Math.max(0, lum * 0.75 - 10) : Math.min(255, lum * 1.3);
      tr = contrastLum;
      tg = contrastLum;
      tb = contrastLum;
    } else if (style === 'anime') {
      // Cel-shaded posterization with boosted saturation
      tr = Math.floor(r / 32) * 32 * 1.15;
      tg = Math.floor(g / 32) * 32 * 1.15;
      tb = Math.floor(b / 32) * 32 * 1.15;
    } else if (style === 'thermal') {
      // Infrared spectrum
      const lum = (r + g + b) / 3;
      tr = Math.min(255, lum * 2);
      tg = lum < 128 ? 0 : Math.min(255, (lum - 128) * 2);
      tb = lum < 64 ? Math.min(255, lum * 4) : 0;
    }

    // Blend with original based on weight (0.0 to 1.0)
    data[i] = Math.min(255, Math.max(0, Math.round(r + (tr - r) * weight)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g + (tg - g) * weight)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b + (tb - b) * weight)));
  }

  ctx.putImageData(imgData, 0, 0);

  // Overlay cinematic flare if Anamorphic
  if (style === 'anamorphic' && weight > 0.3) {
    const flareGrad = ctx.createLinearGradient(0, height * 0.5, width, height * 0.5);
    flareGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    flareGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.08)');
    flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    flareGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.08)');
    flareGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, height * 0.48, width, height * 0.04);
  }
}

/**
 * Draw cinematic letterbox bars for wide scope
 */
function drawCinematicLetterbox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  targetRatio = 2.39
) {
  const currentRatio = width / height;
  if (currentRatio < targetRatio) {
    const visibleH = width / targetRatio;
    const barH = (height - visibleH) / 2;
    if (barH > 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, barH);
      ctx.fillRect(0, height - barH, width, barH);
    }
  }
}

/**
 * Render 4K resolution offscreen canvas and return data URL
 */
export async function exportHighResolutionCanvas(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  transform: CanvasTransform,
  targetWidth = 3840,
  aspectRatio = '16:9'
): Promise<string> {
  let targetHeight = 2160;

  if (aspectRatio === '9:16') {
    targetWidth = 2160;
    targetHeight = 3840;
  } else if (aspectRatio === '1:1') {
    targetWidth = 3000;
    targetHeight = 3000;
  } else if (aspectRatio === '2.39:1') {
    targetWidth = 3840;
    targetHeight = Math.round(3840 / 2.39);
  } else if (aspectRatio === '4:3') {
    targetWidth = 2880;
    targetHeight = 2160;
  } else if (aspectRatio === '21:9') {
    targetWidth = 3840;
    targetHeight = Math.round(3840 / (21 / 9));
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create offscreen context');

  renderCanvasWithFilters(ctx, sourceImg, targetWidth, targetHeight, transform, aspectRatio);
  return offscreen.toDataURL('image/png', 0.98);
}

/**
 * Camera Motion Kinematics for Video Mode Canvas Preview
 * Calculates pan/zoom offset for a given timestamp [0..1]
 */
export function calculateCameraFrame(
  profile: string,
  progress: number, // 0 to 1
  motionIntensity: number // 1 to 10
): { zoomOffset: number; panXOffset: number; panYOffset: number; rotOffset: number } {
  const intensity = motionIntensity / 5; // 0.2 to 2.0

  switch (profile) {
    case 'Slow Push-In':
      // Gentle cinematic zoom from 1.0 to 1.0 + (0.15 * intensity)
      return {
        zoomOffset: 1 + 0.15 * intensity * progress,
        panXOffset: 0,
        panYOffset: -15 * intensity * progress,
        rotOffset: 0,
      };

    case 'Orbital Crane':
      // Arc motion left to right, rising elevation, slight tilt
      const arc = Math.sin(progress * Math.PI);
      return {
        zoomOffset: 1 + 0.08 * intensity * arc,
        panXOffset: (progress - 0.5) * 80 * intensity,
        panYOffset: -Math.cos(progress * Math.PI) * 40 * intensity,
        rotOffset: (progress - 0.5) * 4 * intensity,
      };

    case 'Drone Hyperlapse':
      // Fast forward zoom with downward tilt
      return {
        zoomOffset: 1 + 0.3 * intensity * progress,
        panXOffset: Math.sin(progress * Math.PI * 2) * 20 * intensity,
        panYOffset: (progress - 0.5) * 60 * intensity,
        rotOffset: (progress - 0.5) * 2 * intensity,
      };

    case '360 Dutch Angle':
      // Dramatic rotation with zoom
      return {
        zoomOffset: 1 + 0.12 * intensity,
        panXOffset: 0,
        panYOffset: 0,
        rotOffset: (progress - 0.5) * 16 * intensity,
      };

    case 'Handheld Shaky-Cam':
      // Organic handheld micro-jitters
      const shakeX = (Math.sin(progress * 24) + Math.cos(progress * 38)) * 6 * intensity;
      const shakeY = (Math.cos(progress * 28) + Math.sin(progress * 42)) * 6 * intensity;
      const shakeR = Math.sin(progress * 18) * 1.5 * intensity;
      return {
        zoomOffset: 1.05,
        panXOffset: shakeX,
        panYOffset: shakeY,
        rotOffset: shakeR,
      };

    case 'Cinematic Dolly Zoom':
      // Vertigo effect: background compresses while zoom changes
      const vertigo = Math.sin(progress * Math.PI);
      return {
        zoomOffset: 1 + 0.25 * intensity * vertigo,
        panXOffset: 0,
        panYOffset: 0,
        rotOffset: 0,
      };

    default:
      return {
        zoomOffset: 1 + 0.1 * intensity * progress,
        panXOffset: 0,
        panYOffset: 0,
        rotOffset: 0,
      };
  }
}
