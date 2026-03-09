import { Spinner } from '@/components/ui/spinner';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <Spinner className="mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}
