import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, tick, unmount } from "svelte";
import {
  createLinkIconRegistry,
  defaultMiraLinkIcons,
  inlineLinksExtension,
  type MiraLinkIconDefinition,
} from ".";
import { InlineLink, LinkSiteIcon, MarkdownPreview } from "../preview";
import Mira from "../mira.svelte";

const triangle: MiraLinkIconDefinition = {
  viewBox: "0 0 10 10",
  paths: [{ d: "M0 0L10 0L5 10Z" }],
};
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  vi.restoreAllMocks();
});

async function preview(value: string, registry = createLinkIconRegistry()) {
  const target = document.createElement("div");
  document.body.append(target);
  const props = { value, extensions: [inlineLinksExtension({ registry })] };
  const instance = mount(MarkdownPreview, {
    target,
    props: { ...props, htmlPolicy: "safe" },
  });
  cleanups.push(async () => {
    await unmount(instance);
    target.remove();
  });
  await tick();
  await tick();
  return target;
}

describe("link icon registry", () => {
  it("bundles and deeply freezes sixteen locally owned icons", () => {
    expect(Object.keys(defaultMiraLinkIcons)).toHaveLength(16);
    expect(Object.isFrozen(defaultMiraLinkIcons.github.paths[0])).toBe(true);
    expect(Object.isFrozen(defaultMiraLinkIcons)).toBe(true);
  });
  it.each([
    ["https://github.com/org/repo", "github"],
    ["http://WWW.GITLAB.COM/a", "gitlab"],
    ["https://code.forgejo.org/a", "forgejo"],
    ["https://docs.google.com/a", "google"],
    ["https://team.slack.com/a", "slack"],
    ["https://github.com.evil.test/a", "unknown"],
    ["https://notslack.com/a", "unknown"],
    ["https://www.github.com./a", "github"],
  ])("resolves %s as %s", (href, id) => {
    expect(createLinkIconRegistry().resolve(href)?.id).toBe(id);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,hi",
    "mailto:a@example.com",
    "//github.com/a",
    "notes.md",
    "https://user:password@github.com/a",
  ])("leaves %s undecorated", (href) => {
    expect(createLinkIconRegistry().resolve(href)).toBeUndefined();
  });
  it("overrides all aliases and copies consumer SVG data", () => {
    const custom = { paths: [{ d: "first" }] };
    const registry = createLinkIconRegistry({ icons: { github: custom } });
    custom.paths[0]!.d = "later";
    expect(registry.resolve("https://www.github.com")?.icon?.paths[0]?.d).toBe(
      "first",
    );
    expect(createLinkIconRegistry().resolve("https://github.com")?.icon).toBe(
      defaultMiraLinkIcons.github,
    );
  });
  it("uses exact hosts before the most specific explicit subdomain rule", () => {
    const registry = createLinkIconRegistry({
      icons: { docs: triangle },
      hosts: {
        "git.example.com": "gitlab",
        "exact.tools.example.com": "github",
      },
      subdomains: { "example.com": "forgejo", "tools.example.com": "docs" },
    });
    expect(registry.resolve("https://git.example.com")?.id).toBe("gitlab");
    expect(registry.resolve("https://exact.tools.example.com")?.id).toBe(
      "github",
    );
    expect(registry.resolve("https://other.tools.example.com")?.id).toBe(
      "docs",
    );
    expect(registry.resolve("https://example.com")?.id).toBe("unknown");
  });
  it("supports disabled defaults, individual icons, mappings and fallback", () => {
    const custom = createLinkIconRegistry({
      defaults: false,
      icons: { docs: triangle },
      hosts: { "docs.example.com": "docs" },
      fallback: null,
    });
    expect(custom.resolve("https://docs.example.com")?.icon?.paths[0]?.d).toBe(
      triangle.paths[0]!.d,
    );
    expect(custom.resolve("https://github.com")?.icon).toBeNull();
    const disabled = createLinkIconRegistry({
      icons: { github: null },
      hosts: { "gitlab.com": null },
    });
    expect(disabled.resolve("https://github.com")?.icon).toBeNull();
    expect(disabled.resolve("https://gitlab.com")?.icon).toBeNull();
    expect(
      createLinkIconRegistry({ fallback: triangle }).resolve(
        "https://other.test",
      )?.icon?.paths[0]?.d,
    ).toBe(triangle.paths[0]!.d);
  });
  it("rejects unknown IDs and non-host rules early", () => {
    expect(() =>
      createLinkIconRegistry({
        icons: {
          remote: {
            paths: [{ d: "M0 0", fill: "url(https://other.test)" as "none" }],
          },
        },
      }),
    ).toThrow("local currentColor");
    expect(() =>
      createLinkIconRegistry({ hosts: { "host.test": "typo" } }),
    ).toThrow("Unknown link icon");
    expect(() =>
      createLinkIconRegistry({ hosts: { "github.com/path": "github" } }),
    ).toThrow("hostname");
  });
});

