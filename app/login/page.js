"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout.js";
import { Card } from "@/components/ui/Card.js";
import { Field } from "@/components/ui/Field.js";
import { Button } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { OtpInput } from "@/components/ui/OtpInput.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyTwoFactor, store } = usePlatform();

  const [email, setEmail] = useState("ibrahim.kedir@ncc.edu");
  const [password, setPassword] = useState("studentpass123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [otp, setOtp] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!email.trim() || !email.includes("@")) {
      nextFieldErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextFieldErrors.password = "Enter your password.";
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      setError(res.error);
      return;
    }
    if (res.requiresTwoFactor) {
      setTwoFactorStep(true);
      return;
    }
    if (res.user.status === "restricted") {
      router.push("/restricted");
    } else if (res.user.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await verifyTwoFactor(otp);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/admin");
  }

  return (
    <AuthLayout
      headline="Individual practice and Group competition on one platform."
      subhead="Sign in to access your lectures, live attendance sessions, practice progress, team workspace, and Codeforces standings."
    >
      <Card className="p-6">
        {!twoFactorStep ? (
          <>
            <h2 className="m-0 text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 mb-5 text-sm text-fg-2">Use your NCC_DSA account credentials.</p>

            {error ? (
              <Callout tone="danger" role="alert" title="Sign in failed" className="mb-4">
                {error}
              </Callout>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Field
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                placeholder="name@ncc.edu"
              />

              <div className="relative">
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  placeholder="Enter your password"
                  className="[&_input]:pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-[29px] right-2 grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-sunken hover:text-fg"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
                </button>
              </div>

              <Button type="submit" block loading={loading}>
                Sign in
              </Button>
            </form>

            <div className="mt-5 border-t border-border pt-4">
              <p className="m-0 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                Quick-fill sample credentials
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEmail("ibrahim.kedir@ncc.edu");
                    setPassword("studentpass123");
                    setError("");
                  }}
                >
                  Student (Ibrahim)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEmail("marta.alemu@ncc.edu");
                    setPassword("adminpass123");
                    setError("");
                  }}
                >
                  Admin (Marta)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEmail("liya.mekonnen@ncc.edu");
                    setPassword("studentpass123");
                    setError("");
                  }}
                >
                  Restricted (Liya)
                </Button>
              </div>
              {store.admin2faEnabled ? (
                <p className="mt-2 mb-0 text-xs text-muted">
                  Admin 2FA is active: signing in as Marta will prompt for a 6-digit authenticator code.
                </p>
              ) : null}
            </div>

            <p className="mt-4 mb-0 text-center text-sm text-fg-2">
              New to NCC_DSA?{" "}
              <Link href="/register" className="font-semibold text-primary">
                Create a student account
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <div>
              <h2 className="m-0 text-xl font-semibold tracking-tight">Two-factor verification</h2>
              <p className="mt-1 mb-0 text-sm text-fg-2">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>
            </div>

            {error ? (
              <Callout tone="danger" role="alert">
                {error}
              </Callout>
            ) : null}

            <OtpInput length={6} value={otp} onChange={setOtp} label="Authenticator verification code" error={Boolean(error)} />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={otp.length !== 6}>
                Verify &amp; continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setTwoFactorStep(false);
                  setOtp("");
                  setError("");
                }}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
}
