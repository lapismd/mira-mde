import React, { useEffect, useRef } from "react";
import { mount, unmount, type Component } from "svelte";

export interface SvelteDocsBridgeProps {
  component: Component;
  props?: Record<string, unknown>;
}

/** Mounts a Svelte documentation surface inside Storybook's React-based MDX. */
export function SvelteDocsBridge({
  component,
  props = {},
}: SvelteDocsBridgeProps): React.ReactElement {
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target.current) return;
    const mounted = mount(component, { target: target.current, props });
    return () => {
      void unmount(mounted);
    };
  }, [component, props]);

  return <div ref={target} />;
}
