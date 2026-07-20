"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/client-api";

export function ProductActions({ productId, available }: { productId: string; available: number }) {
  const [busy, setBusy] = useState<"cart" | "wishlist" | "">("");
  const [message, setMessage] = useState("");
  const [loginNeeded, setLoginNeeded] = useState(false);

  async function act(action: "add_cart" | "add_wishlist") {
    setBusy(action === "add_cart" ? "cart" : "wishlist");
    setMessage("");
    setLoginNeeded(false);
    try {
      await apiFetch("/api/customer/workspace", {
        method: "POST",
        json: { action, productId, quantity: 1 },
      });
      setMessage(action === "add_cart" ? "Added to cart" : "Saved to wishlist");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Action failed.";
      setMessage(text);
      setLoginNeeded(/log in/i.test(text));
    } finally {
      setBusy("");
    }
  }

  return <div className="productActions"><button type="button" disabled={busy !== "" || available < 1} onClick={() => void act("add_cart")}>{available < 1 ? "Out of stock" : busy === "cart" ? "Adding…" : "Add to cart"}</button><button type="button" className="soft" disabled={busy !== ""} onClick={() => void act("add_wishlist")}>{busy === "wishlist" ? "Saving…" : "♡ Wishlist"}</button>{message && <small className={loginNeeded ? "error" : ""}>{message}{loginNeeded && <> · <Link href="/login?returnTo=/account?tab=wishlist">Log in</Link></>}</small>}</div>;
}
