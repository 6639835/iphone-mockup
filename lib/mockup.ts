import sharp from "sharp";

import type { ScreenRect } from "@/lib/devices";

const DEFAULT_LEFT_INSET = 0.05;
const DEFAULT_RIGHT_INSET = 0.05;
const DEFAULT_TOP_INSET = 0.025;
const DEFAULT_BOTTOM_INSET = 0.025;
const DEFAULT_RADIUS = 0.1;

function roundedRectMaskSvg(width: number, height: number, radius: number): Buffer {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white" />
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Composites a screenshot into a device frame.
 *
 * When `screen` is provided (laptop frames), the screenshot is placed at that exact
 * pixel rectangle. Otherwise it falls back to the fractional insets that fit every
 * iPhone frame.
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
  let radiusPx: number;

  if (screen) {
    left = screen.left;
    top = screen.top;
    viewportWidth = screen.width;
    viewportHeight = screen.height;
    radiusPx = screen.radius;
  } else {
    left = Math.round(frameWidth * DEFAULT_LEFT_INSET);
    const right = frameWidth - Math.round(frameWidth * DEFAULT_RIGHT_INSET);
    top = Math.round(frameHeight * DEFAULT_TOP_INSET);
    const bottom = frameHeight - Math.round(frameHeight * DEFAULT_BOTTOM_INSET);
    viewportWidth = right - left;
    viewportHeight = bottom - top;
    radiusPx = Math.round(Math.min(viewportWidth, viewportHeight) * DEFAULT_RADIUS);
  }

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    throw new Error("Invalid screen geometry: viewport has non-positive size");
  }

  radiusPx = Math.max(
    0,
    Math.min(radiusPx, Math.floor(Math.min(viewportWidth, viewportHeight) / 2))
  );

  const fittedScreenshot = await sharp(screenshotBuffer)
    .rotate()
    .ensureAlpha()
    .resize(viewportWidth, viewportHeight, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  let screenshotInput = fittedScreenshot;
  if (radiusPx > 0) {
    screenshotInput = await sharp(fittedScreenshot)
      .composite([
        {
          input: roundedRectMaskSvg(viewportWidth, viewportHeight, radiusPx),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();
  }

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
