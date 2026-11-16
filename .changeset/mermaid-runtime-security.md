---
"@lapismd/mira-plugin-mermaid": patch
"@lapismd/mira-editor": patch
---

Use maintained Mermaid 12 with its bundled ELK layout so published editor consumers no longer inherit the vulnerable KaTeX 0.16 chain. Preserve Mira's Dagre default, inline/dialog rendering, source fallback and controls, and require zero production audit findings without the historical Mermaid cohort exception. Raise the published Mira Editor dependency floor to the repaired plugin patch so consumers can require a safe Editor minimum. Mermaid 12 requires Node 22.12 or later for Node-based tooling; this release is qualified on Node 24.
