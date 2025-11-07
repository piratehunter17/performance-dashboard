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
  // Reads the size React has set in the 'style' prop
  const rect = canvas.getBoundingClientRect(); 

  const displayWidth = Math.floor(rect.width);
  const displayHeight = Math.floor(rect.height);

  // Check if the canvas backing store size matches the display size
  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    // Set the backing store size (physical pixels)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // Reset the transform to prevent cumulative scaling
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return dpr;
};