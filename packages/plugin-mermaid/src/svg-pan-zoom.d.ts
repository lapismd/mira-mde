declare module "svg-pan-zoom" {
  export type SvgPanZoomPoint = {
    x: number;
    y: number;
  };

  export type SvgPanZoomOptions = {
    center?: boolean;
    controlIconsEnabled?: boolean;
    fit?: boolean;
    maxZoom?: number;
    minZoom?: number;
    mouseWheelZoomEnabled?: boolean;
    onPan?: (pan: SvgPanZoomPoint) => void;
    onZoom?: (zoom: number) => void;
    panEnabled?: boolean;
    preventMouseEventsDefault?: boolean;
    zoomEnabled?: boolean;
  };

  export type SvgPanZoomInstance = {
    destroy(): void;
    disableDblClickZoom(): void;
    disablePan(): void;
    disableZoom(): void;
    enablePan(): void;
    enableZoom(): void;
    getPan(): SvgPanZoomPoint;
    getZoom(): number;
    pan(pan: SvgPanZoomPoint): void;
    panBy(pan: SvgPanZoomPoint): void;
    reset(): void;
    resize(): void;
    zoom(zoom: number): void;
    zoomIn(): void;
    zoomOut(): void;
  };

  export default function panzoom(
    element: SVGElement,
    options?: SvgPanZoomOptions,
  ): SvgPanZoomInstance | null;
}
