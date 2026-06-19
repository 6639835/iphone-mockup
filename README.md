# Device Mockup Generator

Generate device mockups from screenshots using a full-stack Next.js app.

Supported devices:

- **iPhone** (16 & 17 series): iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max, iPhone 17 / 17 Pro / 17 Pro Max, iPhone Air — portrait & landscape.
- **iPad**: iPad (A16), iPad mini (A17 Pro), iPad Air 11"/13" (M4), iPad Pro 11"/13" (M5) — portrait & landscape.
- **Mac laptops**: MacBook Air 13"/15" (M5), MacBook Pro 14"/16" (M5), MacBook Neo — landscape.
- **Desktops & displays**: iMac 24" (M4), Studio Display, Studio Display XDR, Apple TV 4K — landscape.

Models are detected automatically from the screenshot's native resolution. When several
devices share a resolution (e.g. iPad vs iPad Air 11"), pick the right one from the model
dropdown before processing.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```text
iphone-mockup/
├── app/        # App Router pages + API route handlers
├── components/ # UI components
├── lib/        # Detection/compositing/frame loading logic
├── frames/     # Frame image assets
└── package.json
```

## Environment

Set `FRAMES_BASE_URL` in `.env.local` if you want to load frame assets from a remote bucket.

Default:

```env
FRAMES_BASE_URL=https://pub-7ad0d44bcb4948a2a359b34d35bc8fc8.r2.dev
```

## API (Next Route Handlers)

- `GET /api`
- `GET /api/models`
- `POST /api/detect`
- `POST /api/generate`

## Deployment

Deploy this repository root as a Next.js Node.js app (for example on Vercel).
