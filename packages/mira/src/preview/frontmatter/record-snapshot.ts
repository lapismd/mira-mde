/** Independent portable record authority for one rendered edit or commit. */
export function snapshotFrontmatterRecord(
  record: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  let snapshot: Record<string, unknown>;
  try {
    snapshot = JSON.parse(JSON.stringify(record));
  } catch {
    snapshot = copyValue(record, new WeakMap()) as Record<string, unknown>;
  }
  freezeValue(snapshot, new WeakSet());
  return snapshot;
}

function copyValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  const existing = seen.get(value);
  if (existing) return existing;
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const [key, item] of Object.entries(value))
    Object.defineProperty(copy, key, {
      value: copyValue(item, seen),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  return copy;
}

function freezeValue(value: unknown, seen: WeakSet<object>): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const item of Object.values(value)) freezeValue(item, seen);
  Object.freeze(value);
}
