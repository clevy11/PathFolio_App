import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Pathfolio</h1>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
            <Button asChild variant="default" size="sm">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Apply smarter.{' '}
            <span className="text-primary">Track everything.</span>
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            A private assistant for job and school applications. Pathfolio finds
            opportunities, tailors your CV and cover letters to each one without
            inventing facts, applies by the best available route, and keeps a
            complete record of every application you send.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Start Building Your Profile</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="https://github.com/clevy11/PathFolio_App.git" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h3 className="mb-12 text-center text-3xl font-bold">What it does</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Find</CardTitle>
                <CardDescription>
                  Search jobs and school programs by region and role type, each with a match score and missing skills.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Tailor</CardTitle>
                <CardDescription>
                  Generate tailored CV, cover letter, email, or statement of purpose. Every change shown side-by-side for review.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Apply</CardTitle>
                <CardDescription>
                  Detects the route: email, web form, or guided steps. Pauses before Submit for your approval.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">4. Track</CardTitle>
                <CardDescription>
                  Every application saved automatically with duplicate warnings, status filters, follow-up reminders, and CSV export.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h3 className="mb-12 text-center text-3xl font-bold">Core Principles</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold">Never invent facts</h4>
              <p className="text-sm text-muted-foreground">
                No skills, jobs, degrees, dates, emails, deadlines, or requirements that aren't in your profile or the real source page.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Always show the source</h4>
              <p className="text-sm text-muted-foreground">
                Every extracted detail links back to where it came from — or says "not found".
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Human in the loop</h4>
              <p className="text-sm text-muted-foreground">
                Pathfolio pauses for your approval before anything is sent or submitted.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Everything is recorded</h4>
              <p className="text-sm text-muted-foreground">
                Manual or automatic, every application is tracked.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Private by default</h4>
              <p className="text-sm text-muted-foreground">
                Your data lives in your own database; no third-party analytics or tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>Pathfolio — Built with Next.js 15, React 18, TypeScript, Tailwind, Drizzle, OpenRouter</p>
          <p className="mt-2">
            <a href="https://github.com/clevy11/PathFolio_App.git" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              GitHub Repository
            </a>
            {' '}•{' '}
            <a href="LICENSE" className="underline hover:text-foreground">
              MIT License
            </a>
            {' '}•{' '}
            © 2026 Caleb levy Buntu
          </p>
        </div>
      </footer>
    </main>
  );
}