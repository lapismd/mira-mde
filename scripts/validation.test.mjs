import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { archiveMember, ciToolDirectory } from "./validation/install-tools.mjs";

test("hosted CI installs Jujutsu only into runner-owned temporary paths", () => {
  assert.throws(() => ciToolDirectory({}), /runner-owned/);
  assert.equal(
    ciToolDirectory({ RUNNER_TEMP: "/tmp/runner", GITHUB_PATH: "/tmp/paths" }),
    "/tmp/runner/mira-validation-tools",
  );
});

test("unknown lanes fail before contacting Docker", async () => {
  const { main } = await import("./validation.mjs");
  await assert.rejects(
    main(["run", "not-a-validation-lane"]),
    /Unknown validation lane/,
  );
});

test("upstream tool archives accept plain and dot-prefixed root executables only", () => {
  assert.equal(archiveMember("./jj\n./LICENSE\n", "jj"), "./jj");
  assert.equal(archiveMember("mdbook\n", "mdbook"), "mdbook");
  assert.throws(() => archiveMember("../jj\n", "jj"), /root executable/);
  assert.throws(() => archiveMember("jj\n./jj\n", "jj"), /root executable/);
});
import {
  validationConfig,
  imageKey,
  validateArchives,
} from "./validation/model.mjs";
test("Docker is default and native must be explicit", () => {
  assert.equal(validationConfig({}, {}).runtime, "docker");
  assert.equal(
    validationConfig({}, { MIRA_VALIDATION_RUNTIME: "native" }).runtime,
    "native",
  );
  assert.throws(() => validationConfig({ runtime: "magic" }, {}), /runtime/);
});

test("Turbo preserves explicit runtime selection and separates worker cache identity", async () => {
  const turbo = JSON.parse(
    await readFile(new URL("../turbo.json", import.meta.url)),
  );
  assert.ok(turbo.globalEnv.includes("MIRA_VALIDATION_WORKER"));
  assert.ok(turbo.globalPassThroughEnv.includes("PLAYWRIGHT_BROWSERS_PATH"));
  assert.ok(turbo.globalPassThroughEnv.includes("MIRA_VALIDATION_RUNTIME"));
});

test("public validation lanes route through Docker while preserving native commands", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url)),
  );
  const lanes = JSON.parse(
    await readFile(new URL("./validation/lanes.json", import.meta.url)),
  );
  for (const [name, command] of Object.entries(lanes)) {
    assert.equal(pkg.scripts[name], "node scripts/validation.mjs run " + name);
    assert.ok(command.length > 0);
    assert.ok(!command.startsWith("node scripts/validation.mjs"));
  }
  assert.ok(!Object.hasOwn(lanes, "test:visual:update"));
  assert.ok(!Object.hasOwn(lanes, "storybook"));
});

