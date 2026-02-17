import { MockupGenerator } from "@/components/mockup-generator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
            iPhone Mockup Generator
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            Transform your screenshots into beautiful iPhone mockups
          </p>
        </div>

        <MockupGenerator />
      </div>
    </main>
  );
}
