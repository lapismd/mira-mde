import "./manager-color-mode-toggle.js";
import { addons } from "storybook/manager-api";
import {
  defaultConfig,
  type Badge,
  type BadgeOrBadgeFn,
  type TagBadgeParameters,
} from "storybook-addon-tag-badges/manager-helpers";
import type { CSSObject } from "storybook/theming";
import { stackedRenderLabel } from "./manager-stacked-badges.js";

const SMALL_CAPS: CSSObject = {
  fontVariant: "all-small-caps",
  letterSpacing: "0.04em",
};

/**
 * Solid fills with white glyphs/text. Each fill clears WCAG AA (≥4.5:1)
 * against `#ffffff` so icons and labels stay readable, and chips stay
 * distinct on Storybook’s light chrome.
 */
const PRESET_COLORS = {
  green: {
    backgroundColor: "#15843e",
    borderColor: "#0c5a29",
    color: "#ffffff",
  },
  purple: {
    backgroundColor: "#5d22c3",
    borderColor: "#3d1386",
    color: "#ffffff",
  },
  blue: {
    backgroundColor: "#157dac",
    borderColor: "#0a5070",
    color: "#ffffff",
  },
  grey: {
    backgroundColor: "#656e81",
    borderColor: "#3f4656",
    color: "#ffffff",
  },
  orange: {
    backgroundColor: "#c2540a",
    borderColor: "#8a3a05",
    color: "#ffffff",
  },
  red: {
    backgroundColor: "#c52020",
    borderColor: "#8a1414",
    color: "#ffffff",
  },
  yellow: {
    backgroundColor: "#a66707",
    borderColor: "#734603",
    color: "#ffffff",
  },
  pink: {
    backgroundColor: "#c32273",
    borderColor: "#8a1450",
    color: "#ffffff",
  },
  turquoise: {
    backgroundColor: "#12826c",
    borderColor: "#0a5344",
    color: "#ffffff",
  },
} as const satisfies Record<string, CSSObject>;

type StylePreset = keyof typeof PRESET_COLORS;

const SIDEBAR_ICON_STYLE: CSSObject = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  minWidth: 18,
  padding: 0,
  borderRadius: "50%",
  fontSize: 11,
  lineHeight: 1,
  fontVariant: "normal",
  letterSpacing: 0,
  fontWeight: 700,
  // Keep white icon even if a caller spreads other styles later.
  color: "#ffffff",
};

/** Sidebar glyph + full toolbar label for each configured tag. */
const TAG_ICONS: Record<string, string> = {
  "skip-visual": "⊘",
  "skip-test": "∅",
  "visual-state": "◉",
  "visual-pending": "⏱",
  "visual-approved": "⛨",
  "visual-failed": "✕",
  new: "✦",
  alpha: "α",
  beta: "β",
  rc: "R",
  experimental: "Δ",
  deprecated: "↓",
  outdated: "⌛",
  danger: "!",
  "code-only": "{}",
};

function resolvePresetColors(style: Badge["style"]): CSSObject {
  if (typeof style === "string" && style in PRESET_COLORS) {
    return PRESET_COLORS[style as StylePreset];
  }
  if (typeof style === "object" && style != null) {
    return style;
  }
  return {};
}

function sidebarIconFor(tag: string, text: string): string {
  if (TAG_ICONS[tag]) return TAG_ICONS[tag];
  if (tag.startsWith("v:") || tag.startsWith("version:")) return "v";
  // First character of the label as a last resort.
  return text.trim().charAt(0) || "?";
}

function withContextBadge(badge: BadgeOrBadgeFn): BadgeOrBadgeFn {
  return (params) => {
    const resolved = typeof badge === "function" ? badge(params) : { ...badge };
    const colors = resolvePresetColors(resolved.style);
    const { context, tag } = params;
    const icon = sidebarIconFor(tag, resolved.text);

    if (context === "sidebar") {
      return {
        text: icon,
        style: {
          ...colors,
          ...SIDEBAR_ICON_STYLE,
        },
        // Addon disables sidebar tooltips; omit so we don't imply they work.
      };
    }

    // Toolbar / MDX: glyph before the label (e.g. "⛨ Approved").
    const label = resolved.text.trim();
    const text =
      icon && label && !label.startsWith(icon)
        ? `${icon} ${label}`
        : label || icon;

    return {
      ...resolved,
      text,
      style: {
        ...colors,
        ...SMALL_CAPS,
      },
    };
  };
}

function withContextBadges(configs: TagBadgeParameters): TagBadgeParameters {
  return configs.map((entry) => ({
    ...entry,
    badge: withContextBadge(entry.badge),
  }));
}

/**
 * Review status on component/group (high-level scan) and on leaves.
 * `skipInherited: false` so a parent ⛨ does not hide Approved on stories.
 */
const REVIEW_SIDEBAR_DISPLAY = [
  { type: "story" as const, skipInherited: false },
  { type: "docs" as const, skipInherited: false },
  { type: "component" as const, skipInherited: false },
  { type: "group" as const, skipInherited: false },
];

addons.setConfig({
  // Custom renderLabel stacks every matching tag like an avatar group.
  sidebar: {
    ...addons.getConfig()?.sidebar,
    renderLabel: stackedRenderLabel,
  },
  tagBadges: withContextBadges([
    {
      tags: "skip-visual",
      badge: {
        text: "Skip visual",
        style: "yellow",
        tooltip: "Excluded from Playwright visual baselines",
      },
    },
    {
      tags: "skip-test",
      badge: {
        text: "Skip test",
        style: "grey",
        tooltip: "Excluded from Storybook Vitest",
      },
    },
    {
      tags: "visual-failed",
      badge: {
        text: "Failed",
        style: "red",
        tooltip: "Baseline review failed or rejected",
      },
      display: { sidebar: REVIEW_SIDEBAR_DISPLAY, toolbar: ["docs", "story"] },
    },
    {
      tags: "visual-pending",
      badge: {
        text: "Pending review",
        style: "orange",
        tooltip: "Baseline exists; awaiting human approval",
      },
      display: { sidebar: REVIEW_SIDEBAR_DISPLAY, toolbar: ["docs", "story"] },
    },
    {
      tags: "visual-approved",
      badge: {
        text: "Approved",
        style: "green",
        tooltip: "Baseline reviewed and accepted",
      },
      display: { sidebar: REVIEW_SIDEBAR_DISPLAY, toolbar: ["docs", "story"] },
    },
    {
      tags: "visual-state",
      badge: {
        text: "Visual",
        style: "turquoise",
        tooltip: "Explicit visual-state story",
      },
    },
    // Defaults after custom matchers so repo tags win priority.
    ...defaultConfig,
  ]) satisfies TagBadgeParameters,
});
