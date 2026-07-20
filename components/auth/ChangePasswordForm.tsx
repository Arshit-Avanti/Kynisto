"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

export function ChangePasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const next = String(form.get("newPassword") ?? "");
    if (next !== String(form.get("confirmPassword") ?? "")) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await apiFetch<{ redirectTo: string }>("/api/auth/change-password", {
        method: "POST",
        json: { currentPassword: form.get("currentPassword"), newPassword: next },
      });
      router.replace(result.redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <div className="securityNotice"><b>First-login protection</b><span>The temporary administrator password must be replaced before the dashboard is unlocked.</span></div>
      <label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></label>
      <label><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="8+ characters, including a letter and number" /></label>
      <label><span>Confirm new password</span><input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
      {error && <p className="authError" role="alert">{error}</p>}
      <button className="authSubmit" type="submit" disabled={busy}>{busy ? "Securing account…" : "Change password and continue"}</button>
    </form>
  );
}
