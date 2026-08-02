# Specification Governance

Specification changes precede or accompany protected implementation changes.
The gate is intentionally package-aware: updating an unrelated chapter does not
satisfy a plugin or package contract change.

## Requirements

| ID           | Requirement                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-GOV-001 | `spec/src` Markdown MUST be canonical, indexed once by `SUMMARY.md`, link-valid, and buildable by mdBook.                                   |
| MIRA-GOV-002 | Requirement IDs MUST be unique and each ID MUST appear in the verification matrix.                                                          |
| MIRA-GOV-003 | Protected implementation and configuration changes MUST update every mapped canonical chapter in the same logical change.                   |
| MIRA-GOV-004 | The local gate MUST inspect the current Jujutsu change; pull-request CI MUST compare the exact base and head revisions.                     |
| MIRA-GOV-005 | Tests, generated output, visual results, and ordinary story assertions MUST NOT satisfy or spuriously trigger the specification-first gate. |
| MIRA-GOV-006 | Governance tooling MUST have regression tests and MUST fail closed when it cannot determine a trustworthy change set.                       |
| MIRA-GOV-007 | Generated mdBook output MUST remain untracked.                                                                                              |

`spec:validate` also enforces a one-to-one relationship between chapters
indexed by `SUMMARY.md`, raw Markdown Storybook mirrors, and the internal-link
registry. Mirror MDX files contain composition only; they do not copy normative
prose.

## Change map

| Protected area                                                         | Required chapter               |
| ---------------------------------------------------------------------- | ------------------------------ |
| Controller, extension, CodeMirror, preview, and table source           | `editor-and-markdown.md`       |
| Default UI and UI source                                               | `default-ui-and-frameworks.md` |
| Framework adapters                                                     | `default-ui-and-frameworks.md` |
| Theme and shipped public CSS                                           | `styling.md`                   |
| `plugin-ai`                                                            | `plugins/ai.md`                |
| `plugin-mermaid`                                                       | `plugins/mermaid.md`           |
| Storybook infrastructure and catalog metadata                          | `storybook-catalog.md`         |
| Root architecture, workspace, build, and public manifest configuration | `architecture.md`              |
| Governance scripts, spec configuration, and CI workflows               | `spec-governance.md`           |

The protected governance set includes both the specification checkers and the
catalog/token checker. Changes to either cannot weaken or bypass the contract
without updating this chapter in the same logical change.

## Agent workflow

1. Inspect Jujutsu status and preserve unrelated work.
2. Read the mapped chapter and requirement IDs.
3. Update requirements and verification before or with implementation.
4. Add focused unit, story interaction, browser, or visual evidence.
5. Run `pnpm spec:check` plus boundary-appropriate validation.
6. Commit the verified logical slice with a review-quality message.
