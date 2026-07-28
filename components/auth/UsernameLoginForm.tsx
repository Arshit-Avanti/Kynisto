"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

export function UsernameLoginForm({
  initialUsername,
}: {
  initialUsername?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const username = (form.get("username") as string || "").trim();
    const password = form.get("password") as string || "";

    if (!username) {
      setError("Please enter your Kynisto username.");
      setBusy(false);
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      setBusy(false);
      return;
    }

    try {
      const result = await apiFetch<{
        redirectTo: string;
        requiresPasswordChange: boolean;
      }>("/api/auth/login", {
        method: "POST",
        json: {
          username,
          password,
          rememberMe: true,
        },
      });

      window.location.assign(result.redirectTo || "/account");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Login failed. Please check your username and password.",
      );
      setBusy(false);
    }
  }

  return (
    <section className="usernameLoginSection" aria-labelledby="username-login-title">
      <div className="usernameLoginIntro">
        <span className="authKicker">Already have an account?</span>
        <h3 id="username-login-title">Sign in with Username</h3>
      </div>
      <form className="usernameLoginForm" onSubmit={submit}>
        <label>
          <span>Kynisto Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="Enter your username"
            defaultValue={initialUsername || ""}
            autoFocus={Boolean(initialUsername)}
          />
        </label>
        <label>
          <span>Password</span>
          <span className="passwordField">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              minLength={8}
              maxLength={128}
              required
              placeholder="Your password"
              autoFocus={!initialUsername}
            />
            <button
              type="button"
              className="passwordToggle"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {error && (
          <p className="authError" role="alert">
            {error}
          </p>
        )}
        <button className="authSubmit usernameLoginButton" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>
    </section>
  );
}
