"""iPhone model definitions and detection logic."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from PIL import Image


@dataclass
class IPhoneModel:
    """iPhone model specification."""

    name: str
    resolution: tuple[int, int]  # (width, height) in portrait
    colors: list[str]
    series: str


# iPhone 16 and 17 series models
IPHONE_MODELS = {
    # iPhone 16 Series
    "iPhone 16": IPhoneModel(
        name="iPhone 16",
        resolution=(1179, 2556),
        colors=["Black", "Pink", "Teal", "Ultramarine", "White"],
        series="16",
    ),
    "iPhone 16 Plus": IPhoneModel(
        name="iPhone 16 Plus",
        resolution=(1290, 2796),
        colors=["Black", "Pink", "Teal", "Ultramarine", "White"],
        series="16",
    ),
    "iPhone 16 Pro": IPhoneModel(
        name="iPhone 16 Pro",
        resolution=(1206, 2622),
        colors=["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
        series="16",
    ),
    "iPhone 16 Pro Max": IPhoneModel(
        name="iPhone 16 Pro Max",
        resolution=(1320, 2868),
        colors=["Black Titanium", "Desert Titanium", "Natural Titanium", "White Titanium"],
        series="16",
    ),
    # iPhone 17 Series
    "iPhone 17": IPhoneModel(
        name="iPhone 17",
        resolution=(1206, 2622),
        colors=["Black", "Lavender", "Mist Blue", "Sage", "White"],
        series="17",
    ),
    "iPhone Air": IPhoneModel(
        name="iPhone Air",
        resolution=(1242, 2700),
        colors=["Cloud White", "Light Gold", "Midnight", "Natural Silver", "Starlight"],
        series="17",
    ),
    "iPhone 17 Pro": IPhoneModel(
        name="iPhone 17 Pro",
        resolution=(1206, 2622),
        colors=["Cosmic Orange", "Deep Blue", "Midnight Titanium", "Sahara Gold"],
        series="17",
    ),
    "iPhone 17 Pro Max": IPhoneModel(
        name="iPhone 17 Pro Max",
        resolution=(1320, 2868),
        colors=["Cosmic Orange", "Deep Blue", "Midnight Titanium", "Sahara Gold"],
        series="17",
    ),
}


def detect_iphone_model(
    image: Image.Image, prefer_series: str = "17"
) -> tuple[Optional[str], list[str]]:
    """Detect iPhone model based on image dimensions.

    Returns tuple of (best_match, all_matches).
    Handles both portrait and landscape orientations.
    """
    width, height = image.size

    # Normalize to portrait (width < height)
    if width > height:
        width, height = height, width

    # First pass: Find exact dimension matches
    exact_matches = []
    for model_name, model in IPHONE_MODELS.items():
        expected_w, expected_h = model.resolution

        # Check for exact match
        if width == expected_w and height == expected_h:
            exact_matches.append((model_name, 0, model.series))
            continue

        # Check for proportional scaling
        scale_w = width / expected_w
        scale_h = height / expected_h

        if abs(scale_w - scale_h) / max(scale_w, scale_h) < 0.001:
            exact_matches.append((model_name, abs(scale_w - 1.0), model.series))

    if exact_matches:
        exact_matches.sort(key=lambda x: x[1])
        best_score = exact_matches[0][1]
        similar_matches = [m for m in exact_matches if abs(m[1] - best_score) < 0.001]

        if len(similar_matches) > 1:
            preferred = [m for m in similar_matches if m[2] == prefer_series]
            best_match = preferred[0][0] if preferred else similar_matches[0][0]
        else:
            best_match = exact_matches[0][0]

        all_match_names = [m[0] for m in exact_matches]
        return best_match, all_match_names

    # Second pass: Aspect ratio matching
    aspect_ratio = height / width
    ratio_matches = []

    for model_name, model in IPHONE_MODELS.items():
        expected_w, expected_h = model.resolution
        expected_ratio = expected_h / expected_w
        ratio_diff = abs(aspect_ratio - expected_ratio) / expected_ratio

        if ratio_diff < 0.005:
            ratio_matches.append((model_name, ratio_diff, model.series))

    if not ratio_matches:
        return None, []

    ratio_matches.sort(key=lambda x: x[1])
    best_score = ratio_matches[0][1]
    similar_matches = [m for m in ratio_matches if abs(m[1] - best_score) < 0.0001]

    if len(similar_matches) > 1:
        preferred = [m for m in similar_matches if m[2] == prefer_series]
        best_match = preferred[0][0] if preferred else similar_matches[0][0]
    else:
        best_match = ratio_matches[0][0]

    all_match_names = [m[0] for m in ratio_matches]
    return best_match, all_match_names
