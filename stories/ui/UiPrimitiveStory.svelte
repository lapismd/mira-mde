<script lang="ts">
  import BoldIcon from "@lucide/svelte/icons/bold";
  import CodeIcon from "@lucide/svelte/icons/code";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import ItalicIcon from "@lucide/svelte/icons/italic";
  import ListOrderedIcon from "@lucide/svelte/icons/list-ordered";
  import PencilLineIcon from "@lucide/svelte/icons/pencil-line";
  import Redo2Icon from "@lucide/svelte/icons/redo-2";
  import SaveIcon from "@lucide/svelte/icons/save";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import Undo2Icon from "@lucide/svelte/icons/undo-2";
  import WrapTextIcon from "@lucide/svelte/icons/wrap-text";
  import {
    Button,
    ContextMenu,
    Dialog,
    DropdownMenu,
    Popover,
    ScrollArea,
    Separator,
    Table,
    ToggleGroup,
    Toolbar,
    Tooltip,
    buttonVariants,
  } from "@mira-mde/ui";

  export type UiPrimitiveKind =
    | "buttons"
    | "toggle-group"
    | "toolbar"
    | "dropdown-menu"
    | "context-menu"
    | "dialog"
    | "popover"
    | "tooltip"
    | "table"
    | "scroll-area";

  type Props = {
    primitive: UiPrimitiveKind;
  };

  const titles: Record<UiPrimitiveKind, string> = {
    buttons: "Buttons and separators",
    "toggle-group": "Toggle group",
    toolbar: "Toolbar",
    "dropdown-menu": "Dropdown menu",
    "context-menu": "Context menu",
    dialog: "Dialog",
    popover: "Popover",
    tooltip: "Tooltip",
    table: "Table",
    "scroll-area": "Scroll area",
  };

  const scrollItems = Array.from(
    { length: 16 },
    (_, index) => `Portable document ${index + 1}`,
  );

  let { primitive }: Props = $props();
  let buttonClicks = $state(0);
  let selectedMode = $state("live-preview");
  let toolbarValues = $state<string[]>([]);
  let menuChoice = $state("No menu action selected");
  let contextChoice = $state("No context action selected");
  let showLineNumbers = $state(true);
  let wrapText = $state(false);
  let dialogOpen = $state(false);
  let dialogResult = $state("No dialog action selected");
  let popoverResult = $state("No slash command selected");

  const status = $derived.by(() => {
    switch (primitive) {
      case "buttons":
        return `Primary action count: ${buttonClicks}`;
      case "toggle-group":
        return `Selected mode: ${selectedMode}`;
      case "toolbar":
        return `Active formatting: ${toolbarValues.join(", ") || "none"}`;
      case "dropdown-menu":
        return `${menuChoice}; line numbers ${showLineNumbers ? "on" : "off"}`;
      case "context-menu":
        return `${contextChoice}; wrap text ${wrapText ? "on" : "off"}`;
      case "dialog":
        return dialogResult;
      case "popover":
        return popoverResult;
      case "tooltip":
        return "Hover or focus the action to inspect its tooltip";
      case "table":
        return "Three public package surfaces rendered";
      case "scroll-area":
        return `${scrollItems.length} documents in the bounded scroll area`;
    }
  });
</script>

