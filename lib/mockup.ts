import sharp from "sharp";

import type { ScreenRect } from "@/lib/devices";

const DEFAULT_LEFT_INSET = 0.05;
const DEFAULT_RIGHT_INSET = 0.05;
const DEFAULT_TOP_INSET = 0.025;
const DEFAULT_BOTTOM_INSET = 0.025;

/** Mark transparency connected to the canvas edge, stopping at the opaque bezel.
 * A scanline fill keeps the work linear without allocating a queue for every pixel.
 * Partially transparent exterior pixels are included so the original frame's edge
 * antialiasing/shadows remain untouched by the screenshot underneath.
 */
function findExterior(alpha: Buffer, width: number, height: number): Buffer {
  const exterior = Buffer.alloc(width * height);
  const pending: number[] = [];
  const isOpen = (index: number) => alpha[index] < 255 && exterior[index] === 0;

  function fill(seed: number) {
    if (!isOpen(seed)) return;
    pending.push(seed);
    while (pending.length) {
      const index = pending.pop()!;
      if (!isOpen(index)) continue;
      const rowStart = Math.floor(index / width) * width;
      const rowEnd = rowStart + width;
      let left = index;
      while (left > rowStart && isOpen(left - 1)) left--;
      let aboveRun = false;
      let belowRun = false;
      for (let pixel = left; pixel < rowEnd && isOpen(pixel); pixel++) {
        exterior[pixel] = 1;
        const above = rowStart > 0 && isOpen(pixel - width);
        const below = rowEnd < alpha.length && isOpen(pixel + width);
        if (above && !aboveRun) pending.push(pixel - width);
        if (below && !belowRun) pending.push(pixel + width);
        aboveRun = above;
        belowRun = below;
      }
    }
  }

  for (let x = 0; x < width; x++) {
    fill(x);
    fill((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    fill(y * width);
    fill(y * width + width - 1);
  }
  return exterior;
}

/**
 * Composites a screenshot into a device frame.
 *
 * Explicit screen rectangles control placement; older frames use fractional insets.
 * The frame's opaque bezel must enclose the screen. Exterior transparency is masked
 * out before compositing, while the bezel defines the precise inner screen edge.
 */
export async function composeMockup(
  frameBuffer: Buffer,
  screenshotBuffer: Buffer,
  screen?: ScreenRect
): Promise<Buffer> {
  const normalizedFrameBuffer = await sharp(frameBuffer).ensureAlpha().png().toBuffer();
  const frameMetadata = await sharp(normalizedFrameBuffer).metadata();
  const frameWidth = frameMetadata.width;
  const frameHeight = frameMetadata.height;

  if (!frameWidth || !frameHeight) {
    throw new Error("Invalid frame image");
  }

  let left: number;
  let top: number;
  let viewportWidth: number;
  let viewportHeight: number;

  if (screen) {
    left = screen.left;
    top = screen.top;
    viewportWidth = screen.width;
    viewportHeight = screen.height;
  } else {
    left = Math.round(frameWidth * DEFAULT_LEFT_INSET);
    const right = frameWidth - Math.round(frameWidth * DEFAULT_RIGHT_INSET);
    top = Math.round(frameHeight * DEFAULT_TOP_INSET);
    const bottom = frameHeight - Math.round(frameHeight * DEFAULT_BOTTOM_INSET);
    viewportWidth = right - left;
    viewportHeight = bottom - top;
  }

  if (
    ![left, top, viewportWidth, viewportHeight].every(Number.isInteger) ||
    left < 0 ||
    top < 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    left + viewportWidth > frameWidth ||
    top + viewportHeight > frameHeight
  ) {
    throw new Error("Invalid screen geometry: viewport must fit inside the frame");
  }

  const alpha = await sharp(normalizedFrameBuffer).extractChannel("alpha").raw().toBuffer();
  const exterior = findExterior(alpha, frameWidth, frameHeight);
  const center =
    (top + Math.floor(viewportHeight / 2)) * frameWidth + left + Math.floor(viewportWidth / 2);
  if (exterior[center]) {
    throw new Error("Invalid frame: screen opening must be enclosed by an opaque bezel");
  }
  const mask = Buffer.alloc(viewportWidth * viewportHeight * 4, 255);
  for (let y = 0; y < viewportHeight; y++) {
    for (let x = 0; x < viewportWidth; x++) {
      if (exterior[(top + y) * frameWidth + left + x]) {
        mask[(y * viewportWidth + x) * 4 + 3] = 0;
      }
    }
  }

  const fittedScreenshot = await sharp(screenshotBuffer)
    .rotate()
    .ensureAlpha()
    .resize(viewportWidth, viewportHeight, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  const screenshotInput = await sharp(fittedScreenshot)
    .composite([
      {
        input: mask,
        raw: { width: viewportWidth, height: viewportHeight, channels: 4 },
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const screenshotLayer = await sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: screenshotInput, left, top }])
    .png()
    .toBuffer();

  return sharp(screenshotLayer)
    .composite([{ input: normalizedFrameBuffer, blend: "over" }])
    .png()
    .toBuffer();
}
