import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from "@codemirror/autocomplete";
import { EditorState, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type {
  MiraFileAdapter,
  MiraFileRef,
  MiraInternalLinkFormatTarget,
  MiraMarkdownCompletionConfig,
} from "@mira-mde/extensions";

export type MiraMarkdownCompletionOptions = {
  fileAdapter?: MiraFileAdapter;
  sourcePath?: string;
  config?: boolean | MiraMarkdownCompletionConfig;
};

type ResolvedCompletionOptions = {
  adapter: MiraFileAdapter;
  sourcePath?: string;
  config: Required<
    Pick<
      MiraMarkdownCompletionConfig,
      "displayText" | "embeds" | "files" | "headings" | "includeMissing"
    >
  > &
    MiraMarkdownCompletionConfig;
};

type WikiTarget = {
  path: string;
  heading?: string;
  alias?: string;
};

export function createMarkdownCompletionExtensions(
  options: MiraMarkdownCompletionOptions = {},
): Extension[] {
  const resolved = resolveCompletionOptions(options);
  if (!resolved) {
    return [];
  }

  const sources = createMarkdownCompletionSourcesFromResolved(resolved);
  return sources.map((source) =>
    EditorState.languageData.of(() => [{ autocomplete: source }]),
  );
}

export function createMarkdownCompletionSources(
  options: MiraMarkdownCompletionOptions = {},
): CompletionSource[] {
  const resolved = resolveCompletionOptions(options);
  return resolved ? createMarkdownCompletionSourcesFromResolved(resolved) : [];
}

export function formatMiraInternalLink(
  target: MiraInternalLinkFormatTarget,
): string {
  const normalizedPath = normalizePath(target.targetPath);
  const file = target.file;
  const extension = (
    file?.extension ??
    normalizedPath.split("/").pop()?.split(".").pop() ??
    ""
  ).toLowerCase();
  const withoutMarkdownExtension =
    extension === "md" ? normalizedPath.replace(/\.md$/i, "") : normalizedPath;
  const basename = withoutMarkdownExtension.split("/").pop() ?? "";
  const basenameMatches = target.files.filter((candidate) => {
    const candidatePath = normalizePath(candidate.path).replace(/\.md$/i, "");
    return (candidatePath.split("/").pop() ?? "") === basename;
  });
  const sourceDirectory = dirname(normalizePath(target.sourcePath ?? ""));
  const targetDirectory = dirname(normalizedPath);
  const linkPath =
    normalizedPath === normalizePath(target.sourcePath ?? "")
      ? ""
      : targetDirectory === sourceDirectory || basenameMatches.length === 1
        ? basename
        : withoutMarkdownExtension;
  const heading = target.heading ? `#${target.heading}` : "";
  const alias = target.alias ? `|${target.alias}` : "";
  return `${target.embed ? "!" : ""}[[${linkPath}${heading}${alias}]]`;
}

function createMarkdownCompletionSourcesFromResolved(
  options: ResolvedCompletionOptions,
): CompletionSource[] {
  const sources: CompletionSource[] = [];
  if (options.config.displayText) {
    sources.push(displayTextCompletionSource(options));
  }
  if (options.config.headings) {
    sources.push(headingCompletionSource(options));
  }
  if (options.config.embeds) {
    sources.push(fileCompletionSource(options, true));
  }
  if (options.config.files) {
    sources.push(fileCompletionSource(options, false));
  }
  return sources;
}

function resolveCompletionOptions(
  options: MiraMarkdownCompletionOptions,
): ResolvedCompletionOptions | null {
  const adapter = options.fileAdapter;
  if (
    options.config === false ||
    (typeof options.config === "object" && options.config.enabled === false) ||
    !adapter?.listFiles
  ) {
    return null;
  }

  const config =
    typeof options.config === "object" ? options.config : ({} as const);
  return {
    adapter,
    sourcePath: options.sourcePath,
    config: {
      displayText: config.displayText ?? true,
      embeds: config.embeds ?? true,
      files: config.files ?? true,
      headings: config.headings ?? true,
      includeMissing: config.includeMissing ?? true,
      ...config,
    },
  };
}

function fileCompletionSource(
  options: ResolvedCompletionOptions,
  embed: boolean,
): CompletionSource {
  return async (context): Promise<CompletionResult | null> => {
    const word = context.matchBefore(
      embed ? /!\[\[[^\]|#\r\n]*$/u : /(?<!!)\[\[[^\]|#\r\n]*$/u,
    );
    if (!word) {
      return null;
    }

    const query = word.text.slice(embed ? 3 : 2).trim();
    const files = await options.adapter.listFiles!();
    const filter = embed
      ? options.config.embedFilter
      : options.config.fileFilter;
    const matches = files
      .filter((file) => !filter || filter(file))
      .filter((file) => matchesFileQuery(file, query))
      .sort(compareFiles);
    const completionOptions = matches.map(
      (file): Completion => ({
        label: file.name ?? basename(file.path),
        detail: dirname(file.path),
        type: completionType(file, embed),
        apply(view, _completion, from, to) {
          replaceOpenWikiLink(
            view,
            from,
            to,
            formatLink(options, {
              embed,
              file,
              files,
              sourcePath: options.sourcePath,
              targetPath: file.path,
            }),
          );
        },
      }),
    );

    if (query && options.config.includeMissing) {
      completionOptions.push({
        label: `Link to new note "${query}"`,
        detail: "Missing target",
        type: "text",
        apply(view, _completion, from, to) {
          replaceOpenWikiLink(
            view,
            from,
            to,
            formatLink(options, {
              embed,
              files,
              sourcePath: options.sourcePath,
              targetPath: query,
            }),
          );
        },
      });
    }

    return {
      filter: false,
      from: word.from,
      options: completionOptions,
    };
  };
}

function headingCompletionSource(
  options: ResolvedCompletionOptions,
): CompletionSource {
  return async (context): Promise<CompletionResult | null> => {
    const word = context.matchBefore(/!?\[\[[^\]|\r\n]*#[^\]|\r\n]*$/u);
    if (!word) {
      return null;
    }

    const embed = word.text.startsWith("!");
    const target = parseWikiTarget(word.text.slice(embed ? 3 : 2));
    if (target.heading === undefined) {
      return null;
    }

    const files = await options.adapter.listFiles!();
    const file = await resolveCompletionFile(
      options.adapter,
      target.path,
      options.sourcePath,
      files,
    );
    const headings =
      file && options.adapter.getHeadings
        ? await options.adapter.getHeadings(file)
        : [];
    const query = target.heading.toLocaleLowerCase();
    const suffix = lineSuffix(context, word.to);
    const alias = aliasFromSuffix(suffix);
    const completionOptions = headings
      .filter((heading) => heading.text.toLocaleLowerCase().includes(query))
      .map(
        (heading): Completion => ({
          label: heading.text,
          detail: `H${heading.level}`,
          type: "property",
          apply(view, _completion, from, to) {
            replaceOpenWikiLink(
              view,
              from,
              to,
              formatLink(options, {
                alias,
                embed,
                file: file ?? undefined,
                files,
                heading: heading.text,
                sourcePath: options.sourcePath,
                targetPath: file?.path ?? target.path,
              }),
            );
          },
        }),
      );

    if (completionOptions.length === 0) {
      completionOptions.push({
        label: target.heading.trim() || "Heading",
        detail: "No matching heading",
        type: "text",
      });
    }

    return {
      filter: false,
      from: word.from,
      options: completionOptions,
    };
  };
}

function displayTextCompletionSource(
  options: ResolvedCompletionOptions,
): CompletionSource {
  return async (context): Promise<CompletionResult | null> => {
    const word = context.matchBefore(/!?\[\[[^\]\r\n]*\|[^\]\r\n]*$/u);
    if (!word) {
      return null;
    }

    const embed = word.text.startsWith("!");
    const target = parseWikiTarget(word.text.slice(embed ? 3 : 2));
    if (target.alias === undefined) {
      return null;
    }

    const files = await options.adapter.listFiles!();
    const file = await resolveCompletionFile(
      options.adapter,
      target.path,
      options.sourcePath,
      files,
    );
    const label =
      embed &&
      isImage(file, target.path) &&
      /^\d+\s*(x\s*\d+)?$/i.test(target.alias)
        ? `Image size: ${target.alias.trim()} px`
        : target.alias || "Display text";

    return {
      filter: false,
      from: word.from,
      options: [
        {
          label,
          detail: target.path,
          type: "text",
          apply(view, _completion, from, to) {
            replaceOpenWikiLink(
              view,
              from,
              to,
              formatLink(options, {
                alias: target.alias || undefined,
                embed,
                file: file ?? undefined,
                files,
                heading: target.heading,
                sourcePath: options.sourcePath,
                targetPath: file?.path ?? target.path,
              }),
            );
          },
        },
      ],
    };
  };
}

function formatLink(
  options: ResolvedCompletionOptions,
  target: MiraInternalLinkFormatTarget,
): string {
  return (options.config.formatLink ?? formatMiraInternalLink)(target);
}

function replaceOpenWikiLink(
  view: EditorView,
  from: number,
  to: number,
  insert: string,
): void {
  const line = view.state.doc.lineAt(from);
  const suffix = line.text.slice(to - line.from);
  const marker = suffix.indexOf("]]");
  view.dispatch({
    changes: {
      from,
      insert,
      to: marker === -1 ? to : to + marker + 2,
    },
    selection: { anchor: from + insert.length },
    userEvent: "input.complete",
  });
}

function lineSuffix(context: CompletionContext, position: number): string {
  const line = context.state.doc.lineAt(position);
  return context.state.doc.sliceString(position, line.to);
}

function aliasFromSuffix(suffix: string): string | undefined {
  const match = /^\|([^\]\r\n]*)]]/.exec(suffix);
  return match?.[1] || undefined;
}

function parseWikiTarget(value: string): WikiTarget {
  const [targetAndHeading = "", alias] = value.split("|", 2);
  const hash = targetAndHeading.indexOf("#");
  return {
    path:
      hash === -1
        ? targetAndHeading.trim()
        : targetAndHeading.slice(0, hash).trim(),
    heading: hash === -1 ? undefined : targetAndHeading.slice(hash + 1).trim(),
    alias,
  };
}

async function resolveCompletionFile(
  adapter: MiraFileAdapter,
  path: string,
  sourcePath: string | undefined,
  files: readonly MiraFileRef[],
): Promise<MiraFileRef | null> {
  if (!path && sourcePath) {
    return (
      files.find(
        (file) => normalizePath(file.path) === normalizePath(sourcePath),
      ) ?? {
        kind: "markdown",
        path: sourcePath,
      }
    );
  }
  const resolved = await adapter.resolveLink({ href: path, sourcePath });
  const normalizedTarget = normalizePath(path).replace(/\.md$/i, "");
  const directMatch = files.find(
    (file) =>
      normalizePath(file.path).replace(/\.md$/i, "") === normalizedTarget,
  );
  const basenameMatches = files.filter(
    (file) =>
      basename(normalizePath(file.path).replace(/\.md$/i, "")) ===
      basename(normalizedTarget),
  );
  return (
    resolved ??
    directMatch ??
    (basenameMatches.length === 1 ? basenameMatches[0] : null) ??
    null
  );
}

function matchesFileQuery(file: MiraFileRef, query: string): boolean {
  const normalizedQuery = query.toLocaleLowerCase();
  return (
    !normalizedQuery ||
    file.path.toLocaleLowerCase().includes(normalizedQuery) ||
    (file.name ?? "").toLocaleLowerCase().includes(normalizedQuery)
  );
}

function compareFiles(left: MiraFileRef, right: MiraFileRef): number {
  return (left.name ?? left.path).localeCompare(right.name ?? right.path);
}

function completionType(file: MiraFileRef, embed: boolean): string {
  if (!embed) {
    return "text";
  }
  return isImage(file, file.path) ? "image" : "text";
}

function isImage(file: MiraFileRef | null, path: string): boolean {
  return (
    file?.kind === "image" ||
    /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(file?.path ?? path)
  );
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function dirname(path: string): string {
  const normalized = normalizePath(path);
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? "" : normalized.slice(0, slash);
}

function basename(path: string): string {
  const normalized = normalizePath(path);
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}
