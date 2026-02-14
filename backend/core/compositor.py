"""Image composition logic for creating mockups."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


DEFAULT_LEFT_INSET = 0.05
DEFAULT_RIGHT_INSET = 0.05
DEFAULT_TOP_INSET = 0.025
DEFAULT_BOTTOM_INSET = 0.025
DEFAULT_RADIUS = 0.10


def compose_mockup(
    frame: Image.Image,
    screenshot: Image.Image,
    left_inset: float = DEFAULT_LEFT_INSET,
    right_inset: float = DEFAULT_RIGHT_INSET,
    top_inset: float = DEFAULT_TOP_INSET,
    bottom_inset: float = DEFAULT_BOTTOM_INSET,
    radius: float = DEFAULT_RADIUS,
) -> Image.Image:
    """Compose screenshot with iPhone frame.

    Args:
        frame: iPhone frame image (RGBA)
        screenshot: App screenshot (will be converted to RGBA)
        left_inset: Left inset as fraction of frame width
        right_inset: Right inset as fraction of frame width
        top_inset: Top inset as fraction of frame height
        bottom_inset: Bottom inset as fraction of frame height
        radius: Corner radius as fraction of viewport size

    Returns:
        Composed RGBA image
    """
    frame = frame.convert("RGBA")
    screenshot = screenshot.convert("RGBA")

    fw, fh = frame.size

    left = round(fw * left_inset)
    right = fw - round(fw * right_inset)
    top = round(fh * top_inset)
    bottom = fh - round(fh * bottom_inset)

    viewport_w = right - left
    viewport_h = bottom - top

    if viewport_w <= 0 or viewport_h <= 0:
        raise ValueError("Invalid insets: viewport has non-positive size")

    # Fit screenshot to viewport
    fitted = ImageOps.fit(
        screenshot,
        (viewport_w, viewport_h),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )

    # Create rounded rectangle mask
    radius_px = round(min(viewport_w, viewport_h) * radius)
    radius_px = max(0, min(radius_px, min(viewport_w, viewport_h) // 2))

    mask = Image.new("L", (viewport_w, viewport_h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        (0, 0, viewport_w - 1, viewport_h - 1), radius=radius_px, fill=255
    )

    # Create screenshot layer
    screenshot_layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    screenshot_layer.paste(fitted, (left, top), mask)

    # Composite with frame
    composed = Image.alpha_composite(screenshot_layer, frame)

    return composed


def find_frame_path(
    frames_dir: Path, model_name: str, color: str, orientation: str = "Portrait"
) -> Path | None:
    """Find the frame file for given model, color and orientation."""
    model_dir = frames_dir / model_name

    if not model_dir.exists():
        return None

    frame_filename = f"{model_name} - {color} - {orientation}.png"
    frame_path = model_dir / frame_filename

    return frame_path if frame_path.exists() else None
