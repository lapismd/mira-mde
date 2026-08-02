import { EditorView } from "@codemirror/view";

export function createSourceToggleButton(
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "mira-rich-widget__source-toggle markdown-widget-select-control";
  button.title = "Edit source";
  button.setAttribute("aria-label", "Edit source");
  button.append(createCodeXmlIcon());
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createCodeXmlIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("mira-rich-widget__source-icon", "svg-icon");
  appendSvgPath(svg, "m18 16 4-4-4-4");
  appendSvgPath(svg, "m6 8-4 4 4 4");
  appendSvgPath(svg, "m14.5 4-5 16");
  return svg;
}

function appendSvgPath(svg: SVGSVGElement, d: string): void {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.append(path);
}

export function selectWidgetSource(
  view: EditorView,
  from: number,
  to: number,
): void {
  view.dispatch({
    selection: { anchor: from, head: to },
    scrollIntoView: true,
  });
  view.focus();
}
