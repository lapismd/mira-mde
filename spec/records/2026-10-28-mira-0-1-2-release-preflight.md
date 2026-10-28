# Mira 0.1.2 release preflight

Publication of `@lapismd/mira@0.1.2` from the unified candidate plus the
unpatched deepmerge audit waiver. Companions stay at `0.0.3`.

## Workspace inventory

After `jj git fetch` and `jj workspace list`, each registered workspace tip was
compared with release source `88ac686c` (unified candidate record).

| Workspace                                                                       | Tip / parent           | Disposition                                   |
| ------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------- |
| default                                                                         | empty on `88ac686c`    | Release editing workspace; candidate included |
| input-lease-20261026                                                            | parent `c5d1e4b6`      | Included (main-lineage lease commit)          |
| preview-attachment-tracking-20261026                                            | parent `d24f79bf`      | Included via duplicate `0fbf3d7a`             |
| properties-edit-boundary-20261026                                               | parent `cb8f2b2b`      | Included via duplicate `5ee4c0e7`             |
| bits-intake-20261025 / bits-intake-pack-validation-20261025                     | parents on Bits intake | Included through `fd2bcd15` ancestry          |
| desktop-migration, inline-links, npm-release, static-registry-ci, wave3-release | empty heads only       | Clean; empty heads outside release ancestry   |

No further workspace merge is required. Secondary empty heads stay unmerged.

## Dependency disposition

Open Dependabot pull requests: none. No consolidation PR opened.

## Audit waiver

`pnpm audit` reports only low `GHSA-gcqx-w48m-w2h4` (deepmerge via
`@sveltejs/vite-plugin-svelte`). Patched versions are `<0.0.0`. The finding is
dev-tooling only; packed production audit remains KaTeX-exception scoped.
`auditConfig.ignoreGhsas` lists that GHSA. MIRA-ARCH-039 now names
`ignoreGhsas` to match pnpm 10 workspace config.

## Release source and changesets

Four pending patch changesets target `@lapismd/mira` only:

- `frontmatter-edit-boundary`
- `markdown-input-lease`
- `preview-attachment-tracking`
- `quiet-overlay-dependency`

Expected Version Packages selection: `@lapismd/mira@0.1.2`.
