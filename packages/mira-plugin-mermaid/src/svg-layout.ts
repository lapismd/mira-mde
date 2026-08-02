type MermaidSvgLayoutMode = "inline" | "dialog";

function isNumericDimension(value: string | null): value is string {
  return value !== null && /^[0-9]+(?:\.[0-9]+)?$/.test(value);
}

function parseViewBoxDimension(viewBox: string, index: 2 | 3): number | null {
  const value = Number(viewBox.trim().split(/\s+/)[index]);
  return Number.isFinite(value) ? value : null;
}

export function getMermaidSvgViewBox(svg: SVGSVGElement): string | null {
  const explicitViewBox = svg.getAttribute("viewBox");
  if (explicitViewBox) {
    return explicitViewBox;
  }

  const width = svg.getAttribute("width");
  const height = svg.getAttribute("height");
  if (!isNumericDimension(width) || !isNumericDimension(height)) {
    return null;
  }

  return `0 0 ${width} ${height}`;
}

export function applyMermaidSvgLayout(
  svg: SVGSVGElement,
  viewBox: string,
  mode: MermaidSvgLayoutMode,
): void {
  const viewBoxWidth = parseViewBoxDimension(viewBox, 2);
  const viewBoxHeight = parseViewBoxDimension(viewBox, 3);

  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  svg.style.display = "block";
  svg.style.marginInline = "auto";

  if (mode === "dialog") {
    svg.setAttribute("width", "100%");
    svg.style.width = "100%";
    svg.setAttribute("height", "85vh");
    svg.style.cursor = "grab";
    svg.style.maxWidth = "";
    svg.style.touchAction = "none";
    return;
  }

  if (viewBoxWidth !== null) {
    svg.setAttribute("width", String(viewBoxWidth));
    svg.style.maxWidth = `${viewBoxWidth}px`;
    svg.style.width = `min(100%, ${viewBoxWidth}px)`;
  } else {
    svg.setAttribute("width", "100%");
    svg.style.width = "100%";
  }
  if (viewBoxHeight !== null) {
    svg.setAttribute("height", String(Math.min(500, viewBoxHeight)));
  }

  svg.style.cursor = "";
  svg.style.touchAction = "pan-y";
}
