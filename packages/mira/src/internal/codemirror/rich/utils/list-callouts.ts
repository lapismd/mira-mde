import {
  resolveMiraListCallouts,
  type MiraListCallout,
} from "@lapismd/mira/extensions";

export type ListCalloutMarkerRange = {
  markerStart: number;
  markerEnd: number;
  marker: string;
  color: string;
  callout: ReturnType<typeof resolveMiraListCallouts>[number];
};

export type ListCalloutMatcher = (
  text: string,
  lineStart: number,
) => ListCalloutMarkerRange | null;

export function getListCalloutMarkerRange(
  text: string,
  lineStart: number,
  contributions: readonly MiraListCallout[] = [],
): ListCalloutMarkerRange | null {
  return createListCalloutMatcher(contributions)(text, lineStart);
}

export function createListCalloutMatcher(
  contributions: readonly MiraListCallout[] = [],
): ListCalloutMatcher {
  const callouts = resolveMiraListCallouts(contributions);
  const listCalloutMap = new Map(
    callouts.map((callout) => [callout.char, callout]),
  );
  const listCalloutRegexp = createListCalloutRegexp(callouts);

  return (text, lineStart) => {
    const match = listCalloutRegexp.exec(text);
    const marker = match?.[2];
    const callout = marker ? listCalloutMap.get(marker) : undefined;
    if (!match || !marker || !callout) {
      return null;
    }

    const markerStart = lineStart + (match[1]?.length ?? 0);
    return {
      markerStart,
      markerEnd: markerStart + marker.length,
      marker,
      color: callout.color,
      callout,
    };
  };
}

export function createListCalloutRegexp(
  callouts: readonly Pick<MiraListCallout, "char">[],
): RegExp {
  const markers = callouts
    .map((callout) => callout.char.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  return markers.length
    ? new RegExp(
        `^(\\s*(?:[-*+]|\\d+[.)])(?:\\s+\\[[^\\]\\r\\n]\\])?\\s+)(${markers
          .map(escapeRegExp)
          .join("|")})(?=\\s)`,
        "u",
      )
    : /$a/u;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
