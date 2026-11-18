# Mira explicit-user development HIGH decision

This records the exact explicit user approval given in the organisation cleanup
thread for HIGH GHSA-fc5q-39xc-vjpf on both Mira picomatch development paths. It
does not transfer Docs, Tasks, Core, or coordinator authority. Production
findings and every unmatched full finding remain blocking.

## Reviewed source and evidence

Dependency source: `efd6eb0f6bb3dd90d314fc82e0fdb93ccd739b3c`.
Manifest SHA256: `b5ee695f16d307bdf936f5faa529a36bcf8e8179970c3778ecd232327fd69799`.
Lock SHA256: `da5000188deea37ad19e01bc875ae9258bd632b402680fe4da8a5ac737523c71`.

The disabled proposal at
`docs/proposals/picomatch-development-2026-11-19.md` and its facts file bound
these identities before approval. Shared collector pin remains
`63e64958e9b271d36feba06a162ee02b079a3206`. Raw full audit retains HIGH2 with
all other severities0; production audit is clean; muted is empty.

## Exact decision

At 2026-11-18T13:30:52.633Z, under explicit-user authority, accept only
GHSA-fc5q-39xc-vjpf, HIGH picomatch, on these exact development-only paths:

- 4.0.7 at `.>@changesets/cli>@changesets/config>picomatch`
- 4.0.5 at `.>@changesets/cli>@changesets/git>picomatch`

Vulnerable range `<=4.0.7`, patched range `<0.0.0`. Expiry remains
2026-11-19T00:00:00.000Z, or sooner on a known patch or official stable
successor above 4.0.7. The shared checker additionally limits HIGH to 48 hours
from this approval timestamp. No renewal, broader ignore, production exception,
or cross-repository transfer is granted.
