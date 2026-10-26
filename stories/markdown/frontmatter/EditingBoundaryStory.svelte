<script lang="ts">
  import {
    FrontmatterController,
    FrontmatterEditor,
    createFrontmatterPropertyManager,
  } from "@lapismd/mira/preview";

  let root: HTMLDivElement;
  let baseline = $state("");
  let submitted = $state("");
  let frozen = $state(false);
  let refused = $state("");
  let writes = $state(0);
  const controller = new FrontmatterController({
    sourcePath: "first.md",
    propertyManager: createFrontmatterPropertyManager({
      onActionError: (_error, action) => {
        refused = action;
      },
    }),
    record: { status: "ready" },
    onRecordChange(commit) {
      writes += 1;
      baseline = String(commit.previousRecord.status);
      submitted = String(commit.record.status);
      frozen = Object.isFrozen(commit.previousRecord);
    },
  });
  function refresh(): void {
    controller.syncRecord({ status: "external", owner: "outside" });
  }
  function refreshBeforeFocus(): void {
    refresh();
    root.querySelector<HTMLElement>('[aria-label="status value"]')!.focus();
  }
  function replaceTarget(): void {
    controller.update({
      sourcePath: "second.md",
      onRecordChange: () => {
        writes += 1;
      },
    });
    controller.syncRecord({ status: "second", owner: "new target" });
  }
</script>

<div bind:this={root} class="mira-story-surface" data-baseline-frozen={frozen}>
  <fieldset>
    <legend>Fixture controls</legend>
    <button onpointerdown={(event) => event.preventDefault()} onclick={refresh}>
      Refresh external record
    </button>
    <button onclick={refreshBeforeFocus}
      >Queue refresh and focus property</button
    >
  </fieldset>
  <button
    onpointerdown={(event) => event.preventDefault()}
    onclick={replaceTarget}>Replace source target</button
  >
  <FrontmatterEditor {controller} open showChrome={false} />
  <output aria-label="Committed baseline">{baseline}</output>
  <output aria-label="Submitted value">{submitted}</output>
  <output aria-label="Refused action">{refused}</output>
  <output aria-label="Write count">{writes}</output>
  <output aria-label="Current status">{String(controller.record.status)}</output
  >
</div>
