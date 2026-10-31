---
"@lapismd/mira": patch
---

Bundle the unchanged math adapters and parser helpers behind the existing private
preview boundary while retaining patched KaTeX as an explicit runtime dependency.
Dispose delayed pipe/grid cell focus work with its owning inline editor so table
teardown cannot focus or dispatch into a destroyed CodeMirror view.
Preserve browser/Node behavior, development diagnostics and MIT notices without
requiring consumers to override vulnerable transitive renderer ranges. Packed
production audits require a clean base Mira graph. The existing cohort acceptance
is narrowed to the unchanged Mermaid 11/layout-ELK path and does not apply to
other consumers or base math rendering.
