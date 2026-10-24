# Linux release repairs

Release qualification found existing failures on the unchanged source as well
as the Docker candidate. Repair source behavior and deterministic readiness;
retain assertions and existing visual-baseline approval.

- Block toolbar: the exact new unit regression failed once with one uncaught
  range error before the fix. Refresh cached handles synchronously when the
  document changes so gutter IDs cannot act on an older document range.
- Table typography: cold column measurements ran before web fonts settled.
  Await the owning document's fonts while preserving every geometry assertion.
- Fold controls: the exact cold browser case repeatedly reported a vertical
  delta of -1.7578125px. Anchor the control to inline text metrics and remove
  the fixed -2px adjustment while preserving the 1.5px acceptance bound;
  diagnostic output now retains the signed delta.

The exact two-file Storybook reproduction passed 8/8 after the toolbar and
font-readiness repairs. The new unit regression changed from one failure and
one uncaught range error to one pass without errors. The exact fold case now
passes on Linux and macOS. Full Docker qualification passed all 170 Storybook
interaction/accessibility cases, all 60 cold browser cases, the static build,
499 package tests, formatting, diagnostics, lint, audit, specification and
six-package packed-consumer checks. The existing narrow KaTeX packed-audit
acceptance remains unchanged and its complete report is retained.

Visual review is pending; the affected list story is `visual-pending` and no
baseline was updated. Hosted CI must qualify the final reordered release
candidate before merging or publishing.
