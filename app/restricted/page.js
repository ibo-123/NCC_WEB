"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogOut, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { ThemeToggle } from "@/components/layout/ThemeToggle.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate } from "@/lib/status.js";

export default function RestrictedPage() {
  const router = useRouter();
  const { currentUser, store, logout, switchRoleQuick } = usePlatform();

  const restrictedUser =
    currentUser?.status === "restricted"
      ? currentUser
      : store.users.find((u) => u.status === "restricted") ?? currentUser;

  return (
    <div className="ncc-ambient-glow flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10 text-fg">
      <div className="mb-4 flex w-full max-w-[540px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-fg no-underline">
          <Image
            src="/brand/ncc-logo.png"
            alt="NCC_DSA logo"
            width={34}
            height={34}
            className="size-[34px] rounded-[4px] object-cover ring-1 ring-white/15"
            priority
          />
          <div className="leading-tight">
            <span className="block font-mono text-sm font-bold tracking-tight">NCC_DSA</span>
            <span className="block text-[11px] font-medium text-muted">Night Code Club</span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[540px] border-t-2 border-t-error p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-[3px] border border-error/30 bg-error-soft text-error">
              <Lock aria-hidden="true" size={18} />
            </span>
            <div>
              <h1 className="m-0 text-xl font-semibold tracking-tight">Account restricted</h1>
              <p className="m-0 text-sm text-muted">{restrictedUser?.name ?? "Student account"}</p>
            </div>
          </div>
          <Badge tone="danger" dot>
            Restricted
          </Badge>
        </div>

        <Callout tone="danger" className="mt-4">
          {restrictedUser?.restrictedReason ||
            "Your account access has been paused pending a cohort standing review."}
        </Callout>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-[3px] border border-border bg-sunken p-4 text-sm max-[480px]:grid-cols-1">
          <div>
            <dt className="font-mono text-xs font-semibold tracking-wider text-muted uppercase">Current rating</dt>
            <dd className="m-0 mt-1 font-mono text-lg font-semibold tabular-nums">
              {restrictedUser?.rating !== null && restrictedUser?.rating !== undefined
                ? restrictedUser.rating.toFixed(2)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs font-semibold tracking-wider text-muted uppercase">Restricted since</dt>
            <dd className="m-0 mt-1 font-mono text-lg font-semibold tabular-nums">
              {formatShortDate(restrictedUser?.restrictedAt)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 mb-0 text-sm text-fg-2">
          Course materials, attendance submissions, and contests are unavailable until an administrator reopens your account.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <a
            href={`mailto:${store.restrictedContactEmail}?subject=${encodeURIComponent("NCC_DSA Account Review Request")}`}
            className="inline-flex h-10 items-center gap-2 rounded-[3px] border border-transparent [background-image:var(--brand-grad)] bg-[#083b5b] px-3.5 font-mono text-[13px] font-semibold text-white no-underline hover:brightness-110"
          >
            <Mail aria-hidden="true" size={16} />
            Contact coordinator
          </a>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut aria-hidden="true" size={16} />
            Log out
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              switchRoleQuick("u-marta");
              router.push("/admin/restricted");
            }}
          >
            Review as Admin
          </Button>
        </div>
      </Card>
    </div>
  );
}
