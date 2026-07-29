<script lang="ts">
  import { FileEmbed, MarkdownEmbed, NoteLink } from "@mira-mde/preview";
  import { defineMiraExtension } from "@mira-mde/extensions";
  import { storyFileAdapter } from "../_shared/file-adapter";

  const diagnosticsExtension = defineMiraExtension({
    name: "storybook-portable-surfaces",
    postProcessors: [
      (element) => {
        if (element.matches("h2")) {
          element.dataset.portableDiagnostic = "checked";
        }
      },
    ],
  });
</script>

<div class="mira-story-surface mira-portable-surfaces-story">
  <section>
    <h2>NoteLink</h2>
    <p>
      Open or preview the
      <NoteLink
        id="Embedded Note"
        text="portable embedded note"
        fileAdapter={storyFileAdapter}
      />.
    </p>
  </section>

  <section>
    <h2>FileEmbed</h2>
    <FileEmbed
      id="Embedded Note#Next Steps"
      label="Next Steps"
      fileAdapter={storyFileAdapter}
    />
  </section>

  <section>
    <h2>MarkdownEmbed</h2>
    <MarkdownEmbed
      value={"## Portable Markdown\n\nA narrow embedded Markdown surface."}
      extensions={[diagnosticsExtension]}
    />
  </section>
</div>
