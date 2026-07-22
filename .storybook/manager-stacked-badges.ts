import React, { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  addons,
  experimental_useStatusStore,
  type HashEntry,
} from "storybook/manager-api";
import { styled } from "storybook/theming";
import {
  getTagParts,
  getTagPrefix,
  getTagSuffix,
  matchTags,
  type Badge,
  type BadgeOrBadgeFn,
  type TagBadgeParameters,
} from "storybook-addon-tag-badges/manager-helpers";

const Row = styled.div<{
  $hasParentPadding: boolean;
  $hasStatusWithUI: boolean;
}>(({ $hasParentPadding, $hasStatusWithUI }) => ({
  display: "flex",
  flex: 1,
  alignItems: "flex-start",
  flexWrap: "wrap",
  textWrapStyle: "balance",
  gap: 4,
  marginRight: $hasStatusWithUI ? 6 : $hasParentPadding ? 28 : 34,
}));

const Label = styled.div({
  display: "flex",
  alignItems: "center",
  minHeight: 19,
});

const Spacer = styled.div({
  flex: 1,
});

/** Avatar-style overlap: later chips sit on top of earlier ones. */
const Stack = styled.div(({ theme }) => ({
  display: "inline-flex",
  flexDirection: "row",
  alignItems: "center",
  flexShrink: 0,
  // Match sidebar chrome so the ring reads as a cutout, not a halo.
  ["--tag-stack-ring" as string]:
    theme.base === "dark" ? theme.background.content : theme.background.app,
}));

const Chip = styled.div(({ theme }) => ({
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
  fontWeight: 700,
  color: "#ffffff",
  boxSizing: "border-box",
  // Avatar group ring (`ring-background` analogue).
  boxShadow: `0 0 0 1.5px var(--tag-stack-ring, ${theme.background.app})`,
  position: "relative",
  "&:not(:first-of-type)": {
    marginLeft: -6,
  },
}));

type ResolvedBadge = {
  tag: string;
  badge: Badge;
};

function resolveBadge(
  badge: BadgeOrBadgeFn,
  entry: HashEntry,
  tag: string,
): Badge {
  return typeof badge === "function"
    ? badge({
        context: "sidebar",
        entry,
        getTagParts,
        getTagPrefix,
        getTagSuffix,
        tag,
      })
    : badge;
}

function sidebarAllowsType(
  display: TagBadgeParameters[number]["display"],
  type: HashEntry["type"],
): boolean {
  const sidebar = display?.sidebar;
  if (sidebar == null) {
    return (
      type === "story" ||
      type === "docs" ||
      type === "component" ||
      type === "group"
    );
  }
  const conditions = Array.isArray(sidebar) ? sidebar : [sidebar];
  return conditions.some((condition) => {
    if (condition === true) return true;
    if (condition === false) return false;
    if (typeof condition === "string") return condition === type;
    if (typeof condition === "object" && condition != null) {
      return condition.type === type;
    }
    return false;
  });
}

/** All matching badges in config order (not just the first). */
export function collectSidebarBadges(item: HashEntry): ResolvedBadge[] {
  if (
    item.type !== "story" &&
    item.type !== "docs" &&
    item.type !== "component" &&
    item.type !== "group"
  ) {
    return [];
  }
  const parameters = (addons.getConfig().tagBadges ?? []) as TagBadgeParameters;
  const tags = item.tags ?? [];
  const out: ResolvedBadge[] = [];

  for (const config of parameters) {
    if (!sidebarAllowsType(config.display, item.type)) continue;
    for (const tag of matchTags(tags, config.tags)) {
      if (out.some((entry) => entry.tag === tag)) continue;
      out.push({
        tag,
        badge: resolveBadge(config.badge, item, tag),
      });
    }
  }
  return out;
}

function hasComponentTestStatus(
  itemStatuses: Record<string, unknown> | undefined,
): boolean {
  return Boolean(itemStatuses?.["storybook/component-test"]);
}

function StackedSidebarLabel({ item }: { item: HashEntry }) {
  const itemStatuses = experimental_useStatusStore((all) => all[item.id]) as
    | Record<string, unknown>
    | undefined;
  const badges = useMemo(() => collectSidebarBadges(item), [item]);
  const title = badges
    .map((entry) => {
      const label =
        typeof entry.badge.tooltip === "string"
          ? entry.badge.tooltip
          : entry.badge.text;
      return label;
    })
    .join(" · ");

  return React.createElement(
    Row,
    {
      $hasParentPadding: item.type === "component" || item.type === "group",
      $hasStatusWithUI: hasComponentTestStatus(itemStatuses),
    },
    React.createElement(Label, null, item.name),
    React.createElement(Spacer, null),
    badges.length
      ? React.createElement(
          Stack,
          { title: title || undefined, "aria-label": title || undefined },
          ...badges.map((entry, index) => {
            const style = {
              ...(typeof entry.badge.style === "object" &&
              entry.badge.style != null
                ? entry.badge.style
                : {}),
              zIndex: badges.length - index,
            } as CSSProperties;
            return React.createElement(
              Chip,
              {
                key: entry.tag,
                style,
                "data-tag": entry.tag,
              },
              entry.badge.text,
            );
          }),
        )
      : null,
  );
}

/**
 * Replaces the tag-badges addon's single-badge `renderLabel` so multiple
 * matching tags stack like an avatar group (e.g. Approved + Pending).
 */
export function stackedRenderLabel(item: HashEntry): ReactNode | undefined {
  if (
    item.type !== "story" &&
    item.type !== "group" &&
    item.type !== "docs" &&
    item.type !== "component"
  ) {
    return undefined;
  }
  return React.createElement(StackedSidebarLabel, { item });
}
