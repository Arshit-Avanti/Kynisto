"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

export function AdminLoginForm({
  returnTo,
}: {
  returnTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{
        redirectTo: string;
        requiresPasswordChange: boolean;
      }>("/api/auth/login", {
        method: "POST",
        json: {
          email: form.get("email"),
          password: form.get("password"),
          rememberMe: form.get("rememberMe") === "on",
          expectedRole: "admin",
        },
      });
      const safeReturn =
        !result.requiresPasswordChange &&
        returnTo?.startsWith("/") &&
        !returnTo.startsWith("//")
          ? returnTo
          : result.redirectTo;
      router.push(safeReturn);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Administrator login failed.",
      );
      setBusy(false);
    }
  }

  return (
    <details className="adminLoginDisclosure" open>
      <summary>Administrator sign-in</summary>
      <form className="authForm adminLoginForm" onSubmit={submit}>
        <p>Protected access for Kynisto administrators only.</p>
        <label>
          <span>Admin email</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="admin@example.com"
          />
        </label>
        <label>
          <span>Password</span>
          <span className="passwordField">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              minLength={1}
              maxLength={128}
              required
              placeholder="Administrator password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        <label className="remember">
          <input type="checkbox" name="rememberMe" /> Remember me
        </label>
        {error && (
          <p className="authError" role="alert">
            {error}
          </p>
        )}
        <button className="authSubmit" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Log in as administrator"}
        </button>
      </form>
    </details>
  );
}
