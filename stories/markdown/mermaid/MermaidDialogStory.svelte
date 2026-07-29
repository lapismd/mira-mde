<script lang="ts">
  import { Mermaid } from "@mira-mde/plugin-mermaid";
</script>

<div class="mira-story-surface mira-mermaid-dialog-story">
  <Mermaid
    id="storybook-mermaid-dialog"
    diagram={"flowchart LR\n  Source --> Parse --> Render\n  Render --> Preview"}
    dialog
  />
</div>
