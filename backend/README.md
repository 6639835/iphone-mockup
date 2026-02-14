# iPhone Mockup Backend

FastAPI backend service for generating iPhone mockups.

## Setup

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Run Development Server

```bash
# From backend directory
python main.py

# Or with auto-reload
uvicorn main:app --reload --port 8000
```

## API Endpoints

### `GET /`
Health check endpoint.

### `GET /models`
Get all supported iPhone models and their available colors.

**Response:**
```json
{
  "models": {
    "iPhone 16": {
      "name": "iPhone 16",
      "resolution": [1179, 2556],
      "colors": ["Black", "Pink", "Teal", "Ultramarine", "White"],
      "series": "16"
    },
    ...
  }
}
```

### `POST /detect`
Detect iPhone model from uploaded screenshot.

**Request:** `multipart/form-data`
- `file`: Image file (PNG, JPG, HEIC)

**Response:**
```json
{
  "detected_model": "iPhone 17",
  "all_matches": ["iPhone 17", "iPhone 16 Pro"],
  "colors": ["Black", "Lavender", "Mist Blue", "Sage", "White"],
  "resolution": [1206, 2622],
  "series": "17"
}
```

### `POST /generate`
Generate iPhone mockup image.

**Request:** `multipart/form-data`
- `file`: Screenshot image file
- `model`: iPhone model name (optional, auto-detected)
- `color`: Device color (required)
- `orientation`: "Portrait" or "Landscape" (default: "Portrait")

**Response:** PNG image file

## Deployment

### Railway / Render

Create `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Variables

- `PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Comma-separated list of allowed origins (for production)
