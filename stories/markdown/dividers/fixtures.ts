import {
  defaultMiraDoodleDividerVariants,
  materializeDoodleDividerSeeds,
  type MiraDoodleDividerVariant,
} from "@lapismd/mira/extensions";

export const doodleDividersMarkdown = `# Doodle dividers

The stored comment keeps each divider stable when content moves around it.

<!-- mira-divider:v1:00000000 -->
---

Each seed independently chooses a fixed shape and theme color.

<!-- mira-divider:v1:00000001 -->
---

This next rule is deliberately unseeded and remains a normal horizontal rule.

---

> A seeded divider can retain blockquote ancestry.
>
> <!-- mira-divider:v1:00000002 -->
> ---
>
> Its source pair remains nested with the quoted content.

- A seeded divider can also remain inside a list item.

  <!-- mira-divider:v1:00000004 -->
  ---

  Content after the nested rule stays in the same item.
`;

const defaultGallerySeeds = [
  "00000008",
  "00000006",
  "00000000",
  "0000000a",
  "00000001",
  "00000004",
  "00000002",
  "00000016",
] as const;

export const defaultDoodleDividerGalleryMarkdown = `# Fixed v1 gallery

${defaultMiraDoodleDividerVariants
  .map(
    (variant, index) => `## ${variant.id}

<!-- mira-divider:v1:${defaultGallerySeeds[index]} -->
---`,
  )
  .join("\n\n")}
`;

export const twentyFourDoodleDividersMarkdown = `# 24 deterministic dividers

This page repeats the eight frozen v1 families across three independent seed and color selections.

${Array.from({ length: 24 }, (_, index) => {
  const seed = (0x100 + index * 17).toString(16).padStart(8, "0");
  return `## Divider ${index + 1}

<!-- mira-divider:v1:${seed} -->
---`;
}).join("\n\n")}
`;

export const customDoodleDividerVariant: MiraDoodleDividerVariant = {
  id: "storybook-double-wave",
  draw({ random }) {
    const lift = 5 + random() * 3;
    return [
      `M 6 12 Q 250 ${lift.toFixed(2)} 500 12 T 994 12`,
      `M 6 22 Q 250 ${(30 - lift).toFixed(2)} 500 22 T 994 22`,
    ];
  },
};

export const customDoodleDividerGalleryMarkdown = materializeDoodleDividerSeeds(
  `# Custom gallery

The pure migration helper adds IDs only when a consumer explicitly requests it.

---

The custom variant can return multiple SVG paths.

---

Its authored seeds remain portable Markdown comments.

---
`,
  {
    createSeed: ({ line }) => 0xc0ffee00 + line,
    sourcePath: "custom-divider-gallery.md",
  },
);
