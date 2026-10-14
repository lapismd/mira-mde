# Portable editing sessions for external file updates

`MiraFileAdapter.registerEditingSession` optionally registers each writable,
source-bound Markdown writer. The session exposes dirty state, awaited flush
and independent temporary protection leases. Protection blocks new edits before
waiting for persistence; its promise resolves only after the writer and Svelte
surface settle. A failed save rejects admission and retains the buffer.

Editable surfaces propagate protection into CodeMirror and extension contexts.
Detached writers stay registered until saving succeeds; failed teardown remains
discoverable for a later host retry. A rejected registration disables its writer.
Write callbacks retain their original adapter/file, and a retired surface cannot
notify a replacement surface with a late persistence completion.

This is a portable file-adapter capability. It does not contain Lapis App,
vault, key or Nostr dependencies. Application-wide registration, apply guards,
file/view lifecycle and exclusive Sync writer ownership remain Lapis integration
work; this capability alone does not activate synchronization.

## Exact regression and browser evidence

- Three writer-protection regressions fail before implementation and pass
  afterward: in-flight save admission, independent leases and retained errors.
- Session attachment initially fails to import its missing implementation.
  The complete writer/session family now passes ten cases, including retained
  teardown and host retry, surface-settle failure and rejected registration.
- Rejected-registration admission moves from one failure to zero.
- `markdown-embeds--editing-protection` exercises a held save, read-only typing,
  protected external refresh and queued-draft document switching in the actual
  public editable preview. The complete seven-story embed family passes.
- The existing editable-preview story initially fails at cold CJS annotation
  startup. Prebundling Storybook's transitive `aria-query` dependencies and
  retaining the SSR transform fixes that exact target without dependency edits.

The complete 157-story interaction/accessibility lane passes. Fresh Playwright
acceptance uses the existing configuration/tests with only an ignored port and
test-directory projection, so the original checkout's server is not reused.
The first run passes 48 cases and fails the coarse-pointer case because it
hard-codes port 7007. That test now reads the configured `baseURL`; its exact
retry passes, then all 49 cases pass on a fresh isolated server.

## Package and consumer qualification

Root check, lint, sequential full tests, build, specification and catalog gates
pass. The core suite passes 366 cases; all eleven test tasks pass. All eight
build tasks pass with publint. Static Storybook build succeeds. Audit reports
zero advisories. Changeset intent is recorded without bumping versions.

Initial npm pack includes 189 emitted test artifacts. Explicit package-file
exclusions produce a 728-file pack with zero unit/spec test modules while
retaining the editing-session declaration and public entry points. The existing
package-boundary and release-configuration checks pass. The current Changesets
CLI also audits Git history; its acceptance now snapshots actual manifests and
Changesets into a committed isolated fixture, explicitly verifies the absence
of `main` and queries `HEAD~1`. The original release-plan target moves from
failure to a pass, and all thirty release tests pass without relaxed assertions.

The original Nostr plugin consumes the rebuilt API and Mira tarballs only in
its ignored validation setup. Its checks, 116 unit cases with the existing
integration skip, build/publint, 58 fresh stories and static build pass. Source
dependency ranges and committed lockfiles remain unchanged. The new story
retains `visual-pending` and an independent declared baseline path; no visual
baseline is generated or approved.

The source remains in `../mira-sync-runtime`. The default Mira checkout's
unrelated tracked package artifact remains untouched. Lapis integration and
the remaining Deno/server/client plan still require implementation and landing.
