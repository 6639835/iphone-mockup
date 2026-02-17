# iPhone Mockup Generator

Generate iPhone device mockups from screenshots using a full-stack Next.js app.

## Quick Start

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```text
iphone-mockup/
├── frontend/   # Next.js app (UI + API routes)
├── frames/     # Frame image assets
└── LICENSE
```

## Environment

Set `FRAMES_BASE_URL` in `frontend/.env.local` if you want to load frame assets from a remote bucket.

Default:

```env
FRAMES_BASE_URL=https://pub-7ad0d44bcb4948a2a359b34d35bc8fc8.r2.dev
```

## API (Next Route Handlers)

- `GET /api`
- `GET /api/models`
- `POST /api/detect`
- `POST /api/generate`

See `frontend/README.md` for detailed usage.
