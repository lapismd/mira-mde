import { mount, unmount } from "svelte";
import MiraMde, { type MiraMdeProps } from "@lapismd/mira";

export type MiraMdeVanillaInstance = {
  update: (props: Partial<MiraMdeProps>) => void;
  destroy: () => void;
};

export function createMiraMde(
  target: HTMLElement,
  props: MiraMdeProps,
): MiraMdeVanillaInstance {
  let currentProps = { ...props };
  let component = mount(MiraMde, {
    target,
    props: currentProps,
  });

  return {
    update(nextProps) {
      currentProps = {
        ...currentProps,
        ...nextProps,
      };
      unmount(component);
      component = mount(MiraMde, {
        target,
        props: currentProps,
      });
    },
    destroy() {
      unmount(component);
    },
  };
}

export { MiraMde };
export type { MiraMdeProps };
export default createMiraMde;
