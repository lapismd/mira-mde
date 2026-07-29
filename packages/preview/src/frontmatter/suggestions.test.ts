import { describe, expect, it } from "vitest";
import {
  filterFrontmatterPropertySuggestions,
  parseFrontmatterPillWikilink,
  readFrontmatterPropertySuggestions,
} from "./suggestions";

describe("frontmatter property suggestions", () => {
  it("loads lazy suggestions and derives configured icons", async () => {
    const suggestions = await readFrontmatterPropertySuggestions({
      propertySuggestions: async () => [
        "status",
        { name: "owner", kind: "aliases" },
        "status",
      ],
    });

    expect(suggestions).toEqual([
      { name: "status", icon: undefined },
      { name: "owner", kind: "aliases", icon: "lucide-at-sign" },
    ]);
  });

  it("filters, ranks prefixes, and excludes existing names", () => {
    expect(
      filterFrontmatterPropertySuggestions(
        [{ name: "review-status" }, { name: "status" }, { name: "state" }],
        "sta",
        ["state"],
      ).map((suggestion) => suggestion.name),
    ).toEqual(["status", "review-status"]);
  });
});

describe("frontmatter wikilink pills", () => {
  it("recognizes only whole-value wikilinks", () => {
    expect(parseFrontmatterPillWikilink("[[Project|Roadmap]]")).toEqual({
      target: "Project",
      text: "Roadmap",
    });
    expect(parseFrontmatterPillWikilink("See [[Project]]")).toBeNull();
  });
});
