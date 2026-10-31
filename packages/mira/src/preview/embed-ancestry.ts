import { getContext, setContext } from "svelte";

const ancestryContext = Symbol("mira-embed-ancestry");
type Ancestry = () => readonly string[];

/** Each branch owns its ancestry; repeated sibling embeds remain independent. */
export function createEmbedAncestry(
  target: () => string | null,
): () => boolean {
  const parent =
    getContext<Ancestry | undefined>(ancestryContext) ?? (() => []);
  setContext<Ancestry>(ancestryContext, () => {
    const key = target();
    return key === null ? parent() : [...parent(), key];
  });
  return () => {
    const key = target();
    return key !== null && parent().includes(key);
  };
}
