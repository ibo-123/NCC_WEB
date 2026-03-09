import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Page not found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
