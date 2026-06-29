export type ListCalloutMarkerRange = {
  markerStart: number;
  markerEnd: number;
  marker: string;
  color: string;
};

const defaultListCallouts = [
  { color: "255, 214, 0", char: "&" },
  { color: "255, 145, 0", char: "?" },
  { color: "255, 23, 68", char: "!" },
  { color: "124, 77, 255", char: "~" },
  { color: "0, 184, 212", char: "@" },
  { color: "0, 200, 83", char: "$" },
  { color: "158, 158, 158", char: "%" },
];

const listCalloutMap = new Map(
  defaultListCallouts.map((callout) => [callout.char, callout]),
);
const listCalloutRegexp = new RegExp(
  `^(\\s*(?:[-*+]|\\d+[.)])(?:\\s+\\[[^\\]\\r\\n]\\])?\\s+)(${defaultListCallouts
    .map((callout) => escapeRegExp(callout.char))
    .join("|")})(?=\\s)`,
  "u",
);

export function getListCalloutMarkerRange(
  text: string,
  lineStart: number,
): ListCalloutMarkerRange | null {
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
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
