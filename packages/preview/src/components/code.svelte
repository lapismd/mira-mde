<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    children?: Snippet;
    class?: string;
    code?: string;
    ref?: HTMLElement | null;
    [key: string]: unknown;
  };

  let {
    children,
    ref = $bindable(null),
    class: className = "",
    code: content = "",
    ...restProps
  }: Props = $props();

  const block = $derived(className.includes("hljs") || content.includes("\n"));
  const textCodeBlock = $derived(
    /(?:^|\s)language-text(?:\s|$)/u.test(className),
  );
  const language = $derived.by(() => {
    const lang = className.split("language-", 2)[1]?.split(/\s+/u)[0] ?? "";
    return languageMap[lang.toLowerCase().trim()] || lang;
  });
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  function classNames(...values: Array<string | false | undefined>): string {
    return values.filter(Boolean).join(" ");
  }

  function fitTextCodeBlockToLivePreviewViewport(
    el: HTMLElement,
    enabled: boolean,
  ) {
    let active = enabled;
    let resizeObserver: ResizeObserver | null = null;

    const update = () => {
      if (!active) {
        el.style.maxWidth = "";
        return;
      }

      const editor = el.closest(".cm-editor.markdown-live-preview-view");
      const scroller = editor?.querySelector(":scope > .cm-scroller");
      if (!(scroller instanceof HTMLElement)) {
        el.style.maxWidth = "";
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const maxWidth = Math.max(0, scrollerRect.right - elRect.left);
      el.style.maxWidth = `${maxWidth}px`;
    };

    queueMicrotask(update);
    resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const editor = el.closest(".cm-editor.markdown-live-preview-view");
    const scroller = editor?.querySelector(":scope > .cm-scroller");
    if (scroller instanceof HTMLElement) {
      resizeObserver.observe(scroller);
    }
    window.addEventListener("resize", update);

    return {
      update(value: boolean) {
        active = value;
        update();
      },
      destroy() {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", update);
      },
    };
  }

  async function copyCode(): Promise<void> {
    await navigator.clipboard.writeText(content);
    copied = true;
    if (copyTimer) {
      clearTimeout(copyTimer);
    }
    copyTimer = setTimeout(() => {
      copied = false;
    }, 1200);
  }

  const languageMap: Record<string, string> = {
    js: "JavaScript",
    javascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    jsx: "JavaScript (JSX)",
    tsx: "TypeScript (TSX)",
    html: "HTML",
    xml: "XML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    less: "Less",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    py: "Python",
    python: "Python",
    rb: "Ruby",
    ruby: "Ruby",
    php: "PHP",
    java: "Java",
    c: "C",
    cpp: "C++",
    cxx: "C++",
    h: "C/C++ Header",
    cs: "C#",
    csharp: "C#",
    go: "Go",
    rust: "Rust",
    rs: "Rust",
    swift: "Swift",
    kt: "Kotlin",
    kotlin: "Kotlin",
    scala: "Scala",
    sh: "Shell",
    bash: "Bash",
    zsh: "Zsh",
    powershell: "PowerShell",
    ps1: "PowerShell",
    dockerfile: "Dockerfile",
    makefile: "Makefile",
    gradle: "Gradle",
    cmake: "CMake",
    sql: "SQL",
    mysql: "MySQL",
    pgsql: "PostgreSQL",
    postgres: "PostgreSQL",
    plsql: "PL/SQL",
    md: "Markdown",
    markdown: "Markdown",
    txt: "Plain Text",
    text: "Plain Text",
    ini: "INI",
    cfg: "Config",
    conf: "Config",
    log: "Log File",
  };
</script>

{#if block}
  <div
    bind:this={ref}
    use:fitTextCodeBlockToLivePreviewViewport={textCodeBlock}
    class={classNames(
      "group relative flex rounded-sm px-4 py-4 font-mono whitespace-pre",
      textCodeBlock
        ? "markdown-text-code-block max-w-full items-start overflow-x-auto overflow-y-hidden"
        : "items-center",
    )}
  >
    <code
      class={classNames(
        "text-sm",
        textCodeBlock && "min-w-max !whitespace-pre",
        className,
      )}
      {...restProps}
    >
      {@render children?.()}
    </code>
    {#if content}
      <div class="absolute end-2 top-2">
        <button
          type="button"
          class="text-muted-foreground bg-secondary inline-flex h-8 items-center justify-center rounded-sm px-2 font-mono text-xs"
          aria-label="Copy code"
          title="Copy code"
          onclick={() => void copyCode()}
        >
          {#if copied}
            Copied
          {:else}
            {language || "Copy"}
          {/if}
        </button>
      </div>
    {/if}
  </div>
{:else}
  <code
    bind:this={ref}
    class={classNames("font-mono text-sm whitespace-pre", className)}
    {...restProps}
  >
    {@render children?.()}
  </code>
{/if}
