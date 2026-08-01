"use client";

import { useEffect, useState } from "react";
import AuthConfirmChoice from "@/components/auth/AuthConfirmChoice";

export default function ConfirmPage() {
  const [hash, setHash] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentHash = window.location.hash;
      setHash(currentHash);
      const params = new URLSearchParams(currentHash.replace(/^#/, "?"));
      const token = params.get("access_token");

      if (token) {
        setAccessToken(token);
      }
    }
  }, []);

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="googleButtonSpinner mb-4 w-10 h-10" />
        <h2 className="text-xl font-bold text-slate-200">Finalizing secure login...</h2>
        <p className="text-sm text-slate-400 mt-2">Authenticating session with Kynisto. Please wait a moment.</p>
      </div>
    );
  }

  return <AuthConfirmChoice hash={hash} accessToken={accessToken} />;
}
