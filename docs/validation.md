# Docker-first validation

Checks, package builds, unit tests, Storybook interactions/accessibility and
browser acceptance use Docker by default. A missing fingerprinted image builds
automatically; the runner never falls back to the host when Docker is unavailable.
No sibling checkout or host bind mount is required.

```sh
pnpm validation:doctor
pnpm validation:images                 # prepare/reuse the toolchain image
pnpm validation:images -- --rebuild    # deliberately rebuild its layers
pnpm check:all
pnpm test:storybook -- path/to/Example.stories.svelte
MIRA_VALIDATION_RUNTIME=native pnpm check
```

The original commands live in `scripts/validation/lanes.json`. Nested commands
run natively inside the same container, so an aggregate creates one isolated
run. CLI arguments remain literal. Root lane scripts select the runtime;
direct package-filtered commands and direct executable invocations retain their
native behavior. Hosted workflows explicitly select native execution.

Development servers, watch commands, release mutation/publication, interactive
spec search/serve and the existing explicitly requested Visual Delta capture,
comparison and baseline-update commands retain their current execution model.
Docker validation never updates screenshots or baselines.

## Configuration and reusable resources

Create ignored `.local/validation/config.json` to select a local or remote
Docker daemon and resource limits:

```json
{
  "context": "omarchy",
  "transport": "ssh-cli",
  "cpus": 4,
  "memoryGiB": 12,
  "shmGiB": 2
}
```

Omit `context` to use the active Docker context. Omit `transport` for the normal
Docker CLI; `ssh-cli` resolves an SSH context and streams source, image context
and reports over SSH without relying on remote access to your filesystem.
`MIRA_VALIDATION_CONTEXT` and `MIRA_VALIDATION_RUNTIME` override local
settings. Defaults are Docker, 8 CPUs, 24 GiB RAM and 2 GiB shared memory.

The image pins Node 22.22.0, pnpm 10.32.1, Playwright 1.62.1, Jujutsu 0.45.1
and mdBook 0.5.4. Base images have immutable digests; downloaded tools are
checksum-verified. Recipe, installer, package/lock/workspace inputs and daemon
architecture identify reusable images. Per-workspace, dependency-keyed volumes
retain the pnpm store and Turbo outputs; installations remain frozen and
registry-based. Only explicitly configured, identity/checksum-verified package
archives may supply temporary validation dependencies; tracked manifests and
lockfiles remain registry-portable.

Runs transfer the exact tracked Jujutsu snapshot, including dirty tracked
changes, deletions and parent history. Ignored local files, environment files
and host dependencies are excluded. Each run has its own filesystem, network
and services. A per-workspace lease prevents concurrent runs from racing shared
caches. Full direct Storybook runs use four sequential cold shards; explicit
targets or shards remain exact. Aggregate commands preserve their original
test coverage and failure behavior.

## Reports and recovery

For temporary source-package acceptance, set `archives` in local configuration
to `.local/validation/packages.json`. That file is an array of records:

```json
[
  {
    "name": "@lapismd/mira",
    "version": "0.1.0",
    "path": "packages/lapismd-mira-0.1.0.tgz",
    "sha256": "<64-character SHA-256>"
  }
]
```

Archive paths resolve relative to that manifest. The worker checks the hash,
package name and version, installs an isolated projection, then restores the
tracked manifests and lockfile before validation. Reports record the archive
identity; this qualifies source integration separately from registry acceptance.

Each run prints its identity and collects reports into
`.local/validation/runs/<run>/`. `result.json` records the source revision,
parents, object-pack checksum, image identity, tools, arguments, resource limits,
per-invocation results and final status. Available static builds, mdBook output,
browser traces, JUnit results and container logs are copied alongside it.
Build products remain isolated from host development output.

```sh
pnpm validation -- collect <run>       # retry collection after a connection loss
pnpm validation -- stop <run>          # stop only a runner-owned container
pnpm validation -- clean               # inspect stopped runs and caches
pnpm validation -- clean --apply       # collect/remove stopped owned runs
pnpm validation -- clean --apply --caches
```

Successful containers are removed after collection. Failed containers retain
their files for inspection. Cleanup checks repository ownership labels and
never prunes unrelated containers, volumes or services. Cache removal is an
explicit operation; Docker rejects removal of volumes still used by a run.
