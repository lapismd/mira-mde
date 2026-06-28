export type BuiltinFrontmatterPropertyKind =
  | "unknown"
  | "tags"
  | "aliases"
  | "multitext"
  | "array"
  | "object"
  | "text"
  | "number"
  | "checkbox"
  | "date"
  | "datetime"
  | "null";

export type FrontmatterPropertyKind =
  | BuiltinFrontmatterPropertyKind
  | (string & {});

export type FrontmatterPathSegment = string | number;

export type FrontmatterWidgetContext = {
  property: FrontmatterProperty;
  sourcePath?: string;
  setValue: (value: unknown) => void;
};

export type FrontmatterWidgetRenderer = (
  element: HTMLElement,
  context: FrontmatterWidgetContext,
) => void | (() => void);

export type FrontmatterTypeDefinition = {
  type: FrontmatterPropertyKind;
  label?: string;
  icon?: string;
  fallbackKind?: BuiltinFrontmatterPropertyKind;
  defaultValue?: unknown | (() => unknown);
  validate?: (value: unknown, property: FrontmatterProperty) => boolean;
  normalize?: (value: unknown, property?: FrontmatterProperty) => unknown;
  render?: FrontmatterWidgetRenderer;
};

export type FrontmatterConfig = {
  types?: Record<string, FrontmatterPropertyKind | FrontmatterTypeDefinition>;
  properties?: Record<
    string,
    FrontmatterPropertyKind | FrontmatterTypeDefinition
  >;
  widgets?: FrontmatterTypeDefinition[];
};

export type FrontmatterParseResult =
  | {
      ok: true;
      value: Record<string, unknown>;
      yaml: string;
    }
  | {
      ok: false;
      error: string;
      yaml: string;
    };

export type FrontmatterProperty = {
  children: FrontmatterProperty[];
  depth: number;
  icon: string;
  id: string;
  key: string;
  parent: string;
  path: FrontmatterPathSegment[];
  pathString: string;
  type: FrontmatterPropertyKind;
  value: unknown;
  kind: FrontmatterPropertyKind;
  valid: boolean;
};

export const frontmatterPropertyKindOptions = [
  "text",
  "number",
  "checkbox",
  "date",
  "datetime",
  "tags",
  "aliases",
  "multitext",
  "array",
  "object",
  "null",
] as const satisfies readonly BuiltinFrontmatterPropertyKind[];

export const frontmatterPropertyKindLabels: Record<
  BuiltinFrontmatterPropertyKind,
  string
> = {
  aliases: "Aliases",
  array: "List",
  checkbox: "Checkbox",
  date: "Date",
  datetime: "Date and time",
  multitext: "Text list",
  null: "Empty",
  number: "Number",
  object: "Object",
  tags: "Tags",
  text: "Text",
  unknown: "Unknown",
};
