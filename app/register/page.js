"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout.js";
import { Card } from "@/components/ui/Card.js";
import { Field } from "@/components/ui/Field.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Callout } from "@/components/ui/Callout.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { utf8ByteLength } from "@/lib/api/endpoints.js";

export default function RegisterPage() {
  const { register, store } = usePlatform();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const nextErrors = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Enter your full name (at least 2 characters).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    const bytes = utf8ByteLength(password);
    if (bytes < 8 || bytes > 72) {
      nextErrors.password = "Password must be between 8 and 72 UTF-8 bytes.";
    }
    if (confirm !== password) {
      nextErrors.confirm = "Passwords do not match.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    window.setTimeout(() => {
      const res = register({ name, email, password });
      setLoading(false);
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) setError(res.error);
        return;
      }
      setCreatedUser(res.user);
    }, 240);
  }

  return (
    <AuthLayout
      headline="Join the NCC_DSA cohort."
      subhead="Create your student account to track topic progress, verify Codeforces solutions, join teams, and follow term ratings."
    >
      <Card className="p-6">
        {createdUser ? (
          <div className="flex flex-col items-start gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-success-soft text-up">
              <CheckCircle2 aria-hidden="true" size={22} />
            </div>
            <h2 className="m-0 text-xl font-semibold tracking-tight">Account created</h2>
            <p className="m-0 text-sm text-fg-2">
              Your student account for <strong>{createdUser.email}</strong> is ready. Sign in to link your Codeforces handle and view your dashboard.
            </p>
            <ButtonLink href="/login" block className="mt-2">
              Continue to sign in
            </ButtonLink>
          </div>
        ) : (
          <>
            <h2 className="m-0 text-xl font-semibold tracking-tight">Create student account</h2>
            <p className="mt-1 mb-5 text-sm text-fg-2">
              Register with your institutional or personal email address.
            </p>

            {!store.registrationOpen ? (
              <Callout tone="warn" title="Registration closed" className="mb-4">
                Self-registration is currently closed for this cohort. Contact a platform administrator for access.
              </Callout>
            ) : null}

            {error ? (
              <Callout tone="danger" role="alert" className="mb-4">
                {error}
              </Callout>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Field
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                placeholder="Abebe Bikila"
                disabled={!store.registrationOpen}
              />

              <Field
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                placeholder="name@ncc.edu"
                disabled={!store.registrationOpen}
              />

              <div className="relative">
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  hint={!fieldErrors.password ? "8–72 UTF-8 bytes" : undefined}
                  placeholder="Create a password"
                  disabled={!store.registrationOpen}
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

              <Field
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={fieldErrors.confirm}
                placeholder="Repeat your password"
                disabled={!store.registrationOpen}
              />

              <Button type="submit" block loading={loading} disabled={!store.registrationOpen}>
                Create account
              </Button>
            </form>

            <p className="mt-4 mb-0 text-center text-sm text-fg-2">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-primary">
                Sign in
              </Link>
            </p>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
