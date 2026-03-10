/**
 * AvatarEditor.tsx
 *
 * Drop-in for the Clanker Clash project.
 *
 * Exports consumed by App.tsx / Settings.tsx:
 *   AvatarConfig   (type)
 *   COLOR_PALETTES (array)   — TugArena reads .clothing to recolor the sprite
 *   AvatarDisplay  (component)
 *   default        (AvatarEditor panel)
 */

import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type BaseId    = 'spiky' | 'round' | 'tall' | 'wide' | 'tiny' | 'horns';
export type PaletteId = 'classic' | 'ocean' | 'forest' | 'sunset' | 'night' | 'candy';

export type AvatarConfig = {
  baseId:      BaseId;
  colorScheme: PaletteId;
};

export type ColorPalette = {
  id:       PaletteId;
  label:    string;
  skin:     string;
  hat:      string;
  clothing: string;   // TugArena canvas-recolor target (replaces "red" pixels)
  shoes:    string;
  accent:   string;   // eye whites / highlight
  eyes:  string;   //eye pupil, mouth
};

// ─────────────────────────────────────────────────────────────────────────────
// Palettes
// ─────────────────────────────────────────────────────────────────────────────

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'classic', label: 'Classic',  skin: '#ffc20f', hat: '#00005a', clothing: '#dead2a', shoes: '#ed1c24', accent: '#ffffff', eyes: '#1f2a44' },
  { id: 'ocean',   label: 'Ocean',    skin: '#ffc20f', hat: '#0d3b6e', clothing: '#1a7fc1', shoes: '#0a4f8c', accent: '#7fd4fa', eyes: '#1f2a44' },
  { id: 'forest',  label: 'Forest',   skin: '#f5a97a', hat: '#1b4a1e', clothing: '#2e7d32', shoes: '#4e342e', accent: '#a5d6a7', eyes: '#1f2a44' },
  { id: 'sunset',  label: 'Sunset',   skin: '#ffc20f', hat: '#6a1b1a', clothing: '#e65100', shoes: '#bf360c', accent: '#ffcc80', eyes: '#1f2a44' },
  { id: 'night',   label: 'Night',    skin: '#c3b1e1', hat: '#1a1a2e', clothing: '#4a148c', shoes: '#212121', accent: '#ce93d8', eyes: '#1f2a44' },
  { id: 'candy',   label: 'Candy',    skin: '#ffb3c6', hat: '#ad1457', clothing: '#f06292', shoes: '#880e4f', accent: '#fff9c4', eyes: '#1f2a44' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pixel map  (15 wide × 16 tall)
// Extracted from the uploaded hand-drawn pixel art character.
// N = hat  Y = skin  G = clothing  R = shoes  W = accent/white  _ = transparent
// ─────────────────────────────────────────────────────────────────────────────

type K = 'N' | 'Y' | 'G' | 'R' | 'W' | 'B' | '_';

// Hat rows differ per base variant; body rows are shared
const HAT_ROWS: Record<BaseId, K[][]> = {
  spiky: [                                                                     // original two-bump cap
    ['_','_','N','N','N','N','_','_','_','N','N','N','N','_','_'],
    ['_','N','N','N','N','N','_','_','_','N','N','N','N','N','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
  ],
  round: [                                                                     // smooth beanie
    ['_','_','_','N','N','N','N','N','N','N','N','N','_','_','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
    ['N','N','N','N','N','N','N','N','N','N','N','N','N','N','N'],
  ],
  tall: [                                                                      // top hat
    ['_','_','_','N','N','N','N','N','N','N','N','N','_','_','_'],
    ['_','_','_','N','N','N','N','N','N','N','N','N','_','_','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
    ['N','N','N','N','N','N','N','N','N','N','N','N','N','N','N'],
  ],
  wide: [                                                                      // flat wide cap
    ['_','_','_','_','_','_','_','_','_','_','_','_','_','_','_'],
    ['N','N','N','N','N','N','N','N','N','N','N','N','N','N','N'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
  ],
  tiny: [                                                                      // little nub
    ['_','_','_','_','_','_','_','_','_','_','_','_','_','_','_'],
    ['_','_','_','_','_','N','N','N','N','N','_','_','_','_','_'],
    ['_','_','_','N','N','N','N','N','N','N','N','N','_','_','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
  ],
  horns: [                                                                     // devil horns
    ['N','N','_','_','_','_','_','_','_','_','_','_','_','N','N'],
    ['N','N','_','_','_','_','_','_','_','_','_','_','_','N','N'],
    ['_','N','N','_','_','_','_','_','_','_','_','_','N','N','_'],
    ['_','N','N','N','N','N','N','N','N','N','N','N','N','N','_'],
  ],
};

const BODY_ROWS: K[][] = [
  ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],   // 4  head top
  ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],   // 5  forehead
  ['Y','Y','Y','Y','W','B','B','Y','Y','Y','W','B','B','Y','Y'],   // 6  eyes top
  ['Y','Y','Y','Y','W','B','B','Y','Y','Y','W','B','B','Y','Y'],   // 7  eyes bot
  ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],   // 8  nose row
  ['_','Y','Y','Y','Y','Y','Y','B','B','B','Y','Y','Y','Y','_'],   // 9  mouth row
  ['_','_','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','_','_'],   // 10 chin
  ['_','G','G','G','G','G','G','G','G','G','G','G','G','G','_'],   // 11 body top
  ['G','G','_','G','G','G','G','G','G','G','G','G','_','G','G'],   // 12 body + arms
  ['G','G','_','G','G','G','G','G','G','G','G','G','_','G','G'],   // 13 body lower
  ['_','_','_','_','G','_','_','_','_','_','G','_','_','_','_'],   // 14 legs
  ['_','_','_','R','R','R','_','_','_','R','R','R','_','_','_'],   // 15 shoes
];

const GW = 15;
const GH = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildGrid(base: BaseId, pal: ColorPalette): (string | null)[][] {
  const rows: K[][] = [...HAT_ROWS[base], ...BODY_ROWS];
  return rows.map(row => row.map(k => {
    if (k === 'N') return pal.hat;
    if (k === 'Y') return pal.skin;
    if (k === 'G') return pal.clothing;
    if (k === 'R') return pal.shoes;
    if (k === 'W') return pal.accent;
    if (k === 'B') return pal.eyes;
    return null;
  }));
}

function darken(hex: string, amt = 30): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.max(0, v - amt).toString(16).padStart(2, '0');
  return `#${c(n >> 16 & 0xff)}${c(n >> 8 & 0xff)}${c(n & 0xff)}`;
}

function renderSvg(
  grid: (string | null)[][],
  pal: ColorPalette,
  px: number,
  key?: string,
) {
  return (
    <svg
      key={key}
      width={GW * px}
      height={GH * px}
      viewBox={`0 0 ${GW * px} ${GH * px}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {grid.map((row, ry) =>
        row.map((col, cx) => {
          if (!col) return null;
          let fill = col;
          if (col === pal.skin     && ry === 10) fill = darken(pal.skin, 15);
          if (col === pal.clothing && ry === 13) fill = darken(pal.clothing, 20);
          return (
            <rect
              key={`${ry}-${cx}`}
              x={cx * px} y={ry * px}
              width={px}  height={px}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AvatarDisplay — used in Settings card + extension header
// Accepts { size } (square) or { width, height }
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarDisplayProps = {
  config: AvatarConfig;
  size?: number;
  width?: number;
  height?: number;
};

export function AvatarDisplay({ config, size, width, height }: AvatarDisplayProps) {
  const pal  = COLOR_PALETTES.find(p => p.id === config.colorScheme) ?? COLOR_PALETTES[0];
  const grid = buildGrid(config.baseId, pal);
  const dw   = width  ?? size ?? 48;
  const dh   = height ?? size ?? 48;
  const px   = Math.max(1, Math.floor(Math.min(dw / GW, dh / GH)));
  const svgW = GW * px;
  const svgH = GH * px;

  return (
    <svg
      width={dw} height={dh}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {grid.map((row, ry) =>
        row.map((col, cx) => {
          if (!col) return null;
          let fill = col;
          if (col === pal.skin     && ry === 10) fill = darken(pal.skin, 15);
          if (col === pal.clothing && ry === 13) fill = darken(pal.clothing, 20);
          return (
            <rect
              key={`${ry}-${cx}`}
              x={cx * px} y={ry * px}
              width={px}  height={px}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Base variant metadata for the picker grid
// ─────────────────────────────────────────────────────────────────────────────

const BASE_VARIANTS: { id: BaseId; label: string }[] = [
  { id: 'spiky', label: 'Classic Cap'  },
  { id: 'round', label: 'Beanie'       },
  { id: 'tall',  label: 'Top Hat'      },
  { id: 'wide',  label: 'Flat Cap'     },
  { id: 'tiny',  label: 'Tiny Nub'     },
  { id: 'horns', label: 'Devil Horns'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AvatarEditor panel — shown when view === 'avatar'
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarEditorProps = {
  isActive:      boolean;
  currentConfig: AvatarConfig;
  onSave:        (config: AvatarConfig) => void;
  onBack:        () => void;
};

const PREVIEW_PX = 10;   // scale for large left-hand preview
const GRID_PX    = 4;    // scale for 3×2 hat-picker thumbnails

export default function AvatarEditor({
  isActive,
  currentConfig,
  onSave,
  onBack,
}: AvatarEditorProps) {
  const [draft, setDraft] = useState<AvatarConfig>(currentConfig);

  const pal  = COLOR_PALETTES.find(p => p.id === draft.colorScheme) ?? COLOR_PALETTES[0];
  const grid = buildGrid(draft.baseId, pal);

  function handleSave() {
    onSave(draft);
    onBack();
  }
  function handleDiscard() {
    setDraft(currentConfig);
    onBack();
  }

  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>
      <div className="avatar-editor-panel">

        {/* ── Header ── */}
        <div className="avatar-editor-header">
          <span style={{
            fontFamily: "'Pixelify Sans', monospace",
            fontSize: '1.2rem',
            fontSynthesis: 'none',
            fontWeight: 400,
          }}>
            Edit Avatar
          </span>
        </div>

        {/* ── Two-col: preview | hat grid ── */}
        <div className="avatar-two-col">

          {/* Left — large live preview */}
          <div className="avatar-preview-box">
            <span className="avatar-preview-label">Preview</span>
            <div className="avatar-preview-img">
              {renderSvg(grid, pal, PREVIEW_PX)}
            </div>
            <span className="avatar-preview-name">{pal.label}</span>
          </div>

          {/* Right — 3 × 2 hat-style picker */}
          <div className="avatar-grid-box">
            <div className="avatar-grid">
              {BASE_VARIANTS.map(v => {
                const vGrid = buildGrid(v.id, pal);
                return (
                  <button
                    key={v.id}
                    className={`avatar-grid-cell ${draft.baseId === v.id ? 'selected' : ''}`}
                    title={v.label}
                    onClick={() => setDraft(d => ({ ...d, baseId: v.id }))}
                  >
                    {renderSvg(vGrid, pal, GRID_PX, v.id)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Color palette swatches ── */}
        <p className="avatar-section-label">Color Scheme</p>
        <div className="avatar-color-row">
          {COLOR_PALETTES.map(p => (
            <button
              key={p.id}
              className={`avatar-color-swatch ${draft.colorScheme === p.id ? 'selected' : ''}`}
              title={p.label}
              onClick={() => setDraft(d => ({ ...d, colorScheme: p.id }))}
            >
              <span style={{ background: p.skin }} />
              <span style={{ background: p.clothing }} />
            </button>
          ))}
        </div>
        <p className="avatar-palette-label">{pal.label}</p>

        {/* ── Actions ── */}
        <div className="avatar-actions">
          <button className="secondary-btn" onClick={handleDiscard}>Cancel</button>
          <button className="play-btn"      onClick={handleSave}>Save</button>
        </div>

      </div>
    </section>
  );
}
