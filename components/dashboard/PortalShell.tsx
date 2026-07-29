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
  Briefcase
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
    { label: "Support", icon: HelpCircle, tab: "support" },
    { label: "Messages", icon: MessageSquare, tab: "chat", badge: "chat" },
  ],
  customer: [
    { label: "My account", icon: User, tab: "overview" },
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
  const activeWorkspaceRole = workspaceRole ?? user.role;
  const nav = useMemo(() => navByRole[activeWorkspaceRole], [activeWorkspaceRole]);

  useEffect(() => {
    setDark(window.localStorage.getItem("kynisto_theme") !== "light");
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
      window.localStorage.setItem("kynisto_theme", current ? "light" : "dark");
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
    <div className={`portal portalShell ${dark ? "dark-theme" : "light-theme"}`}>
      <aside className={`portalSidebar ${open ? "isOpen" : ""}`} style={{ overflowY: "auto" }}>
        <Link className="portalBrand" href="/"><KynistoLogo /></Link>
        <div className="portalRole"><small>Workspace</small><strong>{activeWorkspaceRole === "admin" ? (user.isSuperAdmin ? "Super Administration" : "Administration") : activeWorkspaceRole === "store_owner" ? `${user.role === "admin" ? "Admin · " : ""}Shop owner` : `${user.role === "admin" ? "Admin · " : ""}Customer account`}</strong></div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.tab} href={`${pathname}?tab=${item.tab}`} className={active === item.tab ? "active" : ""} onClick={() => setOpen(false)}>
                <span aria-hidden="true" className="mr-2"><Icon size={18} /></span>{item.label}{item.badge === "chat" && chatUnread > 0 && <i className="navBadge">{chatUnread > 99 ? "99+" : chatUnread}</i>}
              </Link>
            );
          })}
        </nav>
        <div className="portalSidebarFooter">
          {user.role === "admin" && <>
            <Link href="/admin"><span className="mr-2"><LayoutDashboard size={18} /></span> Admin workspace</Link>
            <Link href="/owner"><span className="mr-2"><Store size={18} /></span> Shop owner tools</Link>
            <Link href="/account"><span className="mr-2"><User size={18} /></span> Customer tools</Link>
          </>}
          <Link href="/"><span className="mr-2"><ChevronLeft size={18} /></span> Public site</Link>
          <button type="button" onClick={logout}><span className="mr-2"><LogOut size={18} /></span> Log out</button>
        </div>
      </aside>
      {open && <button className="portalBackdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <section className="portalMain">
        <header className="portalHeader">
          <button className="mobileMenu" type="button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={24} /></button>
          <div><small>DLF Ankur Vihar · Kynisto</small><strong>{nav.find((item) => item.tab === active)?.label ?? "Dashboard"}</strong></div>
          <div className="portalHeaderActions">
            <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <span className="userAvatar">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <User size={20} />}
            </span>
            <span className="userMeta"><b>{user.name}</b><small>{user.email}</small></span>
          </div>
        </header>
        <div className="portalContent">{children}</div>
      </section>
    </div>
  );
}
