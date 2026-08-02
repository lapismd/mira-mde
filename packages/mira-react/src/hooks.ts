import { useLayoutEffect, useRef } from "react";

export function useLatestRef<T>(value: T): { current: T } {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}

export function cx(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
