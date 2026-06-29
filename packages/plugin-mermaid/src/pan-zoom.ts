import type { SvgPanZoomInstance, SvgPanZoomOptions } from "svg-pan-zoom";

type PanZoomPoint = {
  x: number;
  y: number;
};

type PanZoomOptions = {
  mouseWheelZoomEnabled?: boolean;
  pan?: PanZoomPoint;
  preventMouseEventsDefault?: boolean;
  zoom?: number;
};

type PanZoomFactory = (
  element: SVGElement,
  options?: SvgPanZoomOptions,
) => SvgPanZoomInstance | null;

export class PanZoomState {
  private instance: SvgPanZoomInstance | null = null;
  private isDirty = false;
  private readonly resizeObserver: ResizeObserver | null;

  constructor() {
    this.resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            this.resize();
            if (!this.isDirty) {
              this.reset();
            }
          });
  }

  async updateElement(
    svg: SVGElement,
    {
      mouseWheelZoomEnabled = false,
      pan,
      preventMouseEventsDefault = false,
      zoom,
    }: PanZoomOptions = {},
  ): Promise<void> {
    this.disconnect();

    const panzoom = await loadPanZoom();
    const nextInstance = panzoom(svg, {
      center: true,
      controlIconsEnabled: false,
      fit: true,
      maxZoom: 12,
      minZoom: 0.2,
      mouseWheelZoomEnabled,
      onPan: () => {
        this.isDirty = true;
      },
      onZoom: () => {
        this.isDirty = true;
      },
      panEnabled: true,
      preventMouseEventsDefault,
      zoomEnabled: true,
    });

    if (!nextInstance) {
      return;
    }

    const instance = nextInstance;
    this.instance = instance;
    instance.disableDblClickZoom();
    this.resizeObserver?.observe(svg);

    if (
      pan &&
      zoom &&
      Number.isFinite(pan.x) &&
      Number.isFinite(pan.y) &&
      Number.isFinite(zoom)
    ) {
      instance.zoom(zoom);
      instance.pan(pan);
      this.isDirty = true;
      return;
    }

    this.reset();
  }

  disconnect(): void {
    this.resizeObserver?.disconnect();
    try {
      this.instance?.destroy();
    } catch {
      // svg-pan-zoom can throw if the SVG was already removed from the DOM.
    }
    this.instance = null;
  }

  panBy(point: PanZoomPoint): void {
    this.instance?.panBy(point);
  }

  reset(): void {
    try {
      this.instance?.reset();
    } catch {
      // Ignore teardown races when the dialog closes during a reset.
    }
    this.isDirty = false;
  }

  resize(): void {
    this.instance?.resize();
  }

  zoomIn(): void {
    this.instance?.zoomIn();
  }

  zoomOut(): void {
    this.instance?.zoomOut();
  }
}

async function loadPanZoom(): Promise<PanZoomFactory> {
  const module = (await import("svg-pan-zoom")) as {
    default: PanZoomFactory;
  };
  return module.default;
}
