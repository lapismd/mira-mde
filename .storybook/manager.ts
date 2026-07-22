import { addons } from "storybook/manager-api";
import {
  defaultConfig,
  type Badge,
  type BadgeOrBadgeFn,
  type TagBadgeParameters,
} from "storybook-addon-tag-badges/manager-helpers";
import type { CSSObject } from "storybook/theming";

const SMALL_CAPS: CSSObject = {
  fontVariant: "all-small-caps",
  letterSpacing: "0.04em",
};

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
  color: "#ffffff",
};

const TAG_ICONS: Record<string, string> = {
  "skip-visual": "⊘",
  "skip-test": "∅",
  "visual-pending": "⏱",
  "visual-approved": "⛨",
  "visual-failed": "✕",
  new: "✦",
  beta: "β",
  deprecated: "↓",
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
      };
    }

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

addons.setConfig({
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
    },
    {
      tags: "visual-pending",
      badge: {
        text: "Pending review",
        style: "orange",
        tooltip: "Baseline exists; awaiting human approval",
      },
    },
    {
      tags: "visual-approved",
      badge: {
        text: "Approved",
        style: "green",
        tooltip: "Baseline reviewed and accepted",
      },
    },
    ...defaultConfig,
  ]) satisfies TagBadgeParameters,
});
