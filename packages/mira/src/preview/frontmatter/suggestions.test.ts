import { describe, expect, it } from "vitest";
import {
  filterFrontmatterPropertySuggestions,
  filterFrontmatterValueSuggestions,
  parseFrontmatterPillWikilink,
  readFrontmatterPropertySuggestions,
  readFrontmatterValueSuggestions,
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

describe("frontmatter value suggestions", () => {
  it("loads keyed values and ranks prefix matches", async () => {
    const suggestions = await readFrontmatterValueSuggestions(
      {
        valueSuggestions: (key, query) =>
          key === "tags" && query.startsWith("p")
            ? ["project/alpha", "inbox", "project/beta"]
            : [],
      },
      "tags",
      "pro",
    );
    expect(suggestions).toEqual(["project/alpha", "project/beta"]);
  });

  it("excludes current pills and empty values", () => {
    expect(
      filterFrontmatterValueSuggestions(
        ["demo", "ideas", "demo", ""],
        "dem",
        ["demo"],
      ),
    ).toEqual([]);
    expect(
      filterFrontmatterValueSuggestions(["ideas", "demo"], "ide", ["demo"]),
    ).toEqual(["ideas"]);
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
