# Verification

This matrix is both requirement traceability and the implementation progress
artifact. Evidence marked **Planned** must be updated as the Storybook-only
migration lands; existing package tests remain valid evidence where noted.

| Requirements                                                                                     | Evidence                                                              | Status                                   |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------- |
| MIRA-ARCH-001, MIRA-ARCH-002, MIRA-ARCH-003, MIRA-ARCH-004                                       | Package exports, package checks/tests/builds, boundary review         | Implemented                              |
| MIRA-ARCH-005                                                                                    | Storybook-only host migration and root script checks                  | Planned                                  |
| MIRA-MD-001, MIRA-MD-002, MIRA-MD-003, MIRA-MD-004, MIRA-MD-005, MIRA-MD-006                     | Package unit tests, Layout Showcase, existing demo browser acceptance | Implemented; browser evidence to migrate |
| MIRA-MD-007                                                                                      | Comprehensive and focused fixture coverage checker                    | Planned                                  |
| MIRA-UI-001, MIRA-UI-002, MIRA-UI-003, MIRA-UI-004, MIRA-UI-005                                  | Default UI, Svelte, React, and Vanilla tests/builds                   | Implemented                              |
| MIRA-UI-006                                                                                      | Storybook browser project and `play` interactions                     | Planned                                  |
| MIRA-CSS-001, MIRA-CSS-002                                                                       | Package stylesheet exports, no-Tailwind package checks                | Implemented                              |
| MIRA-CSS-003, MIRA-CSS-004, MIRA-CSS-005, MIRA-CSS-006                                           | Public surface/token registry and catalog checker                     | Planned                                  |
| MIRA-AI-001, MIRA-AI-002, MIRA-AI-003                                                            | `packages/plugin-ai` unit tests                                       | Implemented                              |
| MIRA-AI-004                                                                                      | Deterministic AI story interaction                                    | Planned                                  |
| MIRA-MERMAID-001, MIRA-MERMAID-002, MIRA-MERMAID-003, MIRA-MERMAID-004                           | Mermaid package tests and existing Storybook stories                  | Implemented                              |
| MIRA-MERMAID-005                                                                                 | Expanded Mermaid story interaction matrix                             | Planned                                  |
| MIRA-CAT-001, MIRA-CAT-002                                                                       | Spec mirrors and catalog link checker                                 | Planned                                  |
| MIRA-CAT-003, MIRA-CAT-004                                                                       | Storybook fixture consolidation and comprehensive demo stories        | Planned                                  |
| MIRA-CAT-005                                                                                     | Vitest Storybook browser project and interaction tests                | Planned                                  |
| MIRA-CAT-006                                                                                     | Visual Delta tags and compare-only Playwright suite                   | Implemented; new stories pending review  |
| MIRA-GOV-001, MIRA-GOV-002, MIRA-GOV-003, MIRA-GOV-004, MIRA-GOV-005, MIRA-GOV-006, MIRA-GOV-007 | `pnpm spec:check`, checker tests, pull-request workflow               | Implemented by governance slice          |

## Validation tiers

- Specification-only: `pnpm spec:check`.
- Package change: affected package `check`, `test`, and `build` where exported
  code, styles, or wrappers change.
- Catalog change: Storybook browser tests and `pnpm build-storybook`.
- Interaction/geometry change: Storybook browser tests plus focused Playwright.
- Visual change: compare-only validation first; baseline mutation requires a
  separate approved review step.

The portable parity audit recorded 59 present features, six consumer-adapter
boundaries, six Lapis-only behaviors, and no remaining portable P0-P2 gaps at
the time it was retired. This is historical evidence, not a waiver from current
tests or the requirements above.
