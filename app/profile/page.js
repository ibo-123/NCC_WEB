"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Field } from "@/components/ui/Field.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate, statusToTone } from "@/lib/status.js";

export default function ProfilePage() {
  const { currentUser, currentTeam, updateHandles } = usePlatform();

  const [codeforces, setCodeforces] = useState(currentUser?.handles?.codeforces ?? "");
  const [leetcode, setLeetcode] = useState(currentUser?.handles?.leetcode ?? "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setCodeforces(currentUser?.handles?.codeforces ?? "");
    setLeetcode(currentUser?.handles?.leetcode ?? "");
  }, [currentUser?.id, currentUser?.handles?.codeforces, currentUser?.handles?.leetcode]);

  async function handleSave(e) {
    e.preventDefault();
    setSavedBanner(false);
    const res = await updateHandles({ codeforces, leetcode });
    if (!res.ok) {
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }
    setFieldErrors({});
    setSavedBanner(true);
  }

  return (
    <PlatformShell
      mode="student"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
    >
      <PageHeader
        title="Profile & Linked Handles"
        description="Manage your Codeforces and LeetCode usernames used across provisional checks and contest standings."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="m-0 text-lg font-semibold">{currentUser?.name ?? "Student"}</h2>
              <p className="m-0 mt-0.5 text-sm text-muted">{currentUser?.email ?? ""}</p>
            </div>
            <Badge tone={statusToTone(currentUser?.status)} dot>
              {currentUser?.status ?? "active"}
            </Badge>
          </div>

          <dl className="m-0 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Role</dt>
              <dd className="m-0 mt-1 capitalize text-fg">{currentUser?.role ?? "student"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Official Rating</dt>
              <dd className="m-0 mt-1 font-mono font-semibold text-fg tabular-nums">
                {currentUser?.rating !== null && currentUser?.rating !== undefined
                  ? currentUser.rating.toFixed(2)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Active Team</dt>
              <dd className="m-0 mt-1 text-fg">{currentTeam ? currentTeam.name : "None"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Joined</dt>
              <dd className="m-0 mt-1 text-fg-2 tabular-nums">{formatShortDate(currentUser?.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="m-0 text-base font-semibold">Linked Judge Handles</h2>
          <p className="mt-1 mb-4 text-sm text-fg-2">
            Handles are trimmed automatically and must be unique across all platform accounts.
          </p>

          {savedBanner ? (
            <Callout tone="ok" className="mb-4">
              Your linked handles have been updated.
            </Callout>
          ) : null}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Field
              label="Codeforces handle"
              value={codeforces}
              onChange={(e) => setCodeforces(e.target.value)}
              error={fieldErrors.codeforces}
              hint="Required for provisional solve checks and Codeforces contest standings."
              placeholder="e.g. ibrahimkediramdela2211"
            />

            <Field
              label="LeetCode handle"
              value={leetcode}
              onChange={(e) => setLeetcode(e.target.value)}
              error={fieldErrors.leetcode}
              hint="Optional profile reference. LeetCode automated checks are unavailable in v1."
              placeholder="e.g. ibro_man"
            />

            <div>
              <Button type="submit">
                <Save aria-hidden="true" size={15} />
                Save handles
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PlatformShell>
  );
}
