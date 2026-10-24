# Docker validation qualification

The requested change makes root validation Docker-first while preserving
explicit native execution, hosted CI and manual visual-capture policy.

Before implementation, `node --test scripts/validation.test.mjs` failed once
because the runner did not exist. The exact target now passes thirteen regressions:
runtime defaults, lane routing, hosted-native selection, resource limits,
image identity, package archive validation, dirty source/history transfer,
SSH quoting, native argument forwarding, upstream archive layouts, Turbo's
browser environment, early unknown-lane rejection and bounded Storybook shards.

Docker smoke passed with Chromium and WebKit. `pnpm check:all` passed audit,
formatting, diagnostics, lint, 498 package tests and all package builds. Docker
`spec:check`, `packages:check` (including 40 release tests) and `packages:pack`
passed; packed consumer audit evidence is retained with the run. Reusing the
same image returned the same immutable image ID without rebuilding.

Linux product acceptance remains separate: Storybook reported 168/170 passing
with failures in table overflow and block-toolbar source interaction, plus one
uncaught editor-state error. The unchanged parent `1939b85b` reproduced failures
in both families (167/170 passing, three failures and two uncaught errors).
Cold browser acceptance passed 59/60; the fold-control vertical delta is
1.7578125px against the existing 1.5px bound. Both the exact cold rerun and the
unchanged parent reproduce that failure. These remain Mira-owned release
blockers; assertions and visual baselines are unchanged.

Failed containers and reports remain inspectable under `.local/validation/`.
The infrastructure slice changes no product source, baseline or package version.
