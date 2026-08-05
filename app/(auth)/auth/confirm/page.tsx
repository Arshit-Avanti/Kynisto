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

  return (
    <>
      <p role="status" className="sr-only">Finalizing secure login with Kynisto…</p>
      <AuthConfirmChoice hash={hash} accessToken={accessToken} />
    </>
  );
}
