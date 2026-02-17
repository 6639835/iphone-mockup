# iPhone Mockup (Next.js Full-Stack)

This app is now fully implemented in Next.js (App Router) with server-side image generation in Route Handlers.

## Features

- Upload screenshot and auto-detect iPhone model
- Select device color and generate mockup server-side
- Download generated PNG
- Supports PNG/JPG/HEIC inputs

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
cp .env.local.example .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

## Environment Variables

`FRAMES_BASE_URL` (optional): base URL for frame assets.

Default:

```env
FRAMES_BASE_URL=https://pub-7ad0d44bcb4948a2a359b34d35bc8fc8.r2.dev
```

If unset, the app also attempts local frame paths:

- `frontend/public/frames/...`
- `../frames/...` (useful in this monorepo)

## API Endpoints (Next Route Handlers)

- `GET /api` - Health check
- `GET /api/models` - Supported models and colors
- `POST /api/detect` - Detect model from uploaded screenshot (`multipart/form-data`, field `file`)
- `POST /api/generate` - Generate mockup (`file`, `model?`, `color`, `orientation?`)

## Deployment

Deploy the `frontend` directory as a Node.js Next.js app (for example on Vercel).

Note: static export mode is disabled because image generation runs server-side.
