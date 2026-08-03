/** Focused fixtures adapted from Lapis's Markdown indentation regressions. */

export const wrappedListItemsMarkdown = [
  "# Wrapped list items",
  "",
  "1000. Navigate to the workspace location and keep this ordered item long enough to wrap across several visual rows while its continuation rows stay aligned with the item body.",
  "",
  "- Keep this unordered item long enough to wrap across several visual rows while its marker remains clear of the label and every continuation row hangs beneath the item body.",
  "",
  "* Keep this asterisk-authored item long enough to wrap across several visual rows while live preview normalizes its inactive marker to the rendered bullet presentation.",
].join("\n");

export const continuationParagraphsMarkdown = [
  "- Bullet item",
  " This single-space continuation keeps its authored prefix and wraps from the first visible content column.",
  "  This two-space continuation aligns with the parent bullet text while wrapping across multiple visual rows.",
  "",
  "2. Multiple paragraphs in a list item:",
  "    Four-space continuation text remains attached to the ordered item and keeps a full-height indentation guide while it wraps.",
  "",
  "    This blank-separated continuation remains part of the same ordered item instead of collapsing flush left.",
  "",
  "\tThis tab-authored continuation normalizes to a Markdown indentation stop.",
  "",
  "4. Preformatted text in a list item:",
  "",
  "        Eight-space preformatted content keeps the code-block offset instead of being anchored like an ordinary continuation.",
].join("\n");

const nestedListsAndQuotesCore = [
  "1. Ordered parent with enough text to wrap and expose the first content column.",
  "   1. Space-authored ordered child with enough text to wrap inside its nested level.",
  "      1. Space-authored ordered grandchild",
  "- Unordered parent",
  "\t- Tab-authored unordered child with enough text to wrap inside its nested level.",
  "\t\t- Double-tab unordered grandchild",
  "> Quoted paragraph with enough text to wrap beneath the quote prefix instead of beneath the page edge.",
  "> - Quoted unordered item with a long body that wraps beneath the item text.",
  ">   - [ ] Quoted checklist child",
  "> > Nested quote keeps a second quote guide.",
];

export const nestedListsAndQuotesLiveMarkdown = nestedListsAndQuotesCore
  .slice(0, -1)
  .join("\n");

export const nestedListsAndQuotesMarkdown = [
  ...nestedListsAndQuotesCore,
  "3. Blockquote inside a list item:",
  "",
  "    > Skip a line and indent the quote markers four spaces.",
  "    > The rendered blockquote stays attached to its first source line.",
].join("\n");

export const activePrefixesMarkdown = [
  "# Active indentation prefixes",
  "",
  "- Parent bullet",
  "  Wrapped continuation stays aligned when the caret enters its raw prefix.",
  "  - Nested unordered item stays measured across editor focus and blur.",
  "",
  "3. Blockquote inside a list item:",
  "",
  "  > Blockquote content stays aligned when the caret enters its raw prefix.",
  "  > > Nested quoted line keeps the rendered block attached.",
].join("\n");

export const configurableIndentWidthMarkdown = [
  "# Configurable indent width",
  "",
  "- Parent item",
  "\t- Tab-authored child",
  "\t\t- Double-tab grandchild",
].join("\n");
