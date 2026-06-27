import { getContext, setContext } from "svelte";

const TOGGLE_GROUP_CONTEXT = Symbol("mira-toggle-group");

export type ToggleGroupContext = {
  value: () => string;
  setValue: (value: string) => void;
};

export function setToggleGroupContext(context: ToggleGroupContext): void {
  setContext(TOGGLE_GROUP_CONTEXT, context);
}

export function useToggleGroupContext(): ToggleGroupContext {
  return getContext<ToggleGroupContext>(TOGGLE_GROUP_CONTEXT);
}
