# Mira MDE System Specification

This book is the normative contract for Mira MDE. It describes portable editor,
Markdown, plugin, styling, catalog, and verification behavior for humans and
agents. Storybook is the only browsable documentation and demo host; it renders
this source and owns example data, fixtures, component metadata, and interaction
scenarios.

## Authority

When sources disagree, use this order:

1. Requirements under `spec/src/`.
2. Published package interfaces and conforming implementation.
3. Storybook catalog metadata and example fixtures.
4. README files, which provide onboarding and point to the sources above.

Implementation and specification must change together. Storybook may explain or
demonstrate a requirement, but it must link to the canonical chapter instead of
copying normative prose.

## Scope

Mira includes a framework-neutral CodeMirror controller, portable extension
contracts, Markdown parsing and rendering, source/live-preview/reading/split
surfaces, default editor chrome, framework adapters, plain exported CSS, and
optional AI and Mermaid plugins.

Mira does not own vault persistence, workspace panes, application routing,
metadata workers, settings storage, command registries, file trees, sidebars, or
plugin installation. Lapis Notes is a behavioral and visual reference for
portable Markdown features; its application services remain consumer concerns.

Related contracts: [Architecture](./architecture.md),
[Storybook catalog](./storybook-catalog.md), and
[Specification governance](./spec-governance.md).
