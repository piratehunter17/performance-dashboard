/**
 * Configures a canvas for high-DPI displays.
 * This should be called every time the canvas is resized.
 * @param canvas - The canvas element.
 * @param ctx - The 2D rendering context.
 * @param displayWidth - The new CSS width of the canvas.
 * @param displayHeight - The new CSS height of the canvas.
 * @returns The device pixel ratio.
 */
export const configureCanvasDPI = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  displayWidth: number,
  displayHeight: number
): number => {
  const dpr = window.devicePixelRatio || 1;

  // Ensure the canvas backing store (physical pixels) matches the CSS display size
  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    // Resize the backing store to account for the device pixel ratio
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }

  return dpr;
};