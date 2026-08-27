# Mermaid Plugin

`@lapismd/mira-plugin-mermaid` owns Mermaid language support, deterministic render
identity, reading/live-preview rendering, source fallback, and expanded diagram
controls.

## Requirements

| ID               | Requirement                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| MIRA-MERMAID-001 | Mermaid fences MUST render in reading and live-preview surfaces when the plugin is enabled and remain source when disabled. |
| MIRA-MERMAID-002 | Inline diagrams MUST use responsive SVG layout and unique render IDs across simultaneous editor surfaces.                   |
| MIRA-MERMAID-003 | Expanded diagrams MUST expose accessible zoom, pan, reset, copy, close, and source controls with deterministic teardown.    |
| MIRA-MERMAID-004 | Render failures MUST preserve the source path and expose a usable error state rather than removing the Markdown content.    |
| MIRA-MERMAID-005 | Storybook MUST cover inline, dialog, source fallback, disabled, and representative layout modes with interactions.          |

Mermaid configuration is portable. Application-wide registration and persisted
settings remain consumer responsibilities.
The plugin integrates through supported `@lapismd/mira` CodeMirror, extension,
and preview contracts; it does not depend on a private renderer or editor
workspace.

The package is shipped only as `@lapismd/mira-plugin-mermaid`, begins at
`0.0.1`, and then versions independently with a package-owned changelog. Its
source, manifest, packed output, Storybook examples, and tests must not retain
the pre-release package identity. Its public Mira dependency uses `workspace:~`
so the packed pre-1.0 range remains compatible without accepting unrelated minor
releases. Its package manifest points at the canonical public repository
`lapismd/mira-mde` with package-specific `repository.directory` metadata so npm
and provenance links resolve to the owning monorepo path.
