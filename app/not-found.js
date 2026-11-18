import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button.js";
import { Card } from "@/components/ui/Card.js";

export default function NotFound() {
  return (
    <div className="ncc-ambient-glow flex min-h-screen items-center justify-center bg-bg px-4 text-fg">
      <Card className="w-full max-w-[460px] border-t-2 border-t-primary p-8 text-center">
        <div className="mb-4 flex justify-center">
          <Image
            src="/brand/ncc-logo.png"
            alt="NCC_DSA logo"
            width={48}
            height={48}
            className="size-12 rounded-[4px] object-cover ring-1 ring-white/15"
            priority
          />
        </div>
        <p className="m-0 font-mono text-xs font-semibold tracking-widest text-primary uppercase">Error 404</p>
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
