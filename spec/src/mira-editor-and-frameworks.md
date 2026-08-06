# Mira Editor and Framework Surfaces

Mira Editor composes the portable editor with compact toolbar and view
controls. Lower-level and framework-specific packages remain adapters over the
same controller and rendering contracts.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-UI-001 | `MiraEditor` MUST expose source, live-preview, preview, and split modes with declarative feature configuration.                                                                                                                                                                         |
| MIRA-UI-002 | `MiraEditorToolbar` MUST keep formatting and plugin actions compact, accessible, and host-extensible through declarative toolbar definitions.                                                                                                                                           |
| MIRA-UI-003 | Icon-only controls MUST have stable accessible names and hover titles when the action is not self-evident.                                                                                                                                                                              |
| MIRA-UI-004 | `Mira`, `MiraEditor`, `MiraEditorToolbar`, `MarkdownPreview`, and documented framework wrappers MUST preserve their public entrypoints.                                                                                                                                                 |
| MIRA-UI-005 | React and Vanilla surfaces MUST remain thin adapters over the portable controller and shipped styles rather than independent behavior implementations.                                                                                                                                  |
| MIRA-UI-006 | Toolbar and editor interactions MUST be represented by Storybook stories with executable interaction assertions.                                                                                                                                                                        |
| MIRA-UI-007 | Portaled menu and dialog primitives MUST preserve Lapis-compatible interface typography, aligned leading semantic-icon and checkmark columns, and distinct icon and text close controls.                                                                                                |
| MIRA-UI-008 | `@lapismd/mira/ui` MUST export a shared Popover family with Storybook verification. CodeMirror slash-command suggestions MAY retain a coordinate-aware tooltip adapter but MUST share the Popover's tokens, typography, and floating-surface chrome.                                    |
| MIRA-UI-009 | The Mira, Mira Editor, React, and Vanilla outline option MUST compose the public Markdown outline without replacing preview scroll ownership. `floating` MUST be the default presentation and `sidebar` MUST preserve the persistent panel variant.                                     |
| MIRA-UI-010 | Mira, Mira Editor, React, and Vanilla MUST expose the same open-ended theme string and independent color-mode contract without framework-specific ancestor observers.                                                                                                                   |
| MIRA-UI-011 | The default toolbar overflow MUST expose an accessible About dialog with Mira's package version and package-owned logo. The dialog MUST crop the combined asset to its light variant in light mode and dark variant in dark mode while remaining responsive.                            |
| MIRA-UI-012 | Default Markdown toolbar actions MUST use the active editor selection and syntax context to toggle headings, inline formatting, links, quotes, and list types in one undoable edit across source and live-preview modes, with equivalent behavior through supported framework adapters. |

View controls belong at the end of the toolbar. Consumers own surrounding
application shells, routes, persistence, and domain state.

Integrated toolbars delegate smart Markdown items through the public editor
handle. A standalone toolbar without an editor context retains template
insertion, while readonly and pure reading surfaces disable built-in authoring
items.

The batteries-included editor, plugins, React adapter, and Vanilla adapter
consume only built public roots or documented subpath exports. They do not link
to the consolidated workspace's private source directories. React exports
components only; the `createMira` and `createMiraEditor` DOM factories are owned
by `@lapismd/mira-vanilla`.

Mira Editor, React, and Vanilla each version independently and ship their own
changelog. The editor's release version command synchronizes
`MIRA_EDITOR_VERSION` from `packages/mira-editor/package.json`; source and UI
tests consume the exported constant instead of duplicating a release literal.
