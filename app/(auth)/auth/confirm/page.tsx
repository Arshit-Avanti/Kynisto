"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";

export default function ConfirmPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("");
  const [hash, setHash] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appMissing, setAppMissing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentHash = window.location.hash;
      setHash(currentHash);
      const params = new URLSearchParams(currentHash.replace(/^#/, "?"));
      const token = params.get("access_token");

      if (token) {
        setAccessToken(token);
      }
      
      setIsLoading(false);
    }
  }, []);

  const handleContinueInChrome = () => {
    setStatusText("Authenticating session with Kynisto…");
    setIsLoading(true);

    if (accessToken) {
      apiFetch<{ user: { role: string } | null }>("/api/auth/google/session", {
        method: "POST",
        json: { access_token: accessToken },
      })
        .then((res) => {
          const role = res?.user?.role;
          const target = role === "admin" ? "/admin" : role === "store_owner" ? "/owner" : "/account";
          window.location.replace(target);
        })
        .catch(() => {
          window.location.replace("/account");
        });
    } else {
      apiFetch<{ user: { role: string } | null }>("/api/auth/me")
        .then((res) => {
          const role = res?.user?.role;
          const target = role === "admin" ? "/admin" : role === "store_owner" ? "/owner" : "/account";
          window.location.replace(target);
        })
        .catch(() => {
          window.location.replace("/account");
        });
    }
  };

  if (isLoading && !accessToken) {
    return (
      <div className="authCard" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <div className="googleButtonSpinner" style={{ margin: "0 auto 1.5rem auto", width: "36px", height: "36px" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>{statusText}</h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.5rem" }}>
          Please wait a moment while we set up your workspace.
        </p>
      </div>
    );
  }

  if (isLoading && accessToken) {
    return (
      <div className="authCard" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <div className="googleButtonSpinner" style={{ margin: "0 auto 1.5rem auto", width: "36px", height: "36px" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>{statusText}</h2>
      </div>
    );
  }

  const intentUrl = `intent://auth/confirm${hash}#Intent;scheme=kynisto;package=com.kynisto.app;end;`;
  const fallbackUrl = `kynisto://auth/confirm${hash}`;

  const handleOpenApp = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = intentUrl;
    
    setTimeout(() => {
      window.location.href = fallbackUrl;
    }, 300);

    setTimeout(() => {
      if (!document.hidden) {
        setAppMissing(true);
      }
    }, 1500);
  };

  if (appMissing) {
    return (
      <div className="authCard" style={{ textAlign: "center", padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>App not installed on your device.</h2>
          <p style={{ color: "#64748b", fontSize: "1rem" }}>
            You can download the app or continue using the website.
          </p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <a 
            href="/Kynisto.apk"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "1rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
              boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>📥</span>
            Download Kynisto App (APK)
          </a>

          <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
            <span style={{ margin: "0 1rem", color: "#94a3b8", fontSize: "0.9rem", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
          </div>

          <button
            onClick={handleContinueInChrome}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              backgroundColor: "white",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "1rem",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "1.1rem",
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🌐</span>
            Continue on Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="authCard" style={{ textAlign: "center", padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>Login Successful!</h2>
        <p style={{ color: "#64748b", fontSize: "1rem" }}>
          Where would you like to continue?
        </p>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <a 
          href={intentUrl}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            backgroundColor: "hsl(221, 83%, 53%)",
            color: "hsl(0, 0%, 100%)",
            padding: "1rem",
            borderRadius: "0.75rem",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1.1rem",
            boxShadow: "0 4px 6px -1px hsla(221, 83%, 53%, 0.2)",
            transition: "all 0.2s"
          }}
          onClick={(e) => {
             e.preventDefault();
             window.location.href = intentUrl;
             // Fallback for when the intent doesn't fire nicely
             setTimeout(() => {
                window.location.href = fallbackUrl;
             }, 300);
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>📱</span>
          Open in App
        </a>

        <a 
          href="https://kynisto.nxt-arshit.workers.dev/downloads/Kynisto-2.0.0-release.apk"
          download
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            backgroundColor: "hsl(210, 40%, 96%)",
            color: "hsl(222, 47%, 11%)",
            border: "1px solid hsl(214, 32%, 91%)",
            padding: "1rem",
            borderRadius: "0.75rem",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1.1rem",
            transition: "all 0.2s"
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>📥</span>
          Download App APK
        </a>

        <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "hsl(214, 32%, 91%)" }}></div>
          <span style={{ margin: "0 1rem", color: "hsl(215, 16%, 65%)", fontSize: "0.9rem", fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "hsl(214, 32%, 91%)" }}></div>
        </div>

        <button
          onClick={handleContinueInChrome}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            backgroundColor: "hsl(0, 0%, 100%)",
            color: "hsl(215, 25%, 27%)",
            border: "1px solid hsl(214, 32%, 91%)",
            padding: "1rem",
            borderRadius: "0.75rem",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "1.1rem",
            transition: "all 0.2s"
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🌐</span>
          Continue on Website
        </button>
      </div>
    </div>
  );
}
