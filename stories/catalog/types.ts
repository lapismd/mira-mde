export type CssTokenDefinition = {
  name: `--mira-${string}`;
  purpose: string;
  defaultValue: string;
  inherits: boolean;
  affects: string;
};

export type CatalogEntry = {
  id: string;
  name: string;
  packageName: string;
  importPath: string;
  description: string;
  spec: string;
  components: string[];
  tokens: string[];
  tokensFrom?: string;
  publicSurface: boolean;
};

export type MiraCatalogRegistry = {
  tokens: CssTokenDefinition[];
  entries: CatalogEntry[];
};

export type MiraCatalogParameters = {
  catalogId: string;
  spec: string;
  tokens: string[];
};
