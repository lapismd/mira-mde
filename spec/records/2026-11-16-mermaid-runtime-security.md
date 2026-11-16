# Public Mermaid runtime security

MIRA-MERMAID-006 repairs the public package that owns the vulnerable closure.
The source base is `345e6390ec61b61d3c512c6dd40ac8218a9ee34e`. Registry inspection
found no later published Mira Editor or Mermaid plugin than 0.0.4 on any channel.
Their Mermaid 11 range still selects KaTeX 0.16.47. A fresh packed Docs production
consumer reproduced GHSA-238p-pmpm-9mq7 through
`Docs > Mira Editor > Mira Mermaid plugin > Mermaid > KaTeX`; the clean Docs
workspace production audit did not cover that automatically installed peer.
No runtime exception is granted or transferred.

The maintained public plugin now requires Mermaid 12.3+ (below 13) and uses its
bundled ELK support. Official Mermaid 12 layout documentation confirms that ELK
is bundled and becomes the upstream default; Mira explicitly retains Dagre as
its default and preserves explicit caller layout options. Removing the old
external ELK package also removes its Mermaid 11 peer closure. Mermaid 12 declares
Node >=22.12; actual source and packed-consumer qualification use Node 24.19.0.
The public renderer, configuration types, source fallback, controls and package entry
points remain supported. The plugin owns a genuine patch Changeset because
its public runtime dependency changes. Editor also owns a genuine patch intent
to publish its dependency with the repaired plugin minimum; Docs can then require
Editor 0.0.5 rather than retaining an old vulnerable minimum. Versioning and publication retain the
existing source, channel, integrity, approval and verification gates.

Official source references:

