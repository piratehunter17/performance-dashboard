/**
 * Configures a canvas for high-DPI displays.
 * This should be called every time the canvas is resized.
 * @param canvas - The canvas element.
 * @param ctx - The 2D rendering context.
 * @returns The device pixel ratio.
 */
export const configureCanvasDPI = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): number => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set the display size (CSS pixels)
  const displayWidth = Math.floor(rect.width);
  const displayHeight = Math.floor(rect.height);

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    // Set the actual backing store size (physical pixels)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Scale the context to match
    ctx.scale(dpr, dpr);
  }

  // Set the CSS size
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  return dpr;
};