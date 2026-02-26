/**
 * Palette algorithm: given a single hue (0–360),
 * derive a complete dark-mode color set via HSL.
 *
 * Perceptual adjustments per hue zone keep the palette balanced:
 * - Yellows/limes  → desaturate a bit (they read too acidic at full sat)
 * - Greens         → slight lightness reduction
 * - Everything else → standard formula
 */

export interface HueSwatch {
  h: number
  label: string
}

export const PRESET_HUES: HueSwatch[] = [
  { h: 28,  label: 'Янтарь'    },
  { h: 10,  label: 'Терракота' },
  { h: 350, label: 'Алый'      },
  { h: 320, label: 'Роза'      },
  { h: 280, label: 'Аметист'   },
  { h: 245, label: 'Индиго'    },
  { h: 210, label: 'Сапфир'    },
  { h: 185, label: 'Бирюза'    },
  { h: 155, label: 'Изумруд'   },
  { h: 100, label: 'Лайм'      },
  { h: 52,  label: 'Золото'    },
  { h: 0,   label: 'Рубин'     },
]

/** Returns the vivid accent color for a given hue (used for swatch preview). */
export function swatchColor(hue: number): string {
  const { s, l } = accentParams(hue)
  return `hsl(${hue},${s}%,${l}%)`
}

/** Applies all CSS custom properties to :root for the given hue. */
export function applyAccentHue(hue: number): void {
  const { s, l } = accentParams(hue)
  const h = hue

  const vars: [string, string][] = [
    // backgrounds — dark, slightly tinted
    ['--bg',       `hsl(${h},${Math.round(s * 0.38)}%,7%)`],
    ['--bg2',      `hsl(${h},${Math.round(s * 0.30)}%,11%)`],
    ['--bg3',      `hsl(${h},${Math.round(s * 0.24)}%,17%)`],
    // text — near-white with subtle hue tint
    ['--text',     `hsl(${h},${Math.round(s * 0.46)}%,91%)`],
    ['--text2',    `hsl(${h},${Math.round(s * 0.26)}%,57%)`],
    // accent — vivid, readable on dark bg
    ['--accent',   `hsl(${h},${s}%,${l}%)`],
    ['--accent-h', `hsl(${h},${Math.min(s + 6, 92)}%,${Math.min(l + 10, 72)}%)`],
    // danger stays red regardless of hue
    ['--danger',   `hsl(0,62%,42%)`],
    ['--danger-h', `hsl(0,68%,52%)`],
    // breathing circle = accent color
    ['--circle',   `hsl(${h},${s}%,${l}%)`],
    // border = low-opacity accent
    ['--border',   `hsla(${h},${s}%,${l}%,0.18)`],
  ]

  const root = document.documentElement
  for (const [prop, val] of vars) root.style.setProperty(prop, val)
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function accentParams(hue: number): { s: number; l: number } {
  // Yellow/lime zone: reduce saturation to avoid acid look
  if (hue >= 45 && hue <= 80)  return { s: 62, l: 50 }
  // Green zone: slight desaturation
  if (hue > 80  && hue <= 155) return { s: 66, l: 52 }
  // Default: vivid
  return { s: 74, l: 54 }
}
