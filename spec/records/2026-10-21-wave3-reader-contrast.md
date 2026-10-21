# Reader annotation contrast

Date: 2026-10-21. Revision: enclosing Jujutsu change.

CI 39581024874 passes governance and full package/packed-consumer checks.
Storybook reports 167 passes and one accessibility failure in the new TableReader
annotated-row story: `--mira-muted` is a surface color, yielding 1.09:1 text
contrast. Use existing `--mira-muted-foreground` for annotation text. Keep the
same production component, interaction assertions and strict axe gate.

MIRA-CAT-005/006 and the public token contract are unchanged. Hosted rerun must
prove the exact previously failing story and the complete catalog. Local
formatting and catalog checks remain required; no baseline update is admitted.
The separate canonical-runner failure remains blocked on an owning upstream
Visual Delta fix/publication. No Mira publication is approved by this correction.
