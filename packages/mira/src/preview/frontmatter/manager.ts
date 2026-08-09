import { coerceFrontmatterValue } from "./values";
import { defaultFrontmatterValue } from "./defaults";
import { frontmatterProperties, frontmatterPropertyKind } from "./properties";
import type {
  FrontmatterConfig,
  FrontmatterProperty,
  FrontmatterPropertyKind,
  FrontmatterTypeDefinition,
} from "./types";
import { frontmatterTypeOptions, resolveFrontmatterWidget } from "./widgets";

export type FrontmatterRenameFailure = {
  path: string;
  message: string;
};

export type FrontmatterRenameResult = {
  updatedFiles: string[];
  failedFiles: FrontmatterRenameFailure[];
};

export type FrontmatterPropertyManager = {
  readonly config: FrontmatterConfig;
  sourcePath?: string;
  resolveType: (
    pathString: string,
    key: string,
    value: unknown,
  ) => FrontmatterPropertyKind;
  properties: (record: Record<string, unknown>) => FrontmatterProperty[];
  typeOptions: () => FrontmatterTypeDefinition[];
  resolveWidget: (
    kind: FrontmatterPropertyKind,
  ) => FrontmatterTypeDefinition | null;
  coerceValue: (
    value: unknown,
    kind: FrontmatterPropertyKind,
    property?: FrontmatterProperty,
  ) => unknown;
  defaultValue: (kind: FrontmatterPropertyKind) => unknown;
  setType: (key: string, type: FrontmatterPropertyKind) => void;
  rename?: (
    prevId: string,
    newId: string,
  ) => Promise<FrontmatterRenameResult> | FrontmatterRenameResult;
};

export type CreateFrontmatterPropertyManagerOptions = FrontmatterConfig & {
  sourcePath?: string;
  setType?: (key: string, type: FrontmatterPropertyKind) => void;
  rename?: FrontmatterPropertyManager["rename"];
};

export function createFrontmatterPropertyManager(
  options: CreateFrontmatterPropertyManagerOptions = {},
): FrontmatterPropertyManager {
  const {
    sourcePath,
    setType: setTypeOverride,
    rename,
    types: seedTypes,
    ...configRest
  } = options;

  const types: Record<
    string,
    FrontmatterPropertyKind | FrontmatterTypeDefinition
  > = {
    ...(seedTypes ?? {}),
  };

  const config: FrontmatterConfig = {
    ...configRest,
    types,
  };

  return {
    get config() {
      return config;
    },
    sourcePath,
    resolveType(pathString, key, value) {
      return frontmatterPropertyKind(value, key, config, pathString);
    },
    properties(record) {
      return frontmatterProperties(record, config);
    },
    typeOptions() {
      return frontmatterTypeOptions(config);
    },
    resolveWidget(kind) {
      return resolveFrontmatterWidget(config, kind);
    },
    coerceValue(value, kind, property) {
      return coerceFrontmatterValue(value, kind, config, property);
    },
    defaultValue(kind) {
      return defaultFrontmatterValue(kind, config);
    },
    setType(key, type) {
      if (setTypeOverride) {
        setTypeOverride(key, type);
        return;
      }
      types[key] = type;
    },
    rename,
  };
}
