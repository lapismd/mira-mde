# Frontmatter rendered edit boundary

Scope: MIRA-MD-056, MIRA-MD-057 and MIRA-MD-058. This is a separate source slice after the
qualified attachment repair `d24f79bf`. Plugins owns authoritative persistence
and expected-frontmatter comparison; Mira owns portable record and input state.

The exact source boundary is:

```sh
pnpm --filter @lapismd/mira exec vitest run src/preview/frontmatter/edit-boundary.test.ts src/preview/frontmatter-edit-boundary.test.ts
```

Initial frozen `7d55030c`, receipt
`mira-properties-before-a817818e-3ad3-44e9-8ba2-aeb5a61f7b72`, fails all
five cases. Expanded frozen `54dbe729`, receipt
`mira-properties-before-b305c10d-2a58-4d75-ab77-b911c361cb2d`, fails all
six cases and separately proves both deferred DOM-text and callback replacement.
The mounted focus-preservation assertion already passes before editing; its
missing prior-record authority fails later. No native focused-DOM failure is
claimed from that source test.

The additive public commit field is read-only `previousRecord`, containing an
independent deeply frozen snapshot captured before logical mutation.
`updateProperty` accepts an optional rendered prior record. Text callbacks pin
that rendered snapshot, and the input pins its active callback and event-time
blur text. No native/storage policy or global editing framework is introduced.

Initial repaired snapshot `13bfecb9`, receipt
`mira-properties-exact-cdfdfb7c-0783-470c-b586-ebd59ce1782b`, passes all six
original cases. Expanded `dc3c1e69`, receipt
`mira-properties-exact-02f57e0e-091e-4e70-aab0-e658db8658c6`, passes six and
fails a seventh: refresh queued immediately before focus makes a lazy callback
capture the newer controller record instead of the value still rendered.
Callbacks are therefore bound alongside rendered property rows and captured on
focus. Final exact `8cb1e5f6`, receipt
`mira-properties-exact-e1ddbe76-a607-46a0-887c-d274880a2abc`, passes all seven.

Two cold browser stories cover focused refresh and refresh queued immediately
before focus. Packed consumers additionally verify the public commit/mutation
signatures and reject reassignment or record mutation at compile time.

Full candidate `07afc2ac` passes seven exact, 24 affected, all 514 package
cases, strict/audit/lint/build and both cold stories. Its new packed read-only
assertions fail under the legacy NodeNext fixture because that resolution does
not follow the package's extensionless declarations; inspecting the published
controller confirms the correct read-only signature. The original NodeNext
smokes stay unchanged. A separate Bundler-resolution Svelte-contract fixture
keeps both negative assertions and adds an explicit rejection of `any` types.

Parent-requested target-replacement cases in frozen `ef273174`, receipt
`mira-properties-exact-a70645bb-8bb2-417b-83d0-4f2410d0c0f7`, pass the prior
seven cases and fail both new cases. A rendered source-path check now refuses
before mutation and reports through the existing action-error callback's added
`edit` action. Both writers and the replacement record remain untouched.

## Complete owner qualification

Frozen `ba3b49a01b5a0e6b81a3ef5e22c8cbb71ba9765f`, receipt
`mira-properties-full-ff3a56e1-3058-4a09-98aa-01bd85290787`, passes:

- Nine exact cases and all 26 affected frontmatter/model/style cases.
- All 516 package cases, including 457 core cases.
- Zero-finding workspace audit, formatting, strict Svelte/TypeScript with zero
  warnings, lint, sixteen validation-runner cases and all package builds.
- Public boundaries, forty release cases and six-package positive/negative
  type, CSS, pack and core executable-test exclusion acceptance. The additional
  Bundler fixture rejects `any` exports and both prohibited prior-record writes;
  the existing NodeNext Svelte/React/Vanilla smokes remain unchanged.
- Three exact cold stories and all 174 cold catalog/axe cases (36/47/35/56),
  catalog checks, static Storybook and all sixty Chromium browser cases.
- All four canonical specification lanes and fresh six-package packing.

The packed-production policy retains its previously accepted low KaTeX advisory,
GHSA-238p-pmpm-9mq7, separately from the zero-finding workspace audit. No new
vulnerability exception or baseline relaxation is introduced.

The selected core archive SHA256 is
`03e15e02bf8d4b61f56c096e31e2538a18fecb980e0e99ce6f1a155155dcf0e9`.
It is byte-identical to the provisional consumer input. Selected companion
archives preserve those earlier exact bytes; comparison with every final packed
member proves identical runtime/type/style content and semantically equal
package manifests, with only dependency-key ordering differing. Exact paths,
checksums and equivalence evidence stay under ignored `.local` qualification.

The final evidence/status-only patch is qualified separately and changes no
product, test or story bytes. Consumer qualification and source adoption remain
separate, including the Plugins expected-frontmatter binding and Desktop native
gates. Publication requires a supported released Mira range that carries this
new commit field and edit-action contract; private same-version archives do not
satisfy that release gate. Visual baseline approval remains separate.