describe("inline link rendering", () => {
  it("describes labelled links with an accessible destination tooltip on focus", async () => {
    const target = await preview("[Issue](https://github.com/o/r/issues/42)");
    const anchor = target.querySelector<HTMLAnchorElement>("a")!;
    anchor.focus();
    await vi.waitFor(() => {
      const tooltip = document.getElementById(
        anchor.getAttribute("aria-describedby") ?? "",
      );
      expect(tooltip?.getAttribute("role")).toBe("tooltip");
      expect(tooltip?.textContent).toContain(
        "https://github.com/o/r/issues/42",
      );
    });
    anchor.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await vi.waitFor(() =>
      expect(anchor.hasAttribute("aria-describedby")).toBe(false),
    );
  });
  it("supports multiline reference links in live preview and source selection", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Mira, {
      target,
      props: {
        value:
          "Intro\n\n[**multi**\nline][ref]\n\n[ref]: https://github.com/a\n",
        mode: "live-preview",
        extensions: [inlineLinksExtension()],
      },
    });
    cleanups.push(async () => {
      await unmount(component);
      target.remove();
    });
    await vi.waitFor(() =>
      expect(
        target.querySelector("a.mira-inline-link strong")?.textContent,
      ).toBe("multi"),
    );
    expect(
      target
        .querySelector("a.mira-inline-link svg")
        ?.getAttribute("data-link-site"),
    ).toBe("github");
  });
  it("retains other extensions in nested live-preview links", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const nativeEntity = {
      name: "consumer-entity",
      rehypePlugins: [
        () => (tree: { children: unknown[] }) => {
          function walk(node: { tagName?: string; children?: unknown[] }) {
            if (node.tagName === "a") node.tagName = "ownedentity";
            node.children?.forEach((child) =>
              walk(child as Parameters<typeof walk>[0]),
            );
          }
          walk(tree);
        },
      ],
      components: { ownedentity: "strong" },
    };
    const component = mount(Mira, {
      target,
      props: {
        value: "Intro\n\n[Entity](https://github.com/a)",
        mode: "live-preview",
        extensions: [nativeEntity, inlineLinksExtension()],
      },
    });
    cleanups.push(async () => {
      await unmount(component);
      target.remove();
    });
    await vi.waitFor(() =>
      expect(
        target.querySelector(".mira-inline-markdown-widget strong")
          ?.textContent,
      ).toBe("Entity"),
    );
    expect(target.querySelector("a.mira-inline-link")).toBeNull();
  });
  it("cancels a pending lazy widget mount when the editor is destroyed", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Mira, {
      target,
      props: {
        value: "Intro\n\nhttps://github.com/a",
        mode: "live-preview",
        extensions: [inlineLinksExtension()],
      },
    });
    await tick();
    await unmount(component);
    await tick();
    await tick();
    expect(target.querySelector(".mira-inline-markdown-widget")).toBeNull();
    target.remove();
  });
  it("keeps formatted labels, reference links, bare URLs and nested links inline", async () => {
    const target = await preview(
      "# [**Heading**](https://github.com/o/r)\n\nProse [*issue* `#42`](https://gitlab.com/a) and [reference][ref].\n\n- https://codeberg.org/a\n\n> [Quote](https://forgejo.org)\n\n| Link |\n| --- |\n| [Cell](https://linear.app/a) |\n\n[ref]: https://github.com/o/r",
    );
    expect(target.querySelectorAll("a.mira-inline-link")).toHaveLength(6);
    expect(target.querySelector("h1 a strong")?.textContent).toBe("Heading");
    expect(target.querySelector("a em")?.textContent).toBe("issue");
    expect(target.querySelector("a code")?.textContent).toBe("#42");
    expect(
      target.querySelector("td a svg")?.getAttribute("data-link-site"),
    ).toBe("linear");
    for (const link of target.querySelectorAll("a.mira-inline-link")) {
      expect(link.querySelector("svg")?.getAttribute("viewBox")).toBe(
        "0 0 24 24",
      );
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    }
  });
  it("leaves local, unsafe, code and image links alone without external requests", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Unexpected network"));
    const target = await preview(
      "[local](notes.md) [unsafe](javascript:alert%281%29) `https://github.com/a` [![image](local.png)](https://github.com/a)\n\nhttps://unknown.example/a",
    );
    expect(target.querySelectorAll("a.mira-inline-link")).toHaveLength(1);
    expect(target.querySelector("code svg")).toBeNull();
    expect(target.querySelector("a:has(img) svg")).toBeNull();
    expect(target.querySelector('[data-link-site="unknown"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("exports standalone icon/link components with safe destinations", async () => {
    const target = document.createElement("div");
    const icon = mount(LinkSiteIcon, {
      target,
      props: { href: "https://forgejo.org" },
    });
    const link = mount(InlineLink, {
      target,
      props: { href: "javascript:alert(1)", label: "Bad" },
    });
    expect(InlineLink).toBeTruthy();
    await tick();
    await tick();
    expect(target.querySelector("svg")?.dataset.linkSite).toBe("forgejo");
    expect(target.querySelector("a")?.hasAttribute("href")).toBe(false);
    await unmount(link);
    await unmount(icon);
  });
  it("does not change rendering without the extension", async () => {
    const target = document.createElement("div");
    const component = mount(MarkdownPreview, {
      target,
      props: { value: "https://github.com/a" },
    });
    await tick();
    await tick();
    expect(target.querySelector(".mira-inline-link")).toBeNull();
    await unmount(component);
  });
  it("renders live-preview links and reveals the exact authored source on primary click", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const value =
      "Intro\n\n[**issue**](https://github.com/a) and https://gitlab.com/a\n";
    const component = mount(Mira, {
      target,
      props: {
        value,
        mode: "live-preview",
        extensions: [inlineLinksExtension()],
      },
    });
    cleanups.push(async () => {
      await unmount(component);
      target.remove();
    });
    await vi.waitFor(() =>
      expect(target.querySelectorAll("a.mira-inline-link")).toHaveLength(2),
    );
    const link = target.querySelector<HTMLAnchorElement>("a.mira-inline-link")!;
    link.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await tick();
    expect(target.querySelector(".cm-content")?.textContent).toContain(
      "[**issue**](https://github.com/a)",
    );
  });
});
