import { ButtonLink } from "@/components/ui/Button.js";
import { Card } from "@/components/ui/Card.js";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-fg">
      <Card className="w-full max-w-[460px] p-8 text-center">
        <p className="m-0 font-mono text-xs font-semibold tracking-widest text-muted uppercase">404</p>
        <h1 className="mt-2 mb-0 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 mb-6 text-sm text-fg-2">
          The page you requested does not exist or has moved.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/dashboard">Student dashboard</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Home
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