<section class="mira-ui-story" data-primitive={primitive}>
  <header class="mira-ui-story__header">
    <p>@mira-mde/ui</p>
    <h2>{titles[primitive]}</h2>
  </header>

  <div class="mira-ui-story__surface">
    {#if primitive === "buttons"}
      <div class="mira-ui-story__row">
        <Button onclick={() => (buttonClicks += 1)}>
          <SaveIcon data-icon="inline-start" />
          Save changes
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link" href="#button-link">Link</Button>
        <Button disabled>Disabled</Button>
      </div>
      <Separator />
      <p class="mira-ui-story__note">
        Button variants share the same semantic Mira color, radius, focus, and
        disabled-state contract.
      </p>
    {:else if primitive === "toggle-group"}
      <ToggleGroup.Root bind:value={selectedMode} aria-label="Editor mode">
        <ToggleGroup.Item value="source">Source</ToggleGroup.Item>
        <ToggleGroup.Item value="live-preview">Live preview</ToggleGroup.Item>
        <ToggleGroup.Item value="preview">Preview</ToggleGroup.Item>
        <ToggleGroup.Item value="split">Split</ToggleGroup.Item>
      </ToggleGroup.Root>
    {:else if primitive === "toolbar"}
      <Toolbar.Root aria-label="Formatting toolbar">
        <Toolbar.Button
          aria-label="Undo"
          onclick={() => (menuChoice = "Undo selected")}
        >
          <Undo2Icon />
        </Toolbar.Button>
        <Toolbar.Button
          aria-label="Redo"
          onclick={() => (menuChoice = "Redo selected")}
        >
          <Redo2Icon />
        </Toolbar.Button>
        <Separator orientation="vertical" class="mira-ui-story__separator" />
        <Toolbar.Group
          type="multiple"
          bind:value={toolbarValues}
          aria-label="Text formatting"
        >
          <Toolbar.GroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </Toolbar.GroupItem>
          <Toolbar.GroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </Toolbar.GroupItem>
          <Toolbar.GroupItem value="code" aria-label="Code">
            <CodeIcon />
          </Toolbar.GroupItem>
        </Toolbar.Group>
        <Toolbar.Link href="#toolbar-help" aria-label="Formatting help">
          ?
        </Toolbar.Link>
      </Toolbar.Root>
    {:else if primitive === "dropdown-menu"}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class={buttonVariants({ variant: "outline" })}
          aria-label="Open document actions"
        >
          Document actions
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start">
          <DropdownMenu.Group>
            <DropdownMenu.Label>Document</DropdownMenu.Label>
            <DropdownMenu.Item
              onclick={() => (menuChoice = "Duplicated document")}
            >
              <CopyIcon />
              Duplicate
              <DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onclick={() => (menuChoice = "Renamed document")}
            >
              <PencilLineIcon />
              Rename
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.CheckboxItem bind:checked={showLineNumbers}>
              <ListOrderedIcon
                data-menu-icon="line-numbers"
                aria-hidden="true"
              />
              Show line numbers
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.Item
              variant="destructive"
              onclick={() => (menuChoice = "Delete requested")}
            >
              <Trash2Icon aria-hidden="true" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {:else if primitive === "context-menu"}
      <ContextMenu.Root>
        <ContextMenu.Trigger
          class="mira-ui-story__context-target"
          data-testid="context-menu-target"
        >
          Right-click this Markdown block
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Group>
            <ContextMenu.Label>Block actions</ContextMenu.Label>
            <ContextMenu.Item onclick={() => (contextChoice = "Copied block")}>
              <CopyIcon />
              Copy block
              <ContextMenu.Shortcut>⌘C</ContextMenu.Shortcut>
            </ContextMenu.Item>
            <ContextMenu.Item
              onclick={() => (contextChoice = "Duplicated block")}
            >
              <CopyIcon />
              Duplicate block
            </ContextMenu.Item>
            <ContextMenu.CheckboxItem bind:checked={wrapText}>
              <WrapTextIcon data-menu-icon="wrap-text" aria-hidden="true" />
              Wrap text
            </ContextMenu.CheckboxItem>
          </ContextMenu.Group>
        </ContextMenu.Content>
      </ContextMenu.Root>
    {:else if primitive === "dialog"}
      <Dialog.Root bind:open={dialogOpen}>
        <Dialog.Trigger
          class={buttonVariants({ variant: "outline" })}
          aria-label="Open publish dialog"
        >
          Publish document
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Publish document</Dialog.Title>
            <Dialog.Description>
              Confirm that the current portable Markdown document is ready for
              readers.
            </Dialog.Description>
          </Dialog.Header>
          <p class="mira-ui-story__dialog-copy">
            The dialog verifies the overlay, title, description, close control,
            focus trap, and action composition.
          </p>
          <Dialog.Footer>
            <Dialog.Close class={buttonVariants({ variant: "outline" })}>
              Cancel
            </Dialog.Close>
            <Button
              onclick={() => {
                dialogResult = "Document published";
                dialogOpen = false;
              }}>Confirm publish</Button
            >
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    {:else if primitive === "popover"}
      <Popover.Root>
        <Popover.Trigger
          class={buttonVariants({ variant: "outline" })}
          aria-label="Open slash command help"
        >
          Slash commands
        </Popover.Trigger>
        <Popover.Content align="start">
          <div class="mira-ui-story__popover-copy">
            <strong>Insert Markdown</strong>
            <span>
              Shared popover chrome for rich controls and editor command help.
            </span>
          </div>
          <Popover.Close
            class={buttonVariants({ variant: "secondary", size: "sm" })}
            onclick={() => (popoverResult = "Slash command help dismissed")}
          >
            Dismiss
          </Popover.Close>
        </Popover.Content>
      </Popover.Root>
    {:else if primitive === "tooltip"}
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger
            class={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Save document"
          >
            <SaveIcon />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">Save document</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {:else if primitive === "table"}
      <Table.Root>
        <Table.Caption>Package surface matrix</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head>Package</Table.Head>
            <Table.Head>Surface</Table.Head>
            <Table.Head>Status</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>@mira-mde/ui</Table.Cell>
            <Table.Cell>Primitives</Table.Cell>
            <Table.Cell>Shipped</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>@mira-mde/svelte</Table.Cell>
            <Table.Cell>Editor</Table.Cell>
            <Table.Cell>Shipped</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>@mira-mde/preview</Table.Cell>
            <Table.Cell>Reading view</Table.Cell>
            <Table.Cell>Shipped</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell colspan={2}>Documented surfaces</Table.Cell>
            <Table.Cell>3</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    {:else}
      <ScrollArea class="mira-ui-story__scroll-area">
        <ol>
          {#each scrollItems as item, index (item)}
            <li>
              <a href={`#portable-document-${index + 1}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item}
              </a>
            </li>
          {/each}
        </ol>
      </ScrollArea>
    {/if}
  </div>

  <output class="mira-ui-story__status" data-testid="primitive-status">
    {status}
  </output>
</section>

<style>
  .mira-ui-story {
    box-sizing: border-box;
    display: grid;
    gap: 1.25rem;
    min-height: 20rem;
    padding: 2rem;
    background: var(--mira-background);
    color: var(--mira-foreground);
    font-family: var(--mira-font-sans);
  }

  .mira-ui-story__header p,
  .mira-ui-story__header h2,
  .mira-ui-story__note,
  .mira-ui-story__dialog-copy {
    margin: 0;
  }

  .mira-ui-story__header p {
    color: var(--mira-muted-foreground);
    font-size: 0.75rem;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .mira-ui-story__header h2 {
    margin-top: 0.25rem;
    font-size: 1.5rem;
  }

  .mira-ui-story__popover-copy {
    display: grid;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .mira-ui-story__popover-copy span {
    color: var(--mira-muted-foreground);
  }

  .mira-ui-story__surface {
    align-self: start;
    display: grid;
    gap: 1rem;
    min-width: 0;
    padding: 1.5rem;
    border: 1px solid var(--mira-border);
    border-radius: calc(var(--mira-radius) * 1.5);
    background: var(--mira-editor-background);
    box-shadow: var(--mira-widget-shadow);
  }

  .mira-ui-story__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  .mira-ui-story__note,
  .mira-ui-story__dialog-copy {
    color: var(--mira-muted-foreground);
    line-height: 1.5;
  }

  .mira-ui-story :global(.mira-ui-story__separator) {
    align-self: stretch;
    min-height: 1.75rem;
  }

  .mira-ui-story :global(.mira-ui-story__context-target) {
    display: grid;
    min-height: 8rem;
    place-items: center;
    padding: 1rem;
    border: 1px dashed var(--mira-border-strong);
    border-radius: var(--mira-radius);
    background: var(--mira-muted);
    color: var(--mira-muted-foreground);
    cursor: context-menu;
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area) {
    max-height: 12rem;
    border: 1px solid var(--mira-border);
    border-radius: var(--mira-radius);
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area ol) {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area li) {
    border-bottom: 1px solid var(--mira-border);
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area li:last-child) {
    border-bottom: 0;
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area li span) {
    color: var(--mira-muted-foreground);
    font-family: var(--mira-font-mono);
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area li a) {
    display: flex;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
    color: var(--mira-foreground);
    text-decoration: none;
  }

  .mira-ui-story :global(.mira-ui-story__scroll-area li a:focus-visible) {
    outline: 2px solid var(--mira-accent);
    outline-offset: -2px;
  }

  .mira-ui-story__status {
    align-self: end;
    padding: 0.75rem 1rem;
    border-radius: var(--mira-radius);
    background: var(--mira-muted);
    color: var(--mira-muted-foreground);
    font-size: 0.8125rem;
  }
</style>
