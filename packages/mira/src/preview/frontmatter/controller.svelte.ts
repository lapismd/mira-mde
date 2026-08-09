import { parseFrontmatterYaml } from "./parse";
import {
  addFrontmatterRecordProperty,
  mergeFrontmatterRecordProperties,
  removeFrontmatterRecordProperty,
  renameFrontmatterRecordProperty,
  updateFrontmatterRecord,
} from "./properties";
import {
  createFrontmatterReplacement,
  serializeFrontmatterRecord,
} from "./serialize";
import type {
  FrontmatterPathSegment,
  FrontmatterProperty,
  FrontmatterPropertyKind,
} from "./types";
import {
  createFrontmatterPropertyManager,
  type FrontmatterPropertyManager,
} from "./manager";

export type FrontmatterControllerCommit = {
  record: Record<string, unknown>;
  yaml: string;
  replacement: string;
  from: number | null;
  to: number | null;
  nextMarkdown?: string;
};

export type FrontmatterControllerOptions = {
  yaml?: string;
  record?: Record<string, unknown>;
  propertyManager?: FrontmatterPropertyManager;
  sourcePath?: string;
  getMarkdown?: () => string;
  dataOffset?: number | null;
  dataOffsetEnd?: number | null;
  onChange?: (replacement: string, from: number, to: number) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  onRecordChange?: (
    commit: FrontmatterControllerCommit,
  ) => void | Promise<void>;
};

export class FrontmatterController {
  revision = $state(0);
  parseError = $state<string | null>(null);
  yaml = $state("");
  record = $state.raw<Record<string, unknown>>({});

  propertyManager: FrontmatterPropertyManager;
  sourcePath?: string;

  private getMarkdown?: () => string;
  private dataOffset: number | null = null;
  private dataOffsetEnd: number | null = null;
  private onChange?: FrontmatterControllerOptions["onChange"];
  private onFrontmatterChange?: FrontmatterControllerOptions["onFrontmatterChange"];
  private onRecordChange?: FrontmatterControllerOptions["onRecordChange"];
  private suppressCommit = false;

  constructor(options: FrontmatterControllerOptions = {}) {
    this.propertyManager =
      options.propertyManager ?? createFrontmatterPropertyManager();
    this.sourcePath = options.sourcePath ?? this.propertyManager.sourcePath;
    this.getMarkdown = options.getMarkdown;
    this.dataOffset = options.dataOffset ?? null;
    this.dataOffsetEnd = options.dataOffsetEnd ?? null;
    this.onChange = options.onChange;
    this.onFrontmatterChange = options.onFrontmatterChange;
    this.onRecordChange = options.onRecordChange;

    if (options.record) {
      this.syncRecord(options.record, { commit: false });
    } else if (options.yaml !== undefined) {
      this.syncYaml(options.yaml, { commit: false });
    }
  }

  update(options: FrontmatterControllerOptions): void {
    if (options.propertyManager) {
      this.propertyManager = options.propertyManager;
    }
    if (options.sourcePath !== undefined) {
      this.sourcePath = options.sourcePath;
    }
    if (options.getMarkdown !== undefined) {
      this.getMarkdown = options.getMarkdown;
    }
    if (options.dataOffset !== undefined) {
      this.dataOffset = options.dataOffset;
    }
    if (options.dataOffsetEnd !== undefined) {
      this.dataOffsetEnd = options.dataOffsetEnd;
    }
    if (options.onChange !== undefined) {
      this.onChange = options.onChange;
    }
    if (options.onFrontmatterChange !== undefined) {
      this.onFrontmatterChange = options.onFrontmatterChange;
    }
    if (options.onRecordChange !== undefined) {
      this.onRecordChange = options.onRecordChange;
    }
  }

  getRecord(): Record<string, unknown> {
    return this.record;
  }

  getYaml(): string {
    return this.yaml;
  }

  getParseError(): string | null {
    return this.parseError;
  }

