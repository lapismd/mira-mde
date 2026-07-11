import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { MiraImageConfig, MiraImageSyntax } from "@mira-mde/extensions";

export const defaultMiraImageMaxSizeBytes = 5 * 1024 * 1024;

export const defaultMiraImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
];

export type ResolvedMiraImageConfig = {
  imageUpload: (file: File) => Promise<string>;
  imageMaxSizeBytes: number;
  imageMimeTypes: string[];
  imageSyntax: MiraImageSyntax;
  onImageUploadError?: (error: unknown, file: File) => void;
};

export function resolveMiraImageConfig(
  config: MiraImageConfig = {},
): ResolvedMiraImageConfig {
  return {
    imageUpload: config.imageUpload ?? readFileAsDataUrl,
    imageMaxSizeBytes: config.imageMaxSizeBytes ?? defaultMiraImageMaxSizeBytes,
    imageMimeTypes: config.imageMimeTypes ?? defaultMiraImageMimeTypes,
    imageSyntax: config.imageSyntax ?? "reference",
    onImageUploadError: config.onImageUploadError,
  };
}

export function createImageDropPasteExtension(
  config: MiraImageConfig = {},
): Extension {
  const resolved = resolveMiraImageConfig(config);

  return EditorView.domEventHandlers({
    paste(event, view) {
      const files = imageFilesFromItems(event.clipboardData?.items, resolved);
      if (files.length === 0) {
        return false;
      }
      event.preventDefault();
      void insertImageFiles(view, files, resolved);
      return true;
    },
    drop(event, view) {
      const files = imageFilesFromItems(event.dataTransfer?.items, resolved);
      if (files.length === 0) {
        return false;
      }
      event.preventDefault();
      const position = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
      });
      void insertImageFiles(view, files, resolved, position ?? undefined);
      return true;
    },
  });
}

export async function insertImageFiles(
  view: EditorView,
  files: File[],
  config: MiraImageConfig | ResolvedMiraImageConfig = {},
  position?: number,
): Promise<void> {
  const resolved = isResolvedMiraImageConfig(config)
    ? config
    : resolveMiraImageConfig(config);
  const markdown: string[] = [];

  for (const file of files) {
    try {
      validateImageFile(file, resolved);
      const src = await resolved.imageUpload(file);
      markdown.push(
        createImageMarkdown({
          alt: imageAltFromFile(file),
          src,
          syntax: resolved.imageSyntax,
          doc: view.state.doc.toString(),
        }),
      );
    } catch (error) {
      resolved.onImageUploadError?.(error, file);
    }
  }

  if (markdown.length === 0) {
    return;
  }

  const selection = view.state.selection.main;
  const from = position ?? selection.from;
  const to = position ?? selection.to;
  const insert = markdown.join("\n\n");

  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.cursor(from + insert.length),
    scrollIntoView: true,
    userEvent: "input.image",
  });
  view.focus();
}

function isResolvedMiraImageConfig(
  config: MiraImageConfig | ResolvedMiraImageConfig,
): config is ResolvedMiraImageConfig {
  return (
    typeof config.imageUpload === "function" &&
    typeof config.imageMaxSizeBytes === "number" &&
    Array.isArray(config.imageMimeTypes) &&
    (config.imageSyntax === "reference" || config.imageSyntax === "inline")
  );
}

export function openImageFilePicker(
  view: EditorView,
  config: MiraImageConfig = {},
): void {
  if (typeof document === "undefined") {
    return;
  }

  const resolved = resolveMiraImageConfig(config);
  const input = document.createElement("input");
  input.type = "file";
  input.accept = resolved.imageMimeTypes.join(",");
  input.multiple = true;
  input.style.display = "none";
  input.addEventListener(
    "change",
    () => {
      const files = Array.from(input.files ?? []);
      void insertImageFiles(view, files, resolved).finally(() =>
        input.remove(),
      );
    },
    { once: true },
  );
  document.body.append(input);
  input.click();
}

function validateImageFile(file: File, config: ResolvedMiraImageConfig): void {
  if (!config.imageMimeTypes.includes(file.type)) {
    throw new Error(`Unsupported image type: ${file.type || "unknown"}`);
  }
  if (file.size > config.imageMaxSizeBytes) {
    throw new Error(`Image exceeds ${config.imageMaxSizeBytes} bytes`);
  }
}

function imageFilesFromItems(
  items: DataTransferItemList | undefined,
  config: ResolvedMiraImageConfig,
): File[] {
  if (!items) {
    return [];
  }

  return Array.from(items)
    .filter(
      (item) =>
        item.kind === "file" && config.imageMimeTypes.includes(item.type),
    )
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

export function createImageMarkdown({
  alt,
  doc,
  src,
  syntax,
}: {
  alt: string;
  doc: string;
  src: string;
  syntax: MiraImageSyntax;
}): string {
  const escapedAlt = alt.replace(/[[\]\\]/g, "\\$&");
  if (syntax === "inline") {
    return `![${escapedAlt}](${src})`;
  }

  const label = uniqueImageLabel(alt, doc);
  return `![${escapedAlt}][${label}]\n\n[${label}]: ${src}`;
}

function uniqueImageLabel(alt: string, doc: string): string {
  const base = slug(alt) || "image";
  let label = base;
  let index = 2;
  while (new RegExp(`^\\[${escapeRegExp(label)}\\]:`, "im").test(doc)) {
    label = `${base}-${index}`;
    index += 1;
  }
  return label;
}

function imageAltFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || "image";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image could not be read as a data URL"));
      }
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Image could not be read"));
    });
    reader.readAsDataURL(file);
  });
}
