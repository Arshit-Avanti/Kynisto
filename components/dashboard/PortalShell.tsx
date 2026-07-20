"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { signOutSupabaseBrowser } from "@/lib/supabase-browser";
import type { SessionUser, UserRole } from "@/lib/auth";

const navByRole: Record<UserRole, { label: string; icon: string; tab?: string; badge?: "chat" }[]> = {
  admin: [
    { label: "Dashboard", icon: "◫", tab: "overview" },
    { label: "Users", icon: "◎", tab: "users" },
    { label: "Shop owners", icon: "♙", tab: "owners" },
    { label: "Customers", icon: "◉", tab: "customers" },
    { label: "Stores", icon: "⌂", tab: "stores" },
    { label: "Products", icon: "◇", tab: "products" },
    { label: "Orders", icon: "▤", tab: "orders" },
    { label: "Categories", icon: "▦", tab: "categories" },
    { label: "Reviews", icon: "★", tab: "reviews" },
    { label: "Reports", icon: "!", tab: "reports" },
    { label: "Analytics", icon: "↗", tab: "analytics" },
    { label: "Healthcare queues", icon: "+", tab: "healthcare" },
    { label: "Notifications", icon: "◌", tab: "notifications" },
    { label: "Advertisements", icon: "▭", tab: "banners" },
    { label: "Promotions", icon: "%", tab: "coupons" },
    { label: "Support", icon: "?", tab: "support" },
    { label: "Chat center", icon: "✉", tab: "chat", badge: "chat" },
    { label: "Settings", icon: "⚙", tab: "settings" },
    { label: "Activity logs", icon: "≡", tab: "audit" },
    { label: "Security", icon: "◆", tab: "security" },
  ],
  store_owner: [
    { label: "Overview", icon: "◫", tab: "overview" },
    { label: "Profile & categories", icon: "⌂", tab: "profile" },
    { label: "Media", icon: "▧", tab: "media" },
    { label: "Products", icon: "◇", tab: "products" },
    { label: "Inventory", icon: "▦", tab: "inventory" },
    { label: "Orders", icon: "▤", tab: "orders" },
    { label: "Customers", icon: "◎", tab: "customers" },
    { label: "Sales analytics", icon: "↗", tab: "sales" },
    { label: "Services", icon: "✦", tab: "services" },
    { label: "Offers", icon: "%", tab: "offers" },
    { label: "Coupons", icon: "#", tab: "coupons" },
    { label: "Reviews", icon: "★", tab: "reviews" },
    { label: "Analytics", icon: "↗", tab: "analytics" },
    { label: "Live Queue", icon: "+", tab: "healthcare" },
    { label: "Notifications", icon: "◌", tab: "notifications" },
    { label: "Settings", icon: "⚙", tab: "settings" },
    { label: "Support", icon: "?", tab: "support" },
    { label: "Messages", icon: "✉", tab: "chat", badge: "chat" },
  ],
  customer: [
    { label: "My account", icon: "◎", tab: "overview" },
    { label: "Profile", icon: "◉", tab: "profile" },
    { label: "Addresses", icon: "⌖", tab: "addresses" },
    { label: "Saved places", icon: "♥", tab: "favorites" },
    { label: "Wishlist", icon: "♡", tab: "wishlist" },
    { label: "Cart", icon: "▤", tab: "cart" },
    { label: "Orders", icon: "▦", tab: "orders" },
    { label: "My reviews", icon: "★", tab: "reviews" },
    { label: "Notifications", icon: "◌", tab: "notifications" },
    { label: "Settings", icon: "⚙", tab: "settings" },
    { label: "Support", icon: "?", tab: "support" },
    { label: "Messages", icon: "✉", tab: "chat", badge: "chat" },
  ],
};

export function PortalShell({
  user,
  workspaceRole,
  children,
}: {
  user: SessionUser;
  workspaceRole?: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const activeWorkspaceRole = workspaceRole ?? user.role;
  const nav = useMemo(() => navByRole[activeWorkspaceRole], [activeWorkspaceRole]);

  useEffect(() => {
    setDark(window.localStorage.getItem("kynisto-portal-theme") === "dark");
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = () => apiFetch<{ unreadConversations: number }>("/api/chat?view=badge")
      .then((result) => { if (mounted) setChatUnread(result.unreadConversations); })
      .catch(() => undefined);
    void refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [active]);

  function toggleTheme() {
    setDark((current) => {
      window.localStorage.setItem("kynisto-portal-theme", current ? "light" : "dark");
      return !current;
    });
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", json: {} });
    } finally {
      await signOutSupabaseBrowser().catch(() => undefined);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className={`portal ${dark ? "portalDark" : ""}`}>
      <aside className={`portalSidebar ${open ? "isOpen" : ""}`} style={{ overflowY: "auto" }}>
        <Link className="portalBrand" href="/"><KynistoLogo /></Link>
        <div className="portalRole"><small>Workspace</small><strong>{activeWorkspaceRole === "admin" ? (user.isSuperAdmin ? "Super Administration" : "Administration") : activeWorkspaceRole === "store_owner" ? `${user.role === "admin" ? "Admin · " : ""}Shop owner` : `${user.role === "admin" ? "Admin · " : ""}Customer account`}</strong></div>
        <nav>
          {nav.map((item) => (
            <Link key={item.tab} href={`${pathname}?tab=${item.tab}`} className={active === item.tab ? "active" : ""} onClick={() => setOpen(false)}>
              <span aria-hidden="true">{item.icon}</span>{item.label}{item.badge === "chat" && chatUnread > 0 && <i className="navBadge">{chatUnread > 99 ? "99+" : chatUnread}</i>}
            </Link>
          ))}
        </nav>
        <div className="portalSidebarFooter">
          {user.role === "admin" && <>
            <Link href="/admin"><span>◫</span> Admin workspace</Link>
            <Link href="/owner"><span>⌂</span> Shop owner tools</Link>
            <Link href="/account"><span>◎</span> Customer tools</Link>
          </>}
          <Link href="/"><span>←</span> Public site</Link>
          <button type="button" onClick={logout}><span>↪</span> Log out</button>
        </div>
      </aside>
      {open && <button className="portalBackdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <section className="portalMain">
        <header className="portalHeader">
          <button className="mobileMenu" type="button" aria-label="Open navigation" onClick={() => setOpen(true)}>☰</button>
          <div><small>DLF Ankur Vihar · Kynisto</small><strong>{nav.find((item) => item.tab === active)?.label ?? "Dashboard"}</strong></div>
          <div className="portalHeaderActions"><button type="button" onClick={toggleTheme} aria-label="Toggle dark mode">{dark ? "☀" : "◐"}</button><span className="userAvatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : user.name.slice(0, 1).toUpperCase()}</span><span className="userMeta"><b>{user.name}</b><small>{user.email}</small></span></div>
        </header>
        <div className="portalContent">{children}</div>
      </section>
    </div>
  );
}
