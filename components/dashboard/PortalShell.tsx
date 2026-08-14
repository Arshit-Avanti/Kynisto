"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { signOutSupabaseBrowser } from "@/lib/supabase-browser";
import type { SessionUser, UserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  Crown,
  Users,
  Store,
  UserCheck,
  Building2,
  Package,
  ShoppingCart,
  Tags,
  Star,
  AlertCircle,
  TrendingUp,
  Activity,
  Bell,
  Image as ImageIcon,
  Percent,
  HelpCircle,
  MessageSquare,
  Settings,
  List,
  Shield,
  User,
  MapPin,
  Heart,
  Sun,
  Moon,
  LogOut,
  Menu,
  ChevronLeft,
  Briefcase,
  Wallet
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ElementType;
  tab?: string;
  badge?: "chat";
};

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
    { label: "Premium & Plans", icon: Crown, tab: "subscriptions" },
    { label: "Users", icon: Users, tab: "users" },
    { label: "Shop owners", icon: Store, tab: "owners" },
    { label: "Customers", icon: UserCheck, tab: "customers" },
    { label: "Stores", icon: Building2, tab: "stores" },
    { label: "Store Memberships", icon: Crown, tab: "memberships" },
    { label: "Products", icon: Package, tab: "products" },
    { label: "Orders", icon: ShoppingCart, tab: "orders" },
    { label: "Categories", icon: Tags, tab: "categories" },
    { label: "Reviews", icon: Star, tab: "reviews" },
    { label: "Reports", icon: AlertCircle, tab: "reports" },
    { label: "Analytics", icon: TrendingUp, tab: "analytics" },
    { label: "Healthcare queues", icon: Activity, tab: "healthcare" },
    { label: "Notifications", icon: Bell, tab: "notifications" },
    { label: "Advertisements", icon: ImageIcon, tab: "banners" },
    { label: "Promotions", icon: Percent, tab: "coupons" },
    { label: "Support", icon: HelpCircle, tab: "support" },
    { label: "Chat center", icon: MessageSquare, tab: "chat", badge: "chat" },
    { label: "Wallet & Rewards", icon: Wallet, tab: "wallet" },
    { label: "Settings", icon: Settings, tab: "settings" },
    { label: "Activity logs", icon: List, tab: "audit" },
    { label: "Security", icon: Shield, tab: "security" },
  ],
  store_owner: [
    { label: "Overview", icon: LayoutDashboard, tab: "overview" },
    { label: "Premium & Plans", icon: Crown, tab: "subscription" },
    { label: "Profile & categories", icon: Store, tab: "profile" },
    { label: "Media", icon: ImageIcon, tab: "media" },
    { label: "Products", icon: Package, tab: "products" },
    { label: "Inventory", icon: List, tab: "inventory" },
    { label: "Orders", icon: ShoppingCart, tab: "orders" },
    { label: "Customers", icon: Users, tab: "customers" },
    { label: "Sales analytics", icon: TrendingUp, tab: "sales" },
    { label: "Services", icon: Briefcase, tab: "services" },
    { label: "Offers", icon: Percent, tab: "offers" },
    { label: "Coupons", icon: Tags, tab: "coupons" },
    { label: "Reviews", icon: Star, tab: "reviews" },
    { label: "Analytics", icon: Activity, tab: "analytics" },
    { label: "Live Queue", icon: Users, tab: "healthcare" },
    { label: "Notifications", icon: Bell, tab: "notifications" },
    { label: "Settings", icon: Settings, tab: "settings" },
    { label: "Membership Plans", icon: Shield, tab: "memberships" },
    { label: "Support", icon: HelpCircle, tab: "support" },
    { label: "Messages", icon: MessageSquare, tab: "chat", badge: "chat" },
  ],
  customer: [
    { label: "My account", icon: User, tab: "overview" },
    { label: "Wallet & Points", icon: Wallet, tab: "wallet" },
    { label: "Premium & Plans", icon: Crown, tab: "subscription" },
    { label: "Profile", icon: UserCheck, tab: "profile" },
    { label: "Addresses", icon: MapPin, tab: "addresses" },
    { label: "Saved places", icon: Heart, tab: "favorites" },
    { label: "Wishlist", icon: Star, tab: "wishlist" },
    { label: "Cart", icon: ShoppingCart, tab: "cart" },
    { label: "Orders", icon: Package, tab: "orders" },
    { label: "My reviews", icon: MessageSquare, tab: "reviews" },
    { label: "Notifications", icon: Bell, tab: "notifications" },
    { label: "Settings", icon: Settings, tab: "settings" },
    { label: "Support", icon: HelpCircle, tab: "support" },
    { label: "Messages", icon: MessageSquare, tab: "chat", badge: "chat" },
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
  const [subPlan, setSubPlan] = useState<Record<string, any>>({ id: "free" });
  const rawRole = String(workspaceRole ?? user?.role ?? "customer");
  const activeWorkspaceRole: UserRole = (rawRole === "owner" || rawRole === "shop_owner" || rawRole === "store_owner")
    ? "store_owner"
    : (rawRole === "admin" ? "admin" : "customer");
  const nav = useMemo(() => navByRole[activeWorkspaceRole] ?? navByRole.customer ?? [], [activeWorkspaceRole]);

  useEffect(() => {
    if (activeWorkspaceRole === "store_owner") {
      apiFetch<{ plan: Record<string, any> }>("/api/subscriptions/me")
        .then((result) => {
          if (result?.plan) setSubPlan(result.plan);
        })
        .catch(() => undefined);
    }
  }, [activeWorkspaceRole]);

  useEffect(() => {
    const saved = window.localStorage.getItem("kynisto_theme") || window.localStorage.getItem("theme");
    const isDark = saved ? saved !== "light" : false;
    setDark(isDark);
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = () => apiFetch<{ unreadConversations: number }>("/api/chat?view=badge")
      .then((result) => { if (mounted) setChatUnread(result.unreadConversations); })
      .catch(() => undefined);
    void refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggleTheme() {
    setDark((current) => {
      const nextDark = !current;
      const themeVal = nextDark ? "cyberpunk" : "light";
      window.localStorage.setItem("kynisto_theme", themeVal);
      window.localStorage.setItem("theme", nextDark ? "dark" : "light");
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", themeVal);
        document.body.setAttribute("data-theme", themeVal);
      }
      return nextDark;
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

  function isOwnerTabLocked(tab: string | undefined): boolean {
    if (!tab) return false;
    const planId = String(subPlan.id ?? "free").toLowerCase();
    if (planId === "enterprise" || planId === "admin" || user.role === "admin") return false;

    switch (tab) {
      case "healthcare":
        return !subPlan.allowQueueManagement && !["starter", "pro", "enterprise"].includes(planId);
      case "analytics":
      case "sales":
        return !subPlan.allowAnalytics && !["starter", "pro", "enterprise"].includes(planId);
      case "offers":
      case "coupons":
        return !subPlan.allowPromotions && !["pro", "enterprise"].includes(planId);
      case "memberships":
        return !subPlan.allowCustomBranding && !["pro", "enterprise"].includes(planId);
      default:
        return false;
    }
  }

  return (
    <div className={`portal portalShell ${dark ? "dark-theme" : "light-theme"}`} style={{ background: dark ? "linear-gradient(135deg, #020617 0%, #0f172a 100%)" : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}>
      <aside className={`portalSidebar ${open ? "isOpen" : ""}`} style={{ overflowY: "auto", background: dark ? "rgba(15, 23, 42, 0.88)" : "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRight: dark ? "1px solid rgba(0, 240, 255, 0.15)" : "1px solid #e2e8f0", boxShadow: "0 0 30px rgba(0,0,0,0.15)" }}>
        <Link className="portalBrand" href="/" style={{ filter: dark ? "drop-shadow(0 0 10px rgba(255,255,255,0.2))" : "none" }}><KynistoLogo /></Link>
        <div className="portalRole" style={{ background: dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)", borderRadius: "12px", margin: "0 1rem" }}><small style={{ color: dark ? "#94a3b8" : "#64748b" }}>Workspace</small><strong style={{ color: dark ? "#e2e8f0" : "#0f172a", textShadow: dark ? "0 0 10px rgba(255,255,255,0.2)" : "none" }}>{activeWorkspaceRole === "admin" ? (user.isSuperAdmin ? "Super Administration" : "Administration") : activeWorkspaceRole === "store_owner" ? `${user.role === "admin" ? "Admin · " : ""}Shop owner` : `${user.role === "admin" ? "Admin · " : ""}Customer account`}</strong></div>
        <nav style={{ padding: "0 1rem" }}>
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.tab;
            const isLocked = activeWorkspaceRole === "store_owner" && isOwnerTabLocked(item.tab);
            return (
              <Link key={item.tab} href={`${pathname}?tab=${item.tab}`} className={isActive ? "active" : ""} onClick={() => setOpen(false)} style={isActive ? { background: dark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)", color: dark ? "#60a5fa" : "#2563eb", borderRadius: "12px", border: dark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.2)", boxShadow: dark ? "0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1)" : "none", textShadow: dark ? "0 0 8px rgba(96, 165, 250, 0.5)" : "none" } : { color: dark ? "#cbd5e1" : "#475569" }}>
                <span aria-hidden="true" className="mr-2"><Icon size={18} style={{ filter: isActive && dark ? "drop-shadow(0 0 5px rgba(96, 165, 250, 0.8))" : "none" }} /></span><span style={{ flex: 1 }}>{item.label}</span>{isLocked && <span style={{ marginLeft: "auto", fontSize: "14px" }} title="🔒 Premium Feature - Upgrade Required">🔒</span>}{item.badge === "chat" && chatUnread > 0 && <i className="navBadge" style={{ background: "#ef4444", boxShadow: "0 0 10px #ef4444" }}>{chatUnread > 99 ? "99+" : chatUnread}</i>}
              </Link>
            );
          })}
        </nav>
        <div className="portalSidebarFooter" style={{ borderTop: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", background: dark ? "rgba(15, 23, 42, 0.4)" : "rgba(255,255,255,0.4)" }}>
          {(user?.role === "admin" || user?.isSuperAdmin) && <>
            <Link href="/admin" style={{ color: dark ? "#cbd5e1" : "#475569" }}><span className="mr-2"><LayoutDashboard size={18} /></span> Admin workspace</Link>
            <Link href="/owner" style={{ color: dark ? "#cbd5e1" : "#475569" }}><span className="mr-2"><Store size={18} /></span> Shop owner tools</Link>
            <Link href="/account" style={{ color: dark ? "#cbd5e1" : "#475569" }}><span className="mr-2"><User size={18} /></span> Customer tools</Link>
          </>}
          <Link href="/" style={{ color: dark ? "#cbd5e1" : "#475569" }}><span className="mr-2"><ChevronLeft size={18} /></span> Public site</Link>
          <button type="button" onClick={logout} style={{ color: dark ? "#fca5a5" : "#ef4444" }}><span className="mr-2"><LogOut size={18} /></span> Log out</button>
        </div>
      </aside>
      {open && <button className="portalBackdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />}
      <section className="portalMain">
        <header className="portalHeader" style={{ background: dark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: dark ? "1px solid rgba(0, 240, 255, 0.18)" : "1px solid rgba(226, 232, 240, 0.9)", boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.08)" : "0 4px 20px rgba(0,0,0,0.04), inset 0 -1px 0 rgba(0,0,0,0.05)" }}>
          <button className="mobileMenu" type="button" aria-label="Open navigation" onClick={() => setOpen(true)} style={{ color: dark ? "#f8fafc" : "#0f172a" }}><Menu size={24} /></button>
          <div><small style={{ color: dark ? "#94a3b8" : "#64748b" }}>Your Locality · Kynisto</small><strong style={{ color: dark ? "#f8fafc" : "#0f172a" }}>{nav.find((item) => item.tab === active)?.label ?? "Dashboard"}</strong></div>
          <div className="portalHeaderActions">
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" style={{ background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: dark ? "#fbbf24" : "#475569", borderRadius: "50%", padding: "0.5rem", border: dark ? "1px solid rgba(251, 191, 36, 0.3)" : "none", boxShadow: dark ? "0 0 15px rgba(251, 191, 36, 0.2)" : "none" }}>
              {dark ? <Sun size={20} style={{ filter: "drop-shadow(0 0 5px rgba(251, 191, 36, 0.8))" }} /> : <Moon size={20} />}
            </button>
            <span className="userAvatar" style={{ border: dark ? "2px solid rgba(255,255,255,0.2)" : "2px solid rgba(0,0,0,0.1)", boxShadow: dark ? "0 0 10px rgba(255,255,255,0.1)" : "none" }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <User size={20} color={dark ? "#fff" : "#0f172a"} />}
            </span>
            <span className="userMeta"><b style={{ color: dark ? "#f8fafc" : "#0f172a" }}>{user?.name || "User"}</b><small style={{ color: dark ? "#94a3b8" : "#64748b" }}>{user?.email || ""}</small></span>
          </div>
        </header>
        <div className="portalContent">{children}</div>
      </section>
    </div>
  );
}
