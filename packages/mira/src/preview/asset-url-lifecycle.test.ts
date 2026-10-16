import { mount, tick, unmount } from "svelte";
import { expect, it, vi } from "vitest";
import type { MiraFileAdapter } from "@lapismd/mira/extensions";
import MarkdownPreview from "./markdown-preview.svelte";

const file = {
  path: "assets/café.png",
  name: "café.png",
  kind: "image" as const,
};
const settle = async () => {
  await tick();
  await Promise.resolve();
  await tick();
};

it("uses an adapter asset URL for an encoded local image and releases it on teardown", async () => {
  const target = document.createElement("div");
  const readAssetUrl = vi.fn(
    async () => "lapis-vault://localhost/token/café.png",
  );
  const releaseAssetUrl = vi.fn();
  const resolveLink = vi.fn((target) =>
    target.path === file.path ? file : null,
  );
  const adapter = {
    resolveLink,
    readAssetUrl,
    releaseAssetUrl,
  } satisfies MiraFileAdapter & { releaseAssetUrl(url: string): void };
  const component = mount(MarkdownPreview, {
    target,
    props: { value: "![Native](assets/caf%C3%A9.png)", fileAdapter: adapter },
  });
  try {
    await vi.waitFor(() =>
      expect(target.querySelector("img")?.getAttribute("src")).toBe(
        "lapis-vault://localhost/token/café.png",
      ),
    );
    expect(readAssetUrl).toHaveBeenCalledWith(file);
    expect(releaseAssetUrl).not.toHaveBeenCalled();
  } finally {
    await unmount(component);
  }
  expect(releaseAssetUrl).toHaveBeenCalledExactlyOnceWith(
    "lapis-vault://localhost/token/café.png",
  );
});

it("releases a pending asset even when the image is removed before its URL arrives", async () => {
  let complete!: (url: string) => void;
  const pending = new Promise<string>((resolve) => {
    complete = resolve;
  });
  const readAssetUrl = vi.fn(() => pending);
  const releaseAssetUrl = vi.fn();
  const adapter = {
    resolveLink: () => file,
    readAssetUrl,
    releaseAssetUrl,
  } satisfies MiraFileAdapter & { releaseAssetUrl(url: string): void };
  const component = mount(MarkdownPreview, {
    target: document.createElement("div"),
    props: { value: "![Native](assets/café.png)", fileAdapter: adapter },
  });
  await vi.waitFor(() => expect(readAssetUrl).toHaveBeenCalledOnce());
  await unmount(component);
  complete("blob:late-native-image");
  await settle();
  expect(releaseAssetUrl).toHaveBeenCalledExactlyOnceWith(
    "blob:late-native-image",
  );
});

it("releases a replaced image URL while keeping its replacement alive until teardown", async () => {
  let refresh!: () => void;
  const target = document.createElement("div");
  const readAssetUrl = vi
    .fn()
    .mockResolvedValueOnce("blob:first")
    .mockResolvedValueOnce("blob:second");
  const releaseAssetUrl = vi.fn();
  const adapter: MiraFileAdapter = {
    resolveLink: () => file,
    readAssetUrl,
    releaseAssetUrl,
    watchFile(_file, callback) {
      refresh = callback;
      return () => {};
    },
  };
  const component = mount(MarkdownPreview, {
    target,
    props: { value: "![Native](assets/café.png)", fileAdapter: adapter },
  });
  try {
    await vi.waitFor(() =>
      expect(target.querySelector("img")?.getAttribute("src")).toBe(
        "blob:first",
      ),
    );
    refresh();
    await vi.waitFor(() =>
      expect(target.querySelector("img")?.getAttribute("src")).toBe(
        "blob:second",
      ),
    );
    expect(releaseAssetUrl).toHaveBeenCalledExactlyOnceWith("blob:first");
  } finally {
    await unmount(component);
  }
  expect(releaseAssetUrl.mock.calls).toEqual([["blob:first"], ["blob:second"]]);
});
