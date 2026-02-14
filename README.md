# iPhone Mockup Generator

Generate beautiful iPhone mockups from your screenshots with auto-detection and custom colors.

## 🌐 Web App (Recommended)

The easiest way to create mockups is through the web interface:

- ✨ Drag & drop screenshot upload
- 🎯 Auto-detect iPhone model
- 🎨 Interactive color picker
- 📸 Supports PNG, JPG, and HEIC
- ⬇️ Instant download

### Quick Start (Web)

```bash
# 1. Start the backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py

# 2. In a new terminal, start the frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
iphone-mockup/
├── frontend/              # Next.js web app (TypeScript + shadcn/ui)
├── backend/               # FastAPI service (Python)
│   ├── api/
│   ├── core/             # Mockup generation logic
│   └── frames/           # Device frames
├── create_mockup.py      # CLI tool (legacy)
├── frames/               # Original device frames
└── examples/             # Sample screenshots
```

See individual READMEs:
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway/Render)
```bash
cd backend
# Add Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT
git push
```

## 📱 Supported iPhone Models

**iPhone 16 Series**: iPhone 16, 16 Plus, 16 Pro, 16 Pro Max
**iPhone 17 Series**: iPhone 17, iPhone Air, 17 Pro, 17 Pro Max

**Auto-detects** based on screenshot dimensions:
- iPhone 16: 1179 × 2556
- iPhone 16 Plus: 1290 × 2796
- iPhone 16 Pro: 1206 × 2622
- iPhone 16 Pro Max: 1320 × 2868
- iPhone 17: 1206 × 2622
- iPhone Air: 1242 × 2700
- iPhone 17 Pro: 1206 × 2622
- iPhone 17 Pro Max: 1320 × 2868

---

## 🖥️ CLI Tool (Python)

For command-line usage, see below.

## Usage

### Auto-Detect Model & Choose Color (Recommended)

The simplest way to create a mockup for iPhone 16 or 17 series:

```bash
# Interactive mode - auto-detects model and prompts for color
python create_mockup.py --screenshot examples/screenshot.PNG

# Non-interactive mode - specify color directly
python create_mockup.py --screenshot examples/screenshot.PNG --color Black --output my-mockup.png

# Manually specify model (useful when dimensions match multiple models)
python create_mockup.py --screenshot examples/screenshot.PNG --model "iPhone 16 Pro" --color "Black Titanium"

# Landscape orientation
python create_mockup.py --screenshot examples/screenshot.PNG --orientation Landscape
```

**Supported Models:**
- **iPhone 16 Series**: iPhone 16, 16 Plus, 16 Pro, 16 Pro Max
- **iPhone 17 Series**: iPhone 17, iPhone Air, 17 Pro, 17 Pro Max

The script automatically detects which iPhone model based on your screenshot dimensions:
- iPhone 16: 1179 x 2556
- iPhone 16 Plus: 1290 x 2796
- iPhone 16 Pro: 1206 x 2622
- iPhone 16 Pro Max: 1320 x 2868
- iPhone 17: 1206 x 2622
- iPhone Air: 1242 x 2700
- iPhone 17 Pro: 1206 x 2622
- iPhone 17 Pro Max: 1320 x 2868

**Note:** Some models share the same resolution (e.g., iPhone 16 Pro and iPhone 17). By default, the script prefers iPhone 17 models. Use `--model` to manually specify.

**Available Colors by Model:**
- **iPhone 16 / 16 Plus**: Black, Pink, Teal, Ultramarine, White
- **iPhone 16 Pro / Pro Max**: Black Titanium, Desert Titanium, Natural Titanium, White Titanium
- **iPhone 17**: Black, Lavender, Mist Blue, Sage, White
- **iPhone Air**: Cloud White, Light Gold, Midnight, Natural Silver, Starlight
- **iPhone 17 Pro / Pro Max**: Cosmic Orange, Deep Blue, Midnight Titanium, Sahara Gold

### Generate All Colors for a Model

Use the demo script to generate mockups in all available colors:

```bash
# Generate all colors for iPhone 17
python demo_all_colors.py --screenshot examples/screenshot.PNG --model "iPhone 17" --output-dir mockups/

# Generate all colors for iPhone 16 Pro in landscape
python demo_all_colors.py --screenshot examples/screenshot.PNG --model "iPhone 16 Pro" --orientation Landscape --output-dir mockups/
```

### Basic Mockup Generation (Legacy)

```bash
python scripts/export_phone_png.py \
  --frame frames/iPhone\ 17/iPhone\ 17\ -\ Black\ -\ Portrait.png \
  --screenshot examples/screenshot.PNG \
  --output phone-mockup.png
```

### Advanced Composition with Custom Parameters

```bash
python export_phone_png.py \
  --frame frame.png \
  --shot screenshot.PNG \
  --out merged.png \
  --inset 3 \
  --feather 2 \
  --scale 0.99
```

### Command Line Options

**create_mockup.py (Recommended for iPhone 16/17):**
- `--screenshot`: Path to app screenshot (required)
- `--output`: Output PNG path (default: iphone-mockup.png)
- `--color`: Color name (skips interactive prompt if provided)
- `--orientation`: Portrait or Landscape (default: Portrait)

**export_phone_png.py (Legacy/Advanced):**
- `--frame`: Frame image path
- `--shot`: Screenshot image path
- `--out`: Output file path
- `--black-thresh`: Black detection threshold (default: 35)
- `--inset`: Inset pixels for screen mask (default: 3)
- `--feather`: Feather pixels for alpha blending (default: 2)
- `--scale`: Screenshot scale factor (default: 0.99)
- `--dematte`: Remove white edge artifacts
- `--hard-alpha`: Alpha cutoff for transparency (default: 12)
- `--trim`: Trim transparent borders

## Development

```bash
# Install in development mode
pip install -e .

# Run tests (if available)
pytest

# Format code
black .
```

## Requirements

- Python 3.7+
- opencv-python
- Pillow
- numpy

## License

See LICENSE file for details.