<script lang="ts">
  import { Mira } from "@lapismd/mira";
  import {
    InlineLink,
    LinkSiteIcon,
    MarkdownPreview,
  } from "@lapismd/mira/preview";
  import {
    createLinkIconRegistry,
    inlineLinksExtension,
    type MiraMode,
  } from "@lapismd/mira/extensions";
  let {
    mode = "preview",
    variant = "default",
    narrow = false,
  }: {
    mode?: MiraMode;
    variant?: "default" | "custom" | "custom-only";
    narrow?: boolean;
  } = $props();
  let overridden = $state(false);
  const company = {
    name: "Company",
    viewBox: "0 0 10 10",
    paths: [{ d: "M0 0L10 0L5 10Z" }],
  };
  const registry = $derived(
    createLinkIconRegistry({
      defaults: variant !== "custom-only",
      ...(variant !== "default" || overridden
        ? {
            icons: { github: company, company },
            hosts: {
              "git.example.com": "github",
              "docs.example.com": "company",
            },
          }
        : {}),
      ...(variant === "custom-only" ? { fallback: null } : {}),
    }),
  );
  const extensions = $derived([inlineLinksExtension({ registry })]);
  const value = `Intro: local icons and original Markdown labels.

[**issue** #42](https://github.com/lapismd/mira-mde/issues/42) and [GitLab](https://gitlab.com/lapismd/mira).

https://code.forgejo.org/forgejo/forgejo

- [Private docs](https://docs.example.com/guide)
- [Private git](https://git.example.com/team/repo)
- [Unknown site](https://unknown.example/long/path)

> [Workspace](https://team.slack.com/archives/general)

| Link | Status |
| --- | --- |
| [Table issue](https://github.com/lapismd/mira-mde/issues/42) | Open |

+----------------------------------------+
| [Grid](https://gitlab.com/team/repo)   |
+----------------------------------------+

[Reference][ref] and [*formatted* \`label\`](https://linear.app/team/issue/ABC-42).

[ref]: https://codeberg.org/forgejo/forgejo
`;
</script>

<div
  class="inline-links-demo"
  data-inline-links-demo
  style:max-width={narrow ? "22rem" : "55rem"}
>
  <button type="button" onclick={() => (overridden = !overridden)}
    >Replace GitHub icon</button
  >
  <section aria-label="Configured links">
    {#if mode === "preview"}<MarkdownPreview
        {value}
        {extensions}
        htmlPolicy="safe"
      />
    {:else}<Mira {value} {mode} {extensions} height="44rem" />{/if}
  </section>
  <section aria-label="Standalone components">
    <p>
      <InlineLink href="https://github.com/lapismd/mira-mde" {registry}
        ><em>Standalone GitHub</em></InlineLink
      >
      <LinkSiteIcon href="https://forgejo.org" {registry} />
    </p>
  </section>
  <section aria-label="Independent default registry">
    <MarkdownPreview
      value="[Independent GitHub](https://github.com/lapismd/mira-mde)"
      extensions={[inlineLinksExtension()]}
    />
  </section>
  <section aria-label="Mira default link styling">
    <MarkdownPreview
      value="[Ordinary Mira link](https://github.com/lapismd/mira-mde)"
    />
  </section>
</div>

<style>
  .inline-links-demo {
    padding: 1rem;
    color: var(--mira-foreground);
    background: var(--mira-background);
    min-width: 0;
  }
  button {
    color: var(--mira-foreground);
    background: var(--mira-muted);
    border: 1px solid var(--mira-border);
    border-radius: 4px;
    padding: 0.4rem 0.7rem;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid var(--mira-focus-ring);
    outline-offset: 2px;
  }
</style>
