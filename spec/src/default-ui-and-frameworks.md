# Default UI and Framework Surfaces

The default UI composes the portable editor with compact toolbar and view
controls. Lower-level and framework-specific packages remain adapters over the
same controller and rendering contracts.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIRA-UI-001 | `MiraDefaultMde` MUST expose source, live-preview, preview, and split modes with declarative feature configuration.                                                                                                                              |
| MIRA-UI-002 | `MiraDefaultToolbar` MUST keep formatting and plugin actions compact, accessible, and host-extensible through declarative toolbar definitions.                                                                                                   |
| MIRA-UI-003 | Icon-only controls MUST have stable accessible names and hover titles when the action is not self-evident.                                                                                                                                       |
| MIRA-UI-004 | `MiraMde`, `MiraDefaultMde`, `MiraDefaultToolbar`, `MarkdownPreview`, and documented framework wrappers MUST preserve their public entrypoints.                                                                                                  |
| MIRA-UI-005 | React and Vanilla surfaces MUST remain thin adapters over the portable controller and shipped styles rather than independent behavior implementations.                                                                                           |
| MIRA-UI-006 | Toolbar and editor interactions MUST be represented by Storybook stories with executable interaction assertions.                                                                                                                                 |
| MIRA-UI-007 | Portaled menu and dialog primitives MUST preserve Lapis-compatible interface typography, aligned leading semantic-icon and checkmark columns, and distinct icon and text close controls.                                                         |
| MIRA-UI-008 | `@mira-mde/ui` MUST export a shared Popover family with Storybook verification. CodeMirror slash-command suggestions MAY retain a coordinate-aware tooltip adapter but MUST share the Popover's tokens, typography, and floating-surface chrome. |

View controls belong at the end of the toolbar. Consumers own surrounding
application shells, routes, persistence, and domain state.
