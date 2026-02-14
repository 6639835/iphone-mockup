"""FastAPI backend for iPhone mockup generation."""

import io
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image

from core import IPHONE_MODELS, compose_mockup, detect_iphone_model, find_frame_path

app = FastAPI(title="iPhone Mockup API")

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRAMES_DIR = Path(__file__).parent / "frames"


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "iPhone Mockup API"}


@app.get("/models")
async def get_models():
    """Get all supported iPhone models and their colors."""
    models = {}
    for model_name, model_info in IPHONE_MODELS.items():
        models[model_name] = {
            "name": model_info.name,
            "resolution": model_info.resolution,
            "colors": model_info.colors,
            "series": model_info.series,
        }
    return {"models": models}


@app.post("/detect")
async def detect_model(file: UploadFile = File(...)):
    """Detect iPhone model from uploaded screenshot.

    Returns:
        - detected_model: Best match model name
        - all_matches: List of all matching models
        - colors: Available colors for detected model
        - resolution: Original image resolution
    """
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Convert HEIC to RGB if needed
        if image.format == "HEIF" or file.filename.lower().endswith((".heic", ".heif")):
            image = image.convert("RGB")

        # Detect model
        detected_model, all_matches = detect_iphone_model(image)

        if not detected_model:
            raise HTTPException(
                status_code=400,
                detail="Could not detect iPhone model. Please ensure your screenshot matches iPhone 16 or 17 series dimensions.",
            )

        model_info = IPHONE_MODELS[detected_model]

        return {
            "detected_model": detected_model,
            "all_matches": all_matches,
            "colors": model_info.colors,
            "resolution": image.size,
            "series": model_info.series,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/generate")
async def generate_mockup(
    file: UploadFile = File(...),
    model: str = Form(None),
    color: str = Form(None),
    orientation: Literal["Portrait", "Landscape"] = Form("Portrait"),
):
    """Generate iPhone mockup.

    Args:
        file: Screenshot image file
        model: iPhone model name (auto-detected if not provided)
        color: Device color (required)
        orientation: Frame orientation (Portrait or Landscape)

    Returns:
        PNG image of the composed mockup
    """
    try:
        # Validate inputs
        if not color:
            raise HTTPException(status_code=400, detail="Color is required")

        # Read and process image
        contents = await file.read()
        screenshot = Image.open(io.BytesIO(contents))

        # Convert HEIC to RGB if needed
        if screenshot.format == "HEIF" or file.filename.lower().endswith(
            (".heic", ".heif")
        ):
            screenshot = screenshot.convert("RGB")

        # Detect model if not provided
        if not model:
            detected_model, _ = detect_iphone_model(screenshot)
            if not detected_model:
                raise HTTPException(
                    status_code=400, detail="Could not detect iPhone model"
                )
            model = detected_model

        # Validate model and color
        if model not in IPHONE_MODELS:
            raise HTTPException(status_code=400, detail=f"Invalid model: {model}")

        model_info = IPHONE_MODELS[model]
        if color not in model_info.colors:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid color '{color}' for {model}. Available: {model_info.colors}",
            )

        # Find frame file
        frame_path = find_frame_path(FRAMES_DIR, model, color, orientation)
        if not frame_path:
            raise HTTPException(
                status_code=404,
                detail=f"Frame not found: {model} - {color} - {orientation}",
            )

        # Load frame and compose
        frame = Image.open(frame_path)
        composed = compose_mockup(frame, screenshot)

        # Return as PNG stream
        output = io.BytesIO()
        composed.save(output, format="PNG")
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="image/png",
            headers={
                "Content-Disposition": f'attachment; filename="mockup-{model}-{color}.png"'
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mockup: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
