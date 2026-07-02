import { describe, expect, it } from "vitest";
import {
  createMarkdownTemplate,
  createSlashSnippet,
  defineMiraExtension,
  resolveMiraExtensions,
} from ".";

describe("resolveMiraExtensions", () => {
  it("merges contribution arrays in extension order", () => {
    const first = defineMiraExtension({
      name: "first",
      remarkPlugins: [() => undefined],
      components: { a: "span" },
    });
    const second = defineMiraExtension({
      name: "second",
      rehypePlugins: [() => undefined],
      components: { b: "div" },
    });

    const resolved = resolveMiraExtensions([first, second], {
      mode: "source",
      readonly: false,
    });

    expect(resolved.remarkPlugins).toHaveLength(1);
    expect(resolved.rehypePlugins).toHaveLength(1);
    expect(resolved.components).toEqual({ a: "span", b: "div" });
  });

  it("merges slash commands in extension order", () => {
    const resolved = resolveMiraExtensions(
      [
        defineMiraExtension({
          name: "first",
          slashCommands: [
            {
              id: "heading",
              label: "Heading",
              insert: "# ",
            },
          ],
        }),
        defineMiraExtension({
          name: "second",
          slashCommands: [
            {
              id: "callout",
              label: "Callout",
              insert: "> [!note] ",
            },
          ],
        }),
      ],
      {
        mode: "source",
        readonly: false,
      },
    );

    expect(resolved.slashCommands.map((command) => command.id)).toEqual([
      "heading",
      "callout",
    ]);
  });
});

describe("slash snippet helpers", () => {
  it("creates markdown templates from cursor markers", () => {
    expect(createMarkdownTemplate("## <|>")).toEqual({
      markdown: "## ",
      selection: 3,
    });
  });

  it("creates slash commands from markdown snippets", () => {
    expect(
      createSlashSnippet({
        id: "callout",
        label: "Callout",
        description: "Insert a callout",
        group: "Basic",
        keywords: ["note"],
        markdown: "> [!note] <|>\n> ",
      }),
    ).toEqual({
      id: "callout",
      label: "Callout",
      description: "Insert a callout",
      group: "Basic",
      keywords: ["note"],
      insert: {
        markdown: "> [!note] \n> ",
        selection: 10,
      },
    });
  });
});
