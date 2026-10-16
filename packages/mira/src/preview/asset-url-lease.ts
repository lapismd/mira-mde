import type { MiraFileAdapter, MiraFileRef } from "@lapismd/mira/extensions";

export function createAssetUrlLease(
  adapter: MiraFileAdapter,
  file: MiraFileRef,
) {
  let disposed = false;
  let held: string | null = null;
  const result = Promise.resolve()
    .then(() => adapter.readAssetUrl?.(file) ?? null)
    .then((url) => {
      if (disposed) {
        if (url !== null) adapter.releaseAssetUrl?.(url);
        return null;
      }
      held = url;
      return url;
    });
  return {
    result,
    release() {
      if (disposed) return;
      disposed = true;
      if (held !== null) {
        const url = held;
        held = null;
        adapter.releaseAssetUrl?.(url);
      }
    },
  };
}
