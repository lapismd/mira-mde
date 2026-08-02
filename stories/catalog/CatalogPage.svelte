<script lang="ts">
  import compatibilityCss from "../../packages/mira/src/preview/styles/tokens.css?raw";
  import { catalogEntries, catalogTokens, cssTokens } from "./catalog.mjs";
  import type { CatalogEntry, CssTokenDefinition } from "./types";
  import { specStoryHref } from "../spec/spec-chapters";

  type Props = {
    entryIds: string[];
    showCompatibilityAliases?: boolean;
  };

  let { entryIds, showCompatibilityAliases = false }: Props = $props();

  const entries = $derived(
    entryIds.map((id) => {
      const entry = catalogEntries.find((candidate) => candidate.id === id);
      if (!entry) throw new Error(`Unknown catalog entry: ${id}`);
      return entry as CatalogEntry;
    }),
  );
  const tokenDefinitions = new Map<string, CssTokenDefinition>(
    cssTokens.map((entry) => [entry.name, entry as CssTokenDefinition]),
  );
  const compatibilityAliases = Array.from(
    new Set(
      Array.from(
        compatibilityCss.matchAll(/(--[\w-]+)\s*:/g),
        (match) => match[1],
      ).filter((name) => !name.startsWith("--mira-")),
    ),
  ).sort();

  function resolvedTokens(entry: CatalogEntry): CssTokenDefinition[] {
    return catalogTokens(entry.id).map((name: string) => {
      const definition = tokenDefinitions.get(name);
      if (!definition) throw new Error(`Missing CSS token definition: ${name}`);
      return definition;
    });
  }
</script>

<div class="mira-catalog-page">
  {#each entries as entry (entry.id)}
    <section class="mira-catalog-entry" id={entry.id}>
      <header>
        <div>
          <h2>{entry.name}</h2>
          <p>{entry.description}</p>
        </div>
        <a href={specStoryHref("index.md", entry.spec)}
          >Governing specification</a
        >
      </header>

      <dl class="mira-catalog-entry__identity">
        <div>
          <dt>Package</dt>
          <dd><code>{entry.packageName}</code></dd>
        </div>
        <div>
          <dt>Import</dt>
          <dd><code>{entry.importPath}</code></dd>
        </div>
        <div>
          <dt>Components</dt>
          <dd>{entry.components.join(", ")}</dd>
        </div>
      </dl>

      {#if entry.tokensFrom}
        <p class="mira-catalog-entry__reference">
          This adapter reuses the token contract from
          <a href={`#${entry.tokensFrom}`}>{entry.tokensFrom}</a>; the table is
          resolved from that surface rather than duplicated in registry data.
        </p>
      {/if}

      <div class="mira-catalog-table-scroll">
        <table>
          <caption>Available stable Mira CSS tokens</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Purpose</th>
              <th scope="col">Default / fallback</th>
              <th scope="col">Inherits</th>
              <th scope="col">Affected element or state</th>
            </tr>
          </thead>
          <tbody>
            {#each resolvedTokens(entry) as token (token.name)}
              <tr>
                <th scope="row"><code>{token.name}</code></th>
                <td>{token.purpose}</td>
                <td><code>{token.defaultValue}</code></td>
                <td>{token.inherits ? "Yes" : "No"}</td>
                <td>{token.affects}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/each}

  {#if showCompatibilityAliases}
    <section class="mira-catalog-entry" id="obsidian-compatibility-aliases">
      <header>
        <div>
          <h2>Obsidian compatibility aliases</h2>
          <p>
            These bridge variables preserve Lapis/Obsidian-compatible styles.
            They are implementation compatibility names, not Mira's preferred
            public styling API; prefer the <code>--mira-*</code> tokens above.
          </p>
        </div>
      </header>
      <ul class="mira-catalog-aliases">
        {#each compatibilityAliases as alias (alias)}
          <li><code>{alias}</code></li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .mira-catalog-page {
    box-sizing: border-box;
    max-width: 90rem;
    margin: 0 auto;
    padding: 2rem;
    color: var(--mira-foreground);
    font-family: var(--mira-font-sans);
  }

  .mira-catalog-entry + .mira-catalog-entry {
    margin-top: 4rem;
  }

  .mira-catalog-entry > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
  }

  .mira-catalog-entry h2,
  .mira-catalog-entry p {
    margin: 0;
  }

  .mira-catalog-entry h2 {
    font-size: 1.5rem;
  }

  .mira-catalog-entry header p {
    max-width: 56rem;
    margin-top: 0.4rem;
    color: var(--mira-muted-foreground);
    line-height: 1.5;
  }

  .mira-catalog-entry a {
    color: var(--mira-link);
  }

  .mira-catalog-entry__identity {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .mira-catalog-entry__identity div {
    min-width: 0;
    padding: 0.75rem;
    border: 1px solid var(--mira-border);
    border-radius: var(--mira-radius);
    background: var(--mira-muted);
  }

  .mira-catalog-entry__identity dt {
    color: var(--mira-muted-foreground);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .mira-catalog-entry__identity dd {
    margin: 0.25rem 0 0;
    overflow-wrap: anywhere;
  }

  .mira-catalog-entry__reference {
    margin-bottom: 1rem;
    color: var(--mira-muted-foreground);
  }

  .mira-catalog-table-scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  caption {
    margin-bottom: 0.5rem;
    font-weight: 650;
    text-align: left;
  }

  th,
  td {
    padding: 0.65rem;
    border: 1px solid var(--mira-border);
    vertical-align: top;
    text-align: left;
  }

  thead {
    background: var(--mira-muted);
  }

  tbody th {
    min-width: 14rem;
    font-weight: 500;
  }

  code {
    color: var(--mira-code-foreground);
    font-family: var(--mira-font-mono);
  }

  .mira-catalog-aliases {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0.5rem 1rem;
    padding: 0;
    list-style: none;
  }

  @media (max-width: 52rem) {
    .mira-catalog-entry > header {
      flex-direction: column;
      gap: 0.75rem;
    }

    .mira-catalog-entry__identity {
      grid-template-columns: 1fr;
    }
  }
</style>
