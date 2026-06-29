import { describe, expect, it } from "vitest";
import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import {
  createBaseCodeMirrorExtensions,
  createSlashCommandCompletionSource,
  createSlashCommandExtensions,
} from ".";

describe("createBaseCodeMirrorExtensions", () => {
  it("returns a non-empty extension set", () => {
    expect(createBaseCodeMirrorExtensions()).not.toHaveLength(0);
  });
});

describe("createSlashCommandExtensions", () => {
  it("is empty without commands", () => {
    expect(createSlashCommandExtensions()).toEqual([]);
  });

  it("completes slash commands after a slash trigger", () => {
    const source = createSlashCommandCompletionSource([
      {
        id: "heading",
        label: "Heading 1",
        group: "Basic",
        keywords: ["h1"],
        insert: "# ",
      },
      {
        id: "table",
        label: "Table",
        group: "Blocks",
        insert: "| Column |",
      },
    ]);
    const state = EditorState.create({ doc: "/h" });
    const result = source(new CompletionContext(state, 2, false));

    if (result instanceof Promise) {
      throw new Error("Expected synchronous slash completions.");
    }

    expect(result?.from).toBe(1);
    expect(result?.to).toBe(2);
    expect(result?.filter).toBe(false);
    expect(result?.options.map((option) => option.label)).toEqual([
      "Heading 1",
    ]);
  });

  it("does not complete slash commands in the middle of a word", () => {
    const source = createSlashCommandCompletionSource([
      {
        id: "heading",
        label: "Heading 1",
        insert: "# ",
      },
    ]);
    const state = EditorState.create({ doc: "word/h" });
    const result = source(new CompletionContext(state, 6, false));

    expect(result).toBeNull();
  });
});
