import { expect, it } from "vitest";
import { mount, tick, unmount } from "svelte";
import TableReader from "./table-reader.svelte";
import Fixture from "./table-reader.test.svelte";

const markdown =
  "| Name | Role |\n| --- | --- |\n| Alex | Designer |\n| Jordan | Developer |";
it("splits immutable source rows around host annotations without authoring controls", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const component = mount(Fixture, { target, props: { markdown } });
  await tick();
  expect(target.querySelectorAll("table")).toHaveLength(2);
  expect(
    [...target.querySelectorAll("[data-cell]")].map((cell) =>
      cell.getAttribute("data-cell"),
    ),
  ).toEqual(["0:0", "0:1", "1:0", "1:1", "2:0", "2:1"]);
  expect(target.querySelector("table")!.nextElementSibling).toBeNull();
  const parts = target.querySelector(".mira-table-reader")!.children;
  expect(parts[1]!.textContent).toBe("Comment after row 1");
  expect(parts[2]!.textContent).toContain("Jordan");
  expect(
    target.querySelector("button, [contenteditable], .cm-gutters"),
  ).toBeNull();
  await unmount(component);
  target.remove();
});
it("uses the safe cell preview and can omit a captured context header", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const component = mount(TableReader, {
    target,
    props: { markdown, showHeader: false },
  });
  await tick();
  await tick();
  expect(target.querySelector("th")).toBeNull();
  expect(target.textContent).toContain("Designer");
  await unmount(component);
  target.remove();
});
