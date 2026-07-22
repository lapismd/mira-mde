/**
 * Visual capture density for Playwright baselines and Visual Delta.
 *
 * CSS layout stays at the configured viewport (1280×900). Screenshots use
 * `deviceScaleFactor` with `toHaveScreenshot({ scale: "device" })` so PNGs
 * pack more pixels (width/height × this factor).
 */
export const VISUAL_DEVICE_SCALE_FACTOR = 3;

export const VISUAL_VIEWPORT = { width: 1280, height: 900 } as const;
