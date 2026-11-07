/**
 * Sample Media Presets for Instant Studio Ingestion
 */

export interface SampleMedia {
  id: string;
  name: string;
  category: string;
  aspectRatio: string;
  prompt: string;
  era: string;
  camera: string;
  svgDataUri: string;
}

export const SAMPLE_MEDIA: SampleMedia[] = [
  {
    id: 'cyber-runner',
    name: 'Neo-Tokyo Cyber Samurai',
    category: 'Cyberpunk',
    aspectRatio: '16:9',
    prompt:
      'Cybernetic samurai with iridescent katana standing on a rain-slicked skyscraper rooftop in Neo-Tokyo, volumetric neon magenta and cyan fog, 8K hyper-detailed, octane render.',
    era: 'Cyberpunk Dystopia',
    camera: 'Slow Push-In',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23090919"/>
          <stop offset="50%" stop-color="%231a0b2e"/>
          <stop offset="100%" stop-color="%2305050f"/>
        </linearGradient>
        <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="%23ff007f"/>
          <stop offset="50%" stop-color="%2300f0ff"/>
          <stop offset="100%" stop-color="%237928ca"/>
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stop-color="%23ff0055" stop-opacity="0.8"/>
          <stop offset="50%" stop-color="%237928ca" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="720" fill="url(%23sky)"/>
      <circle cx="640" cy="400" r="320" fill="url(%23sun)"/>
      <!-- Grid Floor -->
      <path d="M0,520 L1280,520 M0,550 L1280,550 M0,590 L1280,590 M0,640 L1280,640 M0,700 L1280,700" stroke="%23ff007f" stroke-opacity="0.3" stroke-width="2"/>
      <path d="M640,500 L100,720 M640,500 L300,720 M640,500 L500,720 M640,500 L640,720 M640,500 L780,720 M640,500 L980,720 M640,500 L1180,720" stroke="%2300f0ff" stroke-opacity="0.3" stroke-width="2"/>
      <!-- City Silhouette -->
      <rect x="180" y="280" width="120" height="240" fill="%230d0722" stroke="%2300f0ff" stroke-width="1.5" stroke-opacity="0.5"/>
      <rect x="340" y="200" width="160" height="320" fill="%23120a2e" stroke="%23ff007f" stroke-width="1.5" stroke-opacity="0.6"/>
      <rect x="760" y="230" width="140" height="290" fill="%230d0722" stroke="%2300f0ff" stroke-width="1.5" stroke-opacity="0.5"/>
      <rect x="940" y="310" width="180" height="210" fill="%23120a2e" stroke="%23ff007f" stroke-width="1.5" stroke-opacity="0.5"/>
      <!-- Neon Katana & Character Silhouette -->
      <ellipse cx="640" cy="490" rx="35" ry="120" fill="%23020005"/>
      <circle cx="640" cy="340" r="28" fill="%23020005"/>
      <!-- Glowing Katana Beam -->
      <line x1="610" y1="520" x2="520" y2="280" stroke="%2300f0ff" stroke-width="6" stroke-linecap="round" filter="drop-shadow(0 0 12px %2300f0ff)"/>
      <text x="640" y="100" fill="%2300f0ff" font-family="monospace" font-size="28" font-weight="bold" text-anchor="middle" letter-spacing="8">OMNIRENDER // CYBERPUNK 8K</text>
      <text x="640" y="130" fill="%23ff007f" font-family="sans-serif" font-size="14" text-anchor="middle" letter-spacing="4">NEO-TOKYO SECTOR 09 • KINETIC TEMPORAL MESH</text>
    </svg>`,
  },
  {
    id: 'cosmic-nebula',
    name: 'Celestial Singularity Portal',
    category: 'Sci-Fi Cosmos',
    aspectRatio: '16:9',
    prompt:
      'A hyper-massive spinning accretion disk of an iridescent purple and gold black hole, emitting gravitational lensing rings and quantum dust particles through an interstellar nebula, James Webb telescope clarity.',
    era: 'Hyper-Realistic 8K',
    camera: 'Orbital Crane',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <radialGradient id="portal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%23000000"/>
          <stop offset="35%" stop-color="%2314052b"/>
          <stop offset="60%" stop-color="%239333ea"/>
          <stop offset="85%" stop-color="%23f59e0b"/>
          <stop offset="100%" stop-color="%23050814"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="720" fill="%2303030c"/>
      <circle cx="640" cy="360" r="300" fill="url(%23portal)"/>
      <ellipse cx="640" cy="360" rx="420" ry="90" fill="none" stroke="%23f59e0b" stroke-width="12" opacity="0.85" transform="rotate(-18 640 360)"/>
      <ellipse cx="640" cy="360" rx="360" ry="70" fill="none" stroke="%23a855f7" stroke-width="8" opacity="0.9" transform="rotate(-18 640 360)"/>
      <circle cx="640" cy="360" r="100" fill="%23000000" stroke="%23ffffff" stroke-width="4"/>
      <!-- Stars -->
      <circle cx="200" cy="140" r="3" fill="%23ffffff"/>
      <circle cx="340" cy="90" r="2" fill="%2338bdf8"/>
      <circle cx="1080" cy="180" r="4" fill="%23f43f5e"/>
      <circle cx="950" cy="580" r="2.5" fill="%23ffffff"/>
      <text x="640" y="80" fill="%23e2e8f0" font-family="monospace" font-size="26" font-weight="bold" text-anchor="middle" letter-spacing="6">CELESTIAL EVENT HORIZON</text>
    </svg>`,
  },
  {
    id: 'baroque-emperor',
    name: 'Baroque Gilded Sovereign',
    category: 'Renaissance',
    aspectRatio: '1:1',
    prompt:
      'Gilded Renaissance emperor draped in deep velvet crimson and gold leaf filigree, dramatic Caravaggio tenebrism lighting, chiaroscuro atmosphere, Rembrandt crackled canvas texture.',
    era: 'Renaissance Painting',
    camera: 'Cinematic Dolly Zoom',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <radialGradient id="chiaroscuro" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="%23d4af37" stop-opacity="0.9"/>
          <stop offset="30%" stop-color="%2378350f" stop-opacity="0.8"/>
          <stop offset="70%" stop-color="%23271506"/>
          <stop offset="100%" stop-color="%23080402"/>
        </radialGradient>
      </defs>
      <rect width="800" height="800" fill="url(%23chiaroscuro)"/>
      <!-- Classical Crown -->
      <polygon points="340,320 370,240 400,300 430,240 460,320" fill="%23fbbf24" stroke="%2378350f" stroke-width="4"/>
      <!-- Ornate Robes -->
      <path d="M260,780 C260,540 320,440 400,440 C480,440 540,540 540,780 Z" fill="%23831843" stroke="%23fbbf24" stroke-width="6"/>
      <circle cx="400" cy="380" r="70" fill="%23fde68a"/>
      <text x="400" y="740" fill="%23fbbf24" font-family="serif" font-size="24" font-weight="bold" text-anchor="middle" letter-spacing="4">BAROQUE MASTERPIECE</text>
    </svg>`,
  },
  {
    id: 'steampunk-leviathan',
    name: 'Victorian Steampunk Airship',
    category: 'Steampunk',
    aspectRatio: '2.39:1',
    prompt:
      'Colossal Victorian brass airship cruising through amber sunset storm clouds over industrial London, intricate copper gears, burning furnace boilers, 70mm cinematic anamorphic scope.',
    era: 'Steampunk Era',
    camera: 'Drone Hyperlapse',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1434" height="600" viewBox="0 0 1434 600">
      <defs>
        <linearGradient id="steamsky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="%23451a03"/>
          <stop offset="40%" stop-color="%23b45309"/>
          <stop offset="80%" stop-color="%23d97706"/>
          <stop offset="100%" stop-color="%231e1b4b"/>
        </linearGradient>
      </defs>
      <rect width="1434" height="600" fill="url(%23steamsky)"/>
      <!-- Zeppelin Hull -->
      <ellipse cx="717" cy="270" rx="420" ry="110" fill="%2378350f" stroke="%23f59e0b" stroke-width="8"/>
      <!-- Ribs -->
      <line x1="450" y1="170" x2="450" y2="370" stroke="%23d97706" stroke-width="4"/>
      <line x1="580" y1="160" x2="580" y2="380" stroke="%23d97706" stroke-width="4"/>
      <line x1="717" y1="160" x2="717" y2="380" stroke="%23fbbf24" stroke-width="5"/>
      <line x1="850" y1="160" x2="850" y2="380" stroke="%23d97706" stroke-width="4"/>
      <line x1="980" y1="170" x2="980" y2="370" stroke="%23d97706" stroke-width="4"/>
      <!-- Gondola -->
      <rect x="620" y="380" width="194" height="45" rx="10" fill="%23292524" stroke="%23f59e0b" stroke-width="3"/>
      <!-- Propeller -->
      <ellipse cx="270" cy="270" rx="15" ry="70" fill="%23fbbf24" opacity="0.75"/>
      <text x="717" y="100" fill="%23fef3c7" font-family="serif" font-size="28" font-weight="bold" text-anchor="middle" letter-spacing="6">LEVIATHAN CLASS AIRSHIP • 2.39:1 SCOPE</text>
    </svg>`,
  },
];
