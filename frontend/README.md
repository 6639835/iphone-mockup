# iPhone Mockup Frontend

Next.js frontend for the iPhone Mockup Generator.

## Features

- 🎨 Clean, minimal UI with shadcn/ui
- 📱 Auto-detect iPhone model from screenshot
- 🎨 Interactive color picker
- 🖼️ Real-time preview
- ⬇️ One-click download
- 📸 Supports PNG, JPG, and HEIC formats

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (see ../backend/README.md)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local if your backend is not on localhost:8000
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production deployment to Vercel, set this in your project settings:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
4. Deploy!

### Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── mockup-generator.tsx  # Main mockup generator component
│   └── ui/                   # shadcn/ui components
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format files with Prettier
- `npm run format:check` - Check formatting with Prettier

## API Integration

The frontend communicates with the FastAPI backend via:

- `POST /detect` - Detect iPhone model from screenshot
- `POST /generate` - Generate mockup with selected color

See the backend README for full API documentation.
