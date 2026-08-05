<script lang="ts">
  import * as Dialog from "@lapismd/mira/ui/dialog";
  import miraLogo from "./assets/logo.png";
  import { MIRA_EDITOR_VERSION } from "./version";

  let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="mira-editor-about-dialog">
    <Dialog.Header class="mira-editor-about-dialog__header">
      <Dialog.Title>About Mira</Dialog.Title>
      <Dialog.Description>Mira Markdown Editor</Dialog.Description>
    </Dialog.Header>
    <div class="mira-editor-about-dialog__logo-viewport">
      <img
        class="mira-editor-about-dialog__logo-image"
        src={miraLogo}
        alt="Mira MDE logo"
        width="960"
        height="337"
      />
    </div>
    <p class="mira-editor-about-dialog__version">
      Version {MIRA_EDITOR_VERSION}
    </p>
  </Dialog.Content>
</Dialog.Root>
