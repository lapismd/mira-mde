import {
  createSelectionToolbarExtension,
  type MiraSelectionToolbarConfig,
} from "../internal/codemirror/base/selection-toolbar";
import type { MiraExtension } from ".";

export {
  defaultMiraSelectionToolbarActions,
  miraSelectionToolbarActionIds,
  type MiraSelectionToolbarActionId,
  type MiraSelectionToolbarConfig,
  type MiraSelectionToolbarPlacement,
} from "../internal/codemirror/base/selection-toolbar";

/** Add the contextual formatting toolbar to editable Mira surfaces. */
export function selectionToolbarExtension(
  config: MiraSelectionToolbarConfig = {},
): MiraExtension {
  return {
    name: "selection-toolbar",
    codeMirror({ mode, readonly }) {
      if (readonly || mode === "preview") {
        return null;
      }
      return createSelectionToolbarExtension(config);
    },
  };
}