  syncYaml(nextYaml: string, options: { commit?: boolean } = {}): void {
    if (!options.commit && nextYaml === this.yaml && this.revision > 0) {
      return;
    }
    const parsed = parseFrontmatterYaml(nextYaml);
    this.yaml = nextYaml;
    if (parsed.ok) {
      this.record = parsed.value;
      this.parseError = null;
    } else {
      this.record = {};
      this.parseError = parsed.error;
    }
    this.revision += 1;
    if (options.commit) {
      void this.commitCurrent();
    }
  }

  syncRecord(
    nextRecord: Record<string, unknown>,
    options: { commit?: boolean } = {},
  ): void {
    const nextYaml = serializeFrontmatterRecord(nextRecord);
    if (!options.commit && nextYaml === this.yaml && this.revision > 0) {
      return;
    }
    this.record = cloneRecord(nextRecord);
    this.yaml = nextYaml;
    this.parseError = null;
    this.revision += 1;
    if (options.commit) {
      void this.commitCurrent();
    }
  }

  commitYaml(nextYaml: string): void {
    this.syncYaml(nextYaml, { commit: true });
  }

  commitRecord(nextRecord: Record<string, unknown>): void {
    this.syncRecord(nextRecord, { commit: true });
  }

  updateProperty(path: FrontmatterPathSegment[], nextValue: unknown): void {
    if (this.parseError) {
      return;
    }
    this.commitRecord(updateFrontmatterRecord(this.record, path, nextValue));
  }

  addProperty(kind: FrontmatterPropertyKind = "text"): string | null {
    if (this.parseError) {
      return null;
    }
    const next = addFrontmatterRecordProperty(
      this.record,
      kind,
      this.propertyManager.config,
    );
    this.commitRecord(next.value);
    return next.name;
  }

  renameProperty(path: FrontmatterPathSegment[], nextKey: string): void {
    if (this.parseError) {
      return;
    }
    const nextRecord = renameFrontmatterRecordProperty(
      this.record,
      path,
      nextKey,
    );
    if (nextRecord === this.record) {
      return;
    }
    this.commitRecord(nextRecord);
  }

  removeProperty(path: FrontmatterPathSegment[]): void {
    if (this.parseError) {
      return;
    }
    this.commitRecord(removeFrontmatterRecordProperty(this.record, path));
  }

  mergeProperties(
    parentPath: FrontmatterPathSegment[],
    pasted: Record<string, unknown>,
  ): void {
    if (this.parseError) {
      return;
    }
    this.commitRecord(
      mergeFrontmatterRecordProperties(this.record, parentPath, pasted),
    );
  }

  changePropertyKind(
    property: FrontmatterProperty,
    kind: FrontmatterPropertyKind,
  ): void {
    this.propertyManager.setType(property.pathString, kind);
    if (property.path.length === 1 && typeof property.path[0] === "string") {
      this.propertyManager.setType(property.path[0], kind);
    }
    this.updateProperty(
      property.path,
      this.propertyManager.coerceValue(property.value, kind, property),
    );
  }

  private async commitCurrent(): Promise<void> {
    if (this.suppressCommit) {
      return;
    }

    const yaml = this.parseError
      ? this.yaml
      : serializeFrontmatterRecord(this.record);
    if (!this.parseError) {
      this.yaml = yaml;
    }
    const replacement = createFrontmatterReplacement(yaml);
    const from = this.dataOffset;
    const to = this.dataOffsetEnd;
    const markdown = this.getMarkdown?.();
    const nextMarkdown =
      markdown !== undefined && from !== null && to !== null
        ? `${markdown.slice(0, from)}${replacement}${markdown.slice(to)}`
        : undefined;

    const commit: FrontmatterControllerCommit = {
      record: cloneRecord(this.record),
      yaml,
      replacement,
      from,
      to,
      nextMarkdown,
    };

    if (from !== null && to !== null) {
      this.onChange?.(replacement, from, to);
      if (nextMarkdown !== undefined) {
        this.onFrontmatterChange?.(yaml, nextMarkdown);
      }
    }

    await this.onRecordChange?.(commit);
  }
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  // Prefer JSON cloning so host-provided records (Svelte proxies, etc.) remain
  // portable across panel/controller hosts.
  try {
    return JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
  } catch {
    return { ...record };
  }
}
