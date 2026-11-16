# Bounded npm publication visibility

Release43811922461/2 acknowledged Mermaid plugin0.0.5 publication from reviewed
source `f0c18ff0aef5f48e3f3cfbb8f1b786c0ec6e0db4`, including npm provenance, but
its twelve-probe integrity wait exhausted before registry read-back qualified.
The original failed exact-source approval was separately corrected through the
protected environment value and gh approval, without changing source or secrets.

A later independent official-registry read returned the expected SHA512 and
byte-identical retained plugin archive (12217bytes, SHA256
`9dd157e24c41d617199e16217169d3ff0c83f3e715219a4a523bd3a94e407710`).
The receipt is local/ignored. This establishes eventual visibility and unchanged
bytes, not whether the earlier misses came from propagation or metadata caching.
Only the failed jobs were retried; no artifact was rebuilt or verified version
republished. Editor and final post-publication qualification remain separate.

The source-owned publisher now allows36 read-only probes, with ten seconds
between missing results (at most350seconds of explicit delay). It performs no
additional publish while polling. Integrity disagreement and lookup errors
remain immediately fatal; exhaustion remains incomplete rather than successful.
Exact-source, environment, OIDC, artifact and dependency-order gates are intact.

The exact regression uses the real publication driver and bounded wait with a
fake clock/registry: an acknowledged version becomes visible after the former
twelve misses. It fails before the polling change and passes after, with one
write and thirteen reads. Exhaustion, post-publication disagreement and unknown
lookup errors remain negative controls. All ten publisher tests pass.

This private release helper changes no public package, dependency graph,
lockfile, product output, visual baseline or release intent. Default Docker
qualification passes70 release tests, normal check, lint and all four canonical
lanes. Formatter and release preflight pass; no Dependabot PR is open. Doctor
passes seven checks with the existing governed-wrapper alias warning; QMD is
explicitly disabled and the required search reports its fallback. Hosted source
review and delivery remain separate pending qualification.
