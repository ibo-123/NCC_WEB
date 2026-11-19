"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Card } from "@/components/ui/Card.js";
import { Badge } from "@/components/ui/Badge.js";
import { Field } from "@/components/ui/Field.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { OtpInput } from "@/components/ui/OtpInput.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

const QR_BITS = [
  1,1,1,0,1,0,1,1,1,
  1,0,1,0,0,1,1,0,1,
  1,1,1,0,1,0,1,1,1,
  0,0,0,1,0,1,0,0,0,
  1,0,1,1,1,0,1,0,1,
  0,1,0,0,1,0,0,1,0,
  1,1,1,0,1,1,1,0,1,
  1,0,1,0,0,1,0,1,0,
  1,1,1,0,1,0,1,1,1,
];

export default function AdminTwoFactorPage() {
  const { store, currentUser, setupTwoFactor, enrollTwoFactor } = usePlatform();
  const [step, setStep] = useState(1); // 1 = password verify, 2 = scan + OTP confirm
  const [password, setPassword] = useState("");
  const [setupData, setSetupData] = useState({ secret: "", otpauthUri: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enrolled = Boolean(store.admin2faEnabled && currentUser?.twoFactorEnabled);

  async function handlePasswordStep(e) {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Enter your current admin password to begin 2FA setup.");
      return;
    }
    setLoading(true);
    const res = await setupTwoFactor(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSetupData({ secret: res.secret, otpauthUri: res.otpauthUri });
    setPassword("");
    setStep(2);
  }

  async function handleConfirmOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await enrollTwoFactor(otp);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOtp("");
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Two-factor authentication" }]}
    >
      <PageHeader
        title="Admin Two-Factor Authentication"
        description="Protect administrator sign-ins with a 6-digit TOTP authenticator app."
      />

      <Card className="max-w-[600px]">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" size={18} className="text-primary" />
            <h2 className="m-0 text-base font-semibold">Authenticator enrollment</h2>
          </div>
          <Badge tone={enrolled ? "success" : "warning"} dot>
            {enrolled ? "Enabled" : "Not enrolled"}
          </Badge>
        </div>

        {enrolled ? (
          <div className="mt-4 flex flex-col gap-3">
            <Callout tone="ok" title="Two-factor authentication is active">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" size={15} />
                Your administrator account now requires a 6-digit TOTP code on sign-in.
              </span>
            </Callout>
            <p className="m-0 text-xs text-muted">
              Per platform security policy (B19), 2FA cannot be self-disabled from the console once enrolled.
            </p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handlePasswordStep} className="mt-4 flex flex-col gap-4">
            <p className="m-0 text-sm text-fg-2">
              Confirm your current password before generating a new authenticator setup key.
            </p>
            {error ? <Callout tone="danger" role="alert">{error}</Callout> : null}
            <Field
              label="Current admin password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (e.g. adminpass123)"
            />
            <div>
              <Button type="submit" loading={loading}>
                Continue to QR setup
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmOtp} className="mt-4 flex flex-col gap-4">
            <p className="m-0 text-sm text-fg-2">
              Enter this manual secret or URI into your authenticator app, then enter the generated 6-digit code to verify enrollment.
            </p>

            <div className="flex flex-wrap items-center gap-5 rounded-[3px] border border-border bg-sunken p-4">
              <div
                aria-label="Authenticator QR matrix"
                className="grid grid-cols-9 gap-[3px] rounded-[3px] bg-white p-3"
              >
                {QR_BITS.map((bit, i) => (
                  <span
                    key={i}
                    className={`block size-3 ${bit ? "bg-[#0c1117]" : "bg-transparent"}`}
                  />
                ))}
              </div>
              <div className="min-w-[180px] flex-1">
                <span className="block text-xs font-semibold tracking-wider text-muted uppercase">
                  Manual Setup Key
                </span>
                <code className="mt-1 block break-all font-mono text-sm font-semibold text-fg">
                  {setupData.secret}
                </code>
                <span className="mt-1.5 block text-xs text-muted">
                  Account: {currentUser?.email ?? "admin@ncc.edu"}
                </span>
                {setupData.otpauthUri ? (
                  <span className="mt-1 block break-all font-mono text-[11px] text-muted">
                    {setupData.otpauthUri}
                  </span>
                ) : null}
              </div>
            </div>

            {error ? <Callout tone="danger" role="alert">{error}</Callout> : null}

            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              label="6-digit authenticator confirmation code"
              error={Boolean(error)}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={loading} disabled={otp.length !== 6}>
                Verify &amp; enable 2FA
              </Button>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </PlatformShell>
  );
}
