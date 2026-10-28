import { expect, it } from "vitest";
import { FrontmatterController, type FrontmatterControllerCommit } from ".";

it("captures an independent deeply immutable record before each logical mutation", () => {
  const commits: FrontmatterControllerCommit[] = [];
  const initial = { status: "ready", nested: { labels: ["original"] } };
  const controller = new FrontmatterController({
    record: initial,
    onRecordChange: (commit) => {
      commits.push(commit);
    },
  });
  controller.updateProperty(["status"], "local");
  const first = commits[0]!;
  expect(first.previousRecord).toEqual(initial);
  expect(first.previousRecord).not.toBe(initial);
  expect(Object.isFrozen(first.previousRecord)).toBe(true);
  const nested = first.previousRecord.nested as { labels: string[] };
  expect(Object.isFrozen(nested)).toBe(true);
  expect(Object.isFrozen(nested.labels)).toBe(true);
  expect(() => nested.labels.push("changed")).toThrow();
  initial.nested.labels.push("outside");
  controller.commitRecord({ status: "second" });
  expect(commits[1]!.previousRecord).toEqual({
    status: "local",
    nested: { labels: ["original"] },
  });
  expect(first.previousRecord).toEqual({
    status: "ready",
    nested: { labels: ["original"] },
  });
});

it("uses a captured rendered record after a newer external controller synchronization", () => {
  const commits: FrontmatterControllerCommit[] = [];
  const controller = new FrontmatterController({
    record: { status: "ready" },
    onRecordChange: (commit) => {
      commits.push(commit);
    },
  });
  const rendered = controller.getRecord();
  controller.syncRecord({ status: "external", owner: "outside" });
  controller.updateProperty(["status"], "local", rendered);
  expect(commits[0]!.previousRecord).toEqual({ status: "ready" });
  expect(commits[0]!.record).toEqual({ status: "local" });
});

it("captures previous records for YAML, rename, removal, addition and merge commits", () => {
  const commits: FrontmatterControllerCommit[] = [];
  const controller = new FrontmatterController({
    record: { status: "ready", nested: { child: "original" } },
    onRecordChange: (commit) => {
      commits.push(commit);
    },
  });
  const mutations = [
    () =>
      controller.commitYaml("status: changed\nnested:\n  child: original\n"),
    () => controller.renameProperty(["status"], "state"),
    () => controller.removeProperty(["state"]),
    () => controller.addProperty("text"),
    () => controller.mergeProperties(["nested"], { another: "value" }),
  ];
  for (const mutate of mutations) {
    const before = JSON.parse(JSON.stringify(controller.getRecord()));
    const count = commits.length;
    mutate();
    expect(commits).toHaveLength(count + 1);
    expect(commits.at(-1)!.previousRecord).toEqual(before);
  }
});
