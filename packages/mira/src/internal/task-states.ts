export type MiraTaskState = {
  marker: string;
  label: string;
};

export const miraTaskStates = [
  { marker: " ", label: "Unchecked" },
  { marker: "x", label: "Complete" },
  { marker: "/", label: "In progress" },
  { marker: "?", label: "Needs decision" },
  { marker: "-", label: "Cancelled" },
  { marker: "!", label: "Important" },
  { marker: ">", label: "Forwarded" },
  { marker: "<", label: "Scheduled" },
  { marker: "l", label: "Location" },
  { marker: "*", label: "Starred" },
  { marker: "i", label: "Information" },
  { marker: "S", label: "Savings" },
  { marker: "I", label: "Idea" },
  { marker: "f", label: "Fire" },
  { marker: "k", label: "Key" },
  { marker: "u", label: "Trending up" },
  { marker: "d", label: "Trending down" },
  { marker: "w", label: "Win" },
  { marker: "p", label: "Thumbs up" },
  { marker: "c", label: "Thumbs down" },
  { marker: "b", label: "Bookmark" },
  { marker: '"', label: "Quote" },
] as const satisfies readonly MiraTaskState[];

export function normalizeMiraTaskMarker(marker: string): string {
  return marker === "X" ? "x" : marker;
}