- [Mermaid layouts](https://mermaid.js.org/config/layouts)
- [Mermaid 12 migration](https://mermaid.js.org/intro/syntax-reference)
- [Reviewed advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7)

## Before and after

- The public dependency-boundary regression and rejection of the formerly
  accepted packed finding initially failed: two failures. Both now pass;
  all 18 boundary/audit-policy cases pass.
- The renderer compatibility regression initially failed because upstream 12
  would select ELK by default. It passes with Mira's explicit Dagre default
  and retained caller ELK/theme options. The plugin's eight unit cases pass.
- The new real ELK/math browser case first exposed stale built output after
  removing the external package; rebuilding fixed that source-refresh mistake.
  Its next run exposed a duplicate test click after the story play had already
  opened the dialog. The corrected test retains visible SVG, KaTeX, expanded
  dialog and zoom-control assertions and passes in a fresh cold server.
- `pnpm packages:pack` builds all public outputs and validates fresh installs
  without workspace overrides. Both base Mira and the six-package production
  cohort report zero findings. The six-package Svelte, React, Vanilla, CSS,
  browser import, public declaration and leak checks pass. The separate existing
  exact Dnd compiler-warning disposition remains unchanged and emits raw
  production evidence; development diagnostics remain zero.

The former Mermaid 11 KaTeX packed-audit acceptance is retired for newly packed
outputs. Historical records retain their original evidence. Source workspace
full audit still reports its existing development-only deepmerge LOW under its
existing policy; it is not described as a clean full audit or a new approval.
Changed Mermaid stories remain visual-pending. No baseline is generated.

## Source qualification

On Node 24.19.0 with the explicitly selected native validation runtime:

- `pnpm check:all`: pass, including 17 routing cases, all 532 package unit cases,
  strict checks, lint, builds and publint.
- `pnpm spec:first` and `pnpm spec:check`: pass (four canonical lanes).
- `pnpm packages:check`: pass, including 18 boundary/audit-policy cases and 68
  release-tool regressions.
- `pnpm build-storybook`: pass.
- `pnpm test:storybook`: fresh process passes 40 files and 182 interaction/axe
  cases. The first process passed 101 cases but 15 files failed before running
  tests with dynamic-import fetch failures while Vite re-optimized the changed
  lock graph. A new process with the completed optimizer passed every case;
  no source, test or diagnostic was suppressed for that failure.
- `pnpm packages:pack`: pass, zero production findings in both fresh cohorts;
  installed runtime identities are Mermaid 12.3.0, bundled ELK and KaTeX 0.18.10.
- The first full browser process passed 61 cases and failed its first CodeMirror
  story before render with a dynamic-import fetch error. The exact story passes
  unchanged in a fresh cold process. A second full process then hit the same
  unchanged story module import failure during a different indentation case,
  again before product assertions. The server subsequently returned HTTP 200
  for that exact module. These failures remain reported. The final fully frozen
  cold qualification passes all 62 cases under the conditions below. No test
  retry, source workaround, assertion change or new exception is introduced.
- Actionlint: pass. Initial Changesets status selected only the plugin patch.
  The genuine Editor patch intent additionally raises its published minimum
  from plugin ~0.0.4 to ~0.0.5, allowing Docs to require repaired Editor 0.0.5.

The import-boundary investigation preserves all original assertions:

- Warm-cache ordered Bare CodeMirror, comprehensive Live Preview and inactive
  marker sequence: three passes with full traces and optimizer debug output.
- Ordered prefix through both original failure boundaries: 20 passes with full
  traces against the default cache; 20 passes against a fresh task-owned cache;
  20 passes with lighter HAR-only recording and fail-fast behavior.
- Every diagnostic launches a new server with CI=true, forbidding listener reuse.
  Fresh owned server PIDs include 212323,213655,218094,222474 and247017;
  unrelated long-running Notebook's 6006 listener remains untouched.
- Default sb-vite cache identity is 1c3385a5.../hash f33004db,
  lockfileHash 2c5952d7/browserHash dd73c5d4, with 158 optimized dependencies.
  A separate cold CACHE_DIR holds 165. Its scan finds every used dependency;
  no late optimization or HTTP>=400 response is recorded by these diagnostics.
- The seven cold-only optimizer identities are the list-plus Lucide icon,
  @mdx-js/react, @storybook/react-dom-shim, axe-core, clsx, docs-tools and
  instrumenter. This cache difference is an observation, not a proven cause.
- Earlier validation orchestration overlapped some browser runs with other
  builds/specification or record writes. Diagnostic prefixes freeze all inputs.
  The initial failures have no failing-request HTTP capture; subsequent HTTP 200
  for the story module cannot establish their original nested-request status.

Final frozen qualification: all 62 browser cases pass in 3.4 minutes with full
traces, CI=true and a fresh empty task-owned cache. All 918 source-file SHA-256
values match before and after (aggregate
`90a444868152397b124a41e582db47cfe7dcd434b2bea0788bae53372de2ddcc`). The fresh
server PID 269568 owns port 7007; no concurrent build, specification or source
writes occur. The optimizer scan finds every used dependency. The 62 retained
traces contain no failed module import. One optional Visual Delta result-JSON 404
and aborted baseline-image requests in the manager-theme case remain raw
non-functional visual evidence; its unchanged functional assertions pass.

This qualifies the browser gate under corrected validation conditions. It does
not establish a repaired runtime startup defect or erase the earlier failures.
Only the agreed release-intent metadata and canonical evidence text change after
this frozen run; affected release/status/specification checks run afterward.

Packed evidence SHA-256 values:

- Production cohort: `3530076bdf5f30996be4ffc0db46a2f6b8b2c56d49bef9ca57626e2d5ce4c70f`.
- Base Mira: `6f7f4d2ac89ed676838263176f304045a3537f454de658c17cab3877ad0fa29e`.
- Installed runtime identities: `2b8c625411547c9c0be0872e6fdf827fe64d23490513c1386919edc556278e84`.

## Focused Docs peer acceptance

A separate fresh disposable production consumer installs the actual Docs security
candidate archive and the current Mira Mermaid source archive. Only this labelled
validation fixture selects the unreleased plugin archive instead of its registry
artifact. No Docs manifest or public archive is rewritten, no consumer workaround
is committed, and no publication occurs. The plugin archive retains source version
0.0.4 as unreleased validation input; only normal Changesets versioning may prepare
0.0.5 for publication.

Fresh installation and a frozen replay pass; production audit changes from the
original single Mermaid/KaTeX LOW to zero findings across 688 dependencies. API 0.2.8
still reports its existing Mira ~0.1.3 and Design Core range mismatches against the
selected public peers; these warnings are preserved and are not treated as strict
peer-contract qualification. The normal registry-only acceptance remains required
after the repaired plugin is published.

## Workspace and dependency preflight

The release remote was fetched before source preparation. Every registered
workspace was inspected without changing it:

- `default`: this candidate, based on current main 345e6390; includes the repair.
- `canvas-mira-baseline`: empty child of ba0ddf7ed0cf8cc19c3ed7b1db196bdeefaf18d8,
  already an ancestor of main; no unique source work, historical reproduction.
- `foundation-auth-base`: empty child of 11d376297c84247161ff80d80bc3fe7a489a21c8,
  already an ancestor of main; no unique source work, historical reproduction.
- `mira-ci-flake-20261109`: empty child of ba0ddf7ed0cf8cc19c3ed7b1db196bdeefaf18d8,
  already an ancestor of main; no unique source work, historical reproduction.

No open Dependabot PR existed at the preparation query. Recheck before push and
release; no empty consolidation is created. Publication and Docs adoption remain
pending actual merged source, version preparation and verified registry output.
