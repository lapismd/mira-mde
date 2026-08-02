let fallbackCounter = 0;

export function createMermaidRenderId(sourceOffset?: number | string): string {
  fallbackCounter += 1;
  const normalizedOffset =
    typeof sourceOffset === "number" || typeof sourceOffset === "string"
      ? String(sourceOffset).replace(/[^\w-]/g, "-")
      : "";

  if (normalizedOffset) {
    return `mira-mermaid-${normalizedOffset}-${fallbackCounter}`;
  }

  return `mira-mermaid-auto-${fallbackCounter}`;
}

export function resetMermaidRenderIdCounter(): void {
  fallbackCounter = 0;
}
