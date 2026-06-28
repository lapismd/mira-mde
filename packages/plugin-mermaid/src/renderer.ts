import elkLayouts from "@mermaid-js/layout-elk";
import mermaid, { type MermaidConfig, type RenderResult } from "mermaid";

mermaid.registerLayoutLoaders(elkLayouts);
const mermaidExternalDiagrams = mermaid.registerExternalDiagrams([]);

const defaultMermaidConfig = {
  startOnLoad: false,
  securityLevel: "strict",
  theme: "default",
} satisfies MermaidConfig;

mermaid.initialize(defaultMermaidConfig);

export async function mermaidRender(
  id: string,
  code: string,
  config?: MermaidConfig,
): Promise<RenderResult> {
  await mermaidExternalDiagrams;
  mermaid.initialize(
    config ? { ...defaultMermaidConfig, ...config } : defaultMermaidConfig,
  );
  return mermaid.render(id, code);
}

export type { MermaidConfig, RenderResult };