test("all hosted workflows explicitly select their provisioned native runtime", async () => {
  const { readdir } = await import("node:fs/promises");
  const dir = new URL("../.github/workflows/", import.meta.url);
  for (const name of await readdir(dir)) {
    if (!/\.ya?ml$/.test(name)) continue;
    assert.match(
      await readFile(new URL(name, dir), "utf8"),
      /MIRA_VALIDATION_RUNTIME: native/,
    );
  }
});
test("remote resource limits are bounded positive numbers", () => {
  assert.equal(validationConfig({}, {}).cpus, 8);
  assert.throws(() => validationConfig({ memoryGiB: 0 }, {}), /memoryGiB/);
});
test("image identity changes with recipe, dependency and architecture inputs", () => {
  const a = imageKey({ recipe: "a", lock: "one", arch: "amd64" });
  assert.notEqual(a, imageKey({ recipe: "a", lock: "two", arch: "amd64" }));
  assert.notEqual(a, imageKey({ recipe: "a", lock: "one", arch: "arm64" }));
  assert.equal(a, imageKey({ arch: "amd64", lock: "one", recipe: "a" }));
});
test("archive inputs require identity, version and exact checksum", () => {
  assert.throws(
    () => validateArchives([{ name: "a", path: "a.tgz" }]),
    /archive/,
  );
  assert.throws(
    () =>
      validateArchives([
        { name: "a", version: "1.0.0", path: "a.tgz", sha256: "a".repeat(64) },
        { name: "a", version: "1.0.0", path: "b.tgz", sha256: "a".repeat(64) },
      ]),
    /Duplicate/,
  );
  assert.equal(
    validateArchives([
      {
        name: "@lapismd/a",
        version: "1.0.0",
        path: "a.tgz",
        sha256: "a".repeat(64),
      },
    ]).length,
    1,
  );
});
test("snapshot preserves a dirty JJ commit and its direct parent", async () => {
  const { mkdtemp, writeFile, rm, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const { snapshot } = await import("./validation/source.mjs");
  const directory = await mkdtemp(join(tmpdir(), "jj-validation-"));
  const repo = join(directory, "source"),
    destination = join(directory, "input"),
    restored = join(directory, "restored");
  const jj = (args, cwd = repo) =>
    execFileSync(
      "jj",
      [
        "--no-pager",
        "--config",
        'user.name="Validation"',
        "--config",
        'user.email="validation@localhost"',
        ...args,
      ],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  try {
    jj(["git", "init", repo], directory);
    await writeFile(join(repo, "kept.txt"), "parent");
    await writeFile(join(repo, "removed.txt"), "delete me");
    jj(["commit", "-m", "Parent"]);
    await writeFile(join(repo, "kept.txt"), "dirty");
    await rm(join(repo, "removed.txt"));
    await writeFile(join(repo, "new.txt"), "new");
    const manifest = await snapshot(repo, destination);
    assert.equal(manifest.parents.length, 1);
    jj(["git", "init", restored], directory);
    execFileSync("git", ["index-pack", "--stdin"], {
      cwd: restored,
      input: await readFile(join(destination, "source.pack")),
      stdio: ["pipe", "pipe", "pipe"],
    });
    execFileSync(
      "git",
      ["update-ref", "refs/heads/validation-snapshot", manifest.revision],
      { cwd: restored },
    );
    jj(["git", "import"], restored);
    jj(["edit", manifest.revision], restored);
    assert.equal(
      jj(["log", "-r", "@", "--no-graph", "-T", "commit_id"], restored),
      manifest.revision,
    );
    assert.equal(
      jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"], restored),
      manifest.parents[0],
    );
    assert.equal(await readFile(join(restored, "kept.txt"), "utf8"), "dirty");
    assert.equal(await readFile(join(restored, "new.txt"), "utf8"), "new");
    await assert.rejects(readFile(join(restored, "removed.txt")), /ENOENT/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("SSH context transport quotes arguments and rejects other endpoint types", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [cmd, args] = sshDockerCommand("ssh://steve@example.test:2222", [
    "run",
    "image",
    "a; echo unexpected",
  ]);
  assert.equal(cmd, "ssh");
  assert.ok(args.includes("2222"));
  assert.match(args.at(-1), /'a; echo unexpected'/);
  assert.throws(
    () => sshDockerCommand("unix:///var/run/docker.sock", []),
    /SSH Docker context/,
  );
});

test("native lane dispatch resolves project binaries and preserves literal arguments", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, rm } =
    await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { runNative } = await import("./validation.mjs");
  const directory = await mkdtemp(join(tmpdir(), "jj-validation-dispatch-"));
  try {
    await mkdir(join(directory, "scripts/validation"), { recursive: true });
    await mkdir(join(directory, "node_modules/.bin"), { recursive: true });
    await writeFile(
      join(directory, "scripts/validation/lanes.json"),
      JSON.stringify({ probe: "validation-probe" }),
    );
    await writeFile(
      join(directory, "node_modules/.bin/validation-probe"),
      `#!/usr/bin/env node\nrequire('node:fs').writeFileSync('actual.json',JSON.stringify({args:process.argv.slice(2),runtime:process.env.MIRA_VALIDATION_RUNTIME}));\n`,
      { mode: 0o755 },
    );
    await runNative(
      "probe",
      ["space word", "; echo should-stay-literal"],
      directory,
    );
    assert.deepEqual(
      JSON.parse(await readFile(join(directory, "actual.json"), "utf8")),
      { args: ["space word", "; echo should-stay-literal"], runtime: "native" },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("default browser suites run complete bounded shards without changing explicit targets", async () => {
  const { laneInvocations } = await import("./validation/model.mjs");
  assert.deepEqual(
    laneInvocations("test:storybook", []),
    Array.from({ length: 4 }, (_, i) => [`--shard=${i + 1}/4`]),
  );
  assert.deepEqual(
    laneInvocations("test:storybook", [
      "Example.stories.svelte",
      "--shard=1/2",
    ]),
    [["Example.stories.svelte", "--shard=1/2"]],
  );
  assert.deepEqual(laneInvocations("web:test", []), [[]]);
});
