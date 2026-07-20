"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";

type Category = {
  name: string;
  icon: string;
  tone: string;
  storeCount?: number;
};

type Store = {
  id: string | number;
  slug?: string;
  name: string;
  category: string;
  icon: string;
  address: string;
  shortAddress: string;
  rating: number;
  reviews: number;
  distance: number;
  walk: string;
  open: boolean;
  hours: string;
  tone: string;
  services: string[];
};

const categories: Category[] = [
  { name: "Salon", icon: "✂", tone: "coral" },
  { name: "Grocery", icon: "◒", tone: "green" },
  { name: "Clinic", icon: "+", tone: "blue" },
  { name: "Stationery", icon: "✎", tone: "yellow" },
  { name: "Pharmacy", icon: "✚", tone: "mint" },
  { name: "Bakery", icon: "♨", tone: "peach" },
  { name: "Repair", icon: "⚙", tone: "lilac" },
  { name: "Pet care", icon: "●", tone: "sky" },
  { name: "Fitness", icon: "↔", tone: "lime" },
  { name: "Café", icon: "☕", tone: "sand" },
];

const stores: Store[] = [
  {
    id: 1,
    name: "Glow & Go Salon",
    category: "Salon",
    icon: "✂",
    address: "B-42, Main Market Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Main Market Road",
    rating: 4.8,
    reviews: 214,
    distance: 0.4,
    walk: "5 min walk",
    open: true,
    hours: "Open until 8:30 PM",
    tone: "coral",
    services: ["Haircut", "Styling", "Facial"],
  },
  {
    id: 2,
    name: "FreshBasket Grocers",
    category: "Grocery",
    icon: "◒",
    address: "MM-18, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "DLF Main Market",
    rating: 4.6,
    reviews: 389,
    distance: 0.7,
    walk: "9 min walk",
    open: true,
    hours: "Open until 10:00 PM",
    tone: "green",
    services: ["Fresh produce", "Daily needs", "Delivery"],
  },
  {
    id: 3,
    name: "Aarogya Family Clinic",
    category: "Clinic",
    icon: "+",
    address: "C-215, Shiv Chowk Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Shiv Chowk Road",
    rating: 4.9,
    reviews: 156,
    distance: 0.9,
    walk: "12 min walk",
    open: true,
    hours: "Open until 7:00 PM",
    tone: "blue",
    services: ["General care", "Pediatrics", "Diagnostics"],
  },
  {
    id: 4,
    name: "Paper Trail Stationery",
    category: "Stationery",
    icon: "✎",
    address: "A-9, Mangal Bazaar Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Mangal Bazaar Road",
    rating: 4.7,
    reviews: 98,
    distance: 1.1,
    walk: "14 min walk",
    open: false,
    hours: "Opens tomorrow at 9:00 AM",
    tone: "yellow",
    services: ["School supplies", "Printing", "Art materials"],
  },
  {
    id: 5,
    name: "WellSpring Pharmacy",
    category: "Pharmacy",
    icon: "✚",
    address: "D-33, Main Market, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Main Market",
    rating: 4.7,
    reviews: 271,
    distance: 0.6,
    walk: "8 min walk",
    open: true,
    hours: "Open 24 hours",
    tone: "mint",
    services: ["Medicines", "Wellness", "Home delivery"],
  },
  {
    id: 6,
    name: "Oven & Crumb Bakery",
    category: "Bakery",
    icon: "♨",
    address: "B-66, 25 Foota Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "25 Foota Road",
    rating: 4.8,
    reviews: 342,
    distance: 1.2,
    walk: "15 min walk",
    open: true,
    hours: "Open until 9:30 PM",
    tone: "peach",
    services: ["Fresh bread", "Cakes", "Coffee"],
  },
  {
    id: 7,
    name: "QuickFix Mobile Repair",
    category: "Repair",
    icon: "⚙",
    address: "A-401, Mangal Bazaar Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Mangal Bazaar Road",
    rating: 4.5,
    reviews: 124,
    distance: 1.4,
    walk: "18 min walk",
    open: true,
    hours: "Open until 8:00 PM",
    tone: "lilac",
    services: ["Phone repair", "Accessories", "Same-day service"],
  },
  {
    id: 8,
    name: "Paw & Whisker Pet Care",
    category: "Pet care",
    icon: "●",
    address: "C-25, Shani Bazaar Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Shani Bazaar Road",
    rating: 4.9,
    reviews: 181,
    distance: 1.6,
    walk: "20 min walk",
    open: false,
    hours: "Opens tomorrow at 8:30 AM",
    tone: "sky",
    services: ["Grooming", "Vet consult", "Pet supplies"],
  },
  {
    id: 9,
    name: "MoveWell Fitness Studio",
    category: "Fitness",
    icon: "↔",
    address: "D-77, Shiv Chowk Road, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "Shiv Chowk Road",
    rating: 4.8,
    reviews: 205,
    distance: 1.0,
    walk: "13 min walk",
    open: true,
    hours: "Open until 10:00 PM",
    tone: "lime",
    services: ["Strength", "Yoga", "Personal training"],
  },
  {
    id: 10,
    name: "Third Place Café",
    category: "Café",
    icon: "☕",
    address: "MM-4, Main Market, DLF Ankur Vihar, Loni, Ghaziabad",
    shortAddress: "DLF Main Market",
    rating: 4.6,
    reviews: 417,
    distance: 1.8,
    walk: "7 min ride",
    open: true,
    hours: "Open until 11:00 PM",
    tone: "sand",
    services: ["Coffee", "Quick bites", "Work-friendly"],
  },
];

type SortMode = "all" | "open" | "nearest" | "rated" | "newest";
type Accent = "royal" | "navy" | "cyan";
type Density = "comfortable" | "compact";
type ThemeMode = "light" | "dark";

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [saved, setSaved] = useState<Array<string | number>>([]);
  const [catalogStores, setCatalogStores] = useState<Store[]>(stores.filter((store) => !["Clinic", "Pharmacy", "Pet care"].includes(store.category)));
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(categories.filter((item) => !["Clinic", "Pharmacy", "Pet care"].includes(item.name)));
  const [catalogTotal, setCatalogTotal] = useState(stores.length);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "store_owner" | "customer" | null>(null);
  const [accent, setAccent] = useState<Accent>("royal");
  const [density, setDensity] = useState<Density>("comfortable");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [areaFilter, setAreaFilter] = useState("");
  const [pinFilter, setPinFilter] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [currentCoords, setCurrentCoords] = useState({ latitude: 28.7381, longitude: 77.2669 });
  const [locationLabel, setLocationLabel] = useState("DLF Ankur Vihar, Loni");
  const [customizing, setCustomizing] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("kynisto-preferences");
    if (!stored) return;
    try {
      const preferences = JSON.parse(stored) as {
        accent?: Accent;
        density?: Density;
        themeMode?: ThemeMode;
      };
      if (preferences.accent) setAccent(preferences.accent);
      if (preferences.density) setDensity(preferences.density);
      if (preferences.themeMode) setThemeMode(preferences.themeMode);
    } catch {
      window.localStorage.removeItem("kynisto-preferences");
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ items: Array<{ name: string; icon?: string; storeCount?: number }> }>("/api/categories"),
      apiFetch<{ user: { role: "admin" | "store_owner" | "customer" } | null }>("/api/auth/me"),
    ])
      .then(async ([categoryData, sessionData]) => {
        if (!active) return;
        const palette = ["coral", "green", "blue", "yellow", "mint", "peach", "lilac", "sky", "lime", "sand"];
        setCatalogCategories(categoryData.items.map((item, index) => ({
          name: item.name,
          icon: item.icon ?? "⌖",
          tone: palette[index % palette.length],
          storeCount: Number(item.storeCount ?? 0),
        })));
        setUserRole(sessionData.user?.role ?? null);
        if (sessionData.user?.role === "customer" || sessionData.user?.role === "admin") {
          const favoriteData = await apiFetch<{ items: Array<{ storeId: string }> }>("/api/favorites");
          if (active) setSaved(favoriteData.items.map((item) => item.storeId));
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true);
      const parameters = new URLSearchParams({
        limit: "24",
        page: "1",
        lat: String(currentCoords.latitude),
        lng: String(currentCoords.longitude),
      });
      if (query.trim()) parameters.set("q", query.trim());
      if (category !== "All") parameters.set("category", category);
      if (areaFilter.trim()) parameters.set("area", areaFilter.trim());
      if (pinFilter.trim()) parameters.set("pin", pinFilter.trim());
      if (businessTypeFilter.trim()) parameters.set("type", businessTypeFilter.trim());
      if (sortMode === "open") parameters.set("openNow", "true");
      if (sortMode === "nearest") parameters.set("sort", "nearest");
      if (sortMode === "rated") parameters.set("sort", "rated");
      if (sortMode === "newest") parameters.set("sort", "newest");
      try {
        const response = await fetch(`/api/stores?${parameters}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load nearby stores.");
        const data = await response.json() as {
          items: Array<Store & { services?: string[] }>;
          pagination: { total: number; hasMore: boolean };
        };
        setCatalogStores(data.items.map((store) => ({ ...store, services: store.services ?? [] })));
        setCatalogTotal(data.pagination.total);
        setHasMore(data.pagination.hasMore);
        setNextPage(2);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setCatalogTotal(stores.length);
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [areaFilter, businessTypeFilter, category, currentCoords, pinFilter, query, sortMode]);

  useEffect(() => {
    window.localStorage.setItem(
      "kynisto-preferences",
      JSON.stringify({ accent, density, themeMode }),
    );
  }, [accent, density, themeMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCustomizing(false);
      setSelectedStore(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = catalogStores.filter((store) => {
      const matchesCategory = category === "All" || store.category === category;
      const haystack = `${store.name} ${store.category} ${store.address} ${store.services.join(" ")}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesOpen = sortMode !== "open" || store.open;
      return matchesCategory && matchesQuery && matchesOpen;
    });

    if (sortMode === "nearest") {
      return [...filtered].sort((a, b) => a.distance - b.distance);
    }
    if (sortMode === "rated") {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    return filtered;
  }, [catalogStores, category, query, sortMode]);

  const toggleSaved = async (store: Store) => {
    if (userRole !== "customer" && userRole !== "admin") {
      window.location.assign(`/login?returnTo=${encodeURIComponent(store.slug ? `/stores/${store.slug}` : "/")}`);
      return;
    }
    const isSaved = saved.includes(store.id);
    setSaved((current) =>
      isSaved ? current.filter((id) => id !== store.id) : [...current, store.id],
    );
    setToast(isSaved ? `${store.name} removed from saved` : `${store.name} saved`);
    try {
      await apiFetch("/api/favorites", {
        method: isSaved ? "DELETE" : "POST",
        json: { storeId: String(store.id) },
      });
    } catch (error) {
      setSaved((current) => isSaved ? [...current, store.id] : current.filter((id) => id !== store.id));
      setToast(error instanceof Error ? error.message : "Could not update saved places.");
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const parameters = new URLSearchParams({
      limit: "24",
      page: String(nextPage),
      lat: String(currentCoords.latitude),
      lng: String(currentCoords.longitude),
    });
    if (query.trim()) parameters.set("q", query.trim());
    if (category !== "All") parameters.set("category", category);
    if (areaFilter.trim()) parameters.set("area", areaFilter.trim());
    if (pinFilter.trim()) parameters.set("pin", pinFilter.trim());
    if (businessTypeFilter.trim()) parameters.set("type", businessTypeFilter.trim());
    if (sortMode === "open") parameters.set("openNow", "true");
    if (["nearest", "rated", "newest"].includes(sortMode)) parameters.set("sort", sortMode);
    try {
      const data = await apiFetch<{
        items: Array<Store & { services?: string[] }>;
        pagination: { hasMore: boolean };
      }>(`/api/stores?${parameters}`);
      setCatalogStores((current) => [
        ...current,
        ...data.items.map((store) => ({ ...store, services: store.services ?? [] })),
      ]);
      setHasMore(data.pagination.hasMore);
      setNextPage((page) => page + 1);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load more places.");
    } finally {
      setLoadingMore(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToast("Location services are not supported on this device.");
      return;
    }
    setToast("Finding nearby businesses...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentCoords({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationLabel("Your current location");
        setSortMode("nearest");
        setToast("Showing businesses nearest to you.");
      },
      () => setToast("Location access was not enabled. Using DLF Ankur Vihar."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setSortMode("all");
    setAreaFilter("");
    setPinFilter("");
    setBusinessTypeFilter("");
  };

  return (
    <main className={`site theme-${accent} density-${density} mode-${themeMode}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kynisto home"><KynistoLogo showTagline /></a>

        <button className="locationPill" type="button" aria-label="Use current location" onClick={useCurrentLocation}>
          <span className="locationDot" aria-hidden="true" />
          <span>
            <small>Your locality</small>
            <strong>{locationLabel}</strong>
          </span>
          <span aria-hidden="true">⌄</span>
        </button>

        <div className="headerActions">
          <Link className="textButton accountButton" href={userRole ? "/dashboard" : "/login"}>
            {userRole ? "Dashboard" : "Log in"}
          </Link>
          <Link className="textButton accountButton" href="/products">Products</Link>
          <Link className="textButton accountButton" href="/healthcare">Healthcare</Link>
          <button
            className="textButton savedButton"
            type="button"
            onClick={() => {
              if (userRole !== "customer" && userRole !== "admin") {
                window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
                return;
              }
              setCategory("All");
              setQuery("");
              setSortMode("all");
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
              setToast(saved.length ? `${saved.length} saved place${saved.length === 1 ? "" : "s"}` : "No saved places yet");
            }}
          >
            <span aria-hidden="true">♥</span>
            Saved <b>{saved.length}</b>
          </button>
          <button className="customizeButton" type="button" onClick={() => setCustomizing(true)}>
            <span className="sliders" aria-hidden="true">☷</span>
            Customize
          </button>
          <details className="mobileNav">
            <summary aria-label="Open Kynisto navigation">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href={userRole ? "/dashboard" : "/login"}>{userRole ? "Dashboard" : "Log in"}</Link>
              <Link href="/products">Products</Link>
              <Link href="/healthcare">Healthcare</Link>
              <Link href={userRole === "customer" || userRole === "admin" ? "/account?tab=favorites" : "/login?returnTo=%2Faccount%3Ftab%3Dfavorites"}>
                Saved places
              </Link>
              <button type="button" onClick={() => setCustomizing(true)}>Customize appearance</button>
            </nav>
          </details>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <div className="eyebrow"><span aria-hidden="true">✦</span> Everything Around You, Smarter.</div>
          <h1>Kynisto</h1>
          <p className="heroTagline">Everything Around You, Smarter.</p>
          <p className="heroText">Find trusted everyday stores, exact addresses, live availability, healthcare queues, and local services in one intelligent place.</p>

          <form
            className="searchBox"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="searchIcon" aria-hidden="true" />
            <label className="srOnly" htmlFor="store-search">Search nearby stores</label>
            <input
              id="store-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search salon, groceries, clinic..."
            />
            {query && (
              <button className="clearSearch" type="button" aria-label="Clear search" onClick={() => setQuery("")}>×</button>
            )}
            <button className="searchSubmit" type="submit">Search nearby</button>
          </form>

          <div className="quickProof" aria-label="Kynisto highlights">
            <span><b>100+</b> local places</span>
            <span><b>20</b> useful categories</span>
            <span><b>Live</b> open status</span>
          </div>
        </div>

        <div className="mapScene" aria-label="Illustrated map of nearby stores">
          <div className="sunDisc" />
          <div className="mapGrid" />
          <div className="road roadOne" />
          <div className="road roadTwo" />
          <div className="road roadThree" />
          <div className="parkPatch"><span>Neighbourhood park</span></div>
          <div className="mapPin pinSalon"><span>✂</span><b>Salon</b></div>
          <div className="mapPin pinGrocery"><span>◒</span><b>Grocery</b></div>
          <div className="mapPin pinClinic"><span>+</span><b>Clinic</b></div>
          <div className="mapPin pinCafe"><span>☕</span><b>Café</b></div>
          <div className="youAreHere"><i /> You are here</div>
          <div className="nearbyBadge"><strong>18 places</strong><span>within 2 km</span></div>
          <div className="mapCaption"><span>DLF Ankur Vihar</span><strong>See what is around you</strong></div>
        </div>
      </section>

      <section className="categorySection" aria-labelledby="category-heading">
        <div className="sectionHeading compactHeading">
          <div>
            <span className="kicker">Browse by need</span>
            <h2 id="category-heading">What are you looking for?</h2>
          </div>
          <button className="resetLink" type="button" onClick={resetFilters}>Reset filters <span aria-hidden="true">↗</span></button>
        </div>
        <div className="categoryGrid">
          {catalogCategories.map((item) => {
            const active = category === item.name;
            return (
              <button
                key={item.name}
                className={`categoryTile tone-${item.tone}`}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCategory(active ? "All" : item.name);
                  document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="categoryArt" aria-hidden="true"><i /><b>{item.icon}</b></span>
                <span>{item.name}</span>
                <small>{item.storeCount ?? catalogStores.filter((store) => store.category === item.name).length} nearby</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="placesSection" id="places" aria-labelledby="places-heading">
        <div className="sectionHeading placesHeading">
          <div>
            <span className="kicker">Handy places around you</span>
            <h2 id="places-heading">{category === "All" ? "Popular near you" : `${category} near you`}</h2>
          </div>
          <div className="filterGroup" aria-label="Sort and filter stores">
            {([
              ["all", "All places"],
              ["open", "Open now"],
              ["nearest", "Nearest"],
              ["rated", "Top rated"],
              ["newest", "Newest"],
            ] as [SortMode, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={sortMode === value}
                onClick={() => setSortMode(value)}
              >
                {value === "open" && <span className="openDot" aria-hidden="true" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="advancedFilters" aria-label="Detailed business filters">
          <label>
            <span>Area or neighbourhood</span>
            <input value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} placeholder="DLF Ankur Vihar" />
          </label>
          <label>
            <span>PIN code</span>
            <input value={pinFilter} onChange={(event) => setPinFilter(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="201102" />
          </label>
          <label>
            <span>Business type</span>
            <input value={businessTypeFilter} onChange={(event) => setBusinessTypeFilter(event.target.value)} placeholder="Clinic, bakery, repair..." />
          </label>
        </div>

        <div className="resultsBar">
          <span><b>{catalogTotal}</b> places found</span>
          {(query || category !== "All") && <span>for {query && <b>“{query}”</b>} {query && category !== "All" ? "in" : ""} {category !== "All" && <b>{category}</b>}</span>}
        </div>

        {catalogLoading ? (
          <div className="storeGrid resultSkeleton" aria-label="Loading nearby businesses" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => <article className="storeCard" key={index}><span /><div><i /><i /><i /></div></article>)}
          </div>
        ) : results.length > 0 ? (
          <>
          <div className="storeGrid">
            {results.map((store) => (
              <article className="storeCard" key={store.id}>
                <button
                  type="button"
                  className={`storeVisual tone-${store.tone}`}
                  aria-label={`View ${store.name} details`}
                  onClick={() => setSelectedStore(store)}
                >
                  <span className="visualPattern" aria-hidden="true" />
                  <span className="storeGlyph" aria-hidden="true">{store.icon}</span>
                  <span className={`statusBadge ${store.open ? "isOpen" : "isClosed"}`}>{store.open ? "Open now" : "Closed"}</span>
                  <span className="distanceBadge">{store.distance.toFixed(1)} km</span>
                </button>
                <div className="storeBody">
                  <div className="storeTopline">
                    <span className="categoryLabel">{store.category}</span>
                    <span className="rating" aria-label={`${store.rating} out of 5 stars`}><b>★ {store.rating}</b> ({store.reviews})</span>
                  </div>
                  <h3>{store.name}</h3>
                  <p className="address"><span aria-hidden="true">⌖</span> {store.address}</p>
                  <div className="storeMeta">
                    <span>{store.walk}</span>
                    <i aria-hidden="true" />
                    <span>{store.hours}</span>
                  </div>
                  <div className="cardActions">
                    {store.slug ? <Link className="detailsButton" href={`/stores/${store.slug}`}>View profile</Link> : <button className="detailsButton" type="button" onClick={() => setSelectedStore(store)}>View details</button>}
                    <button
                      className={`saveIcon ${saved.includes(store.id) ? "isSaved" : ""}`}
                      type="button"
                      aria-label={`${saved.includes(store.id) ? "Remove" : "Save"} ${store.name}`}
                      aria-pressed={saved.includes(store.id)}
                      onClick={() => void toggleSaved(store)}
                    >
                      ♥
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {hasMore && (
            <div className="loadMoreRow">
              <button type="button" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? "Loading more places..." : "Show more nearby places"}
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="emptyState">
            <div aria-hidden="true">⌕</div>
            <h3>No places match that search</h3>
            <p>Try another service or clear your current filters.</p>
            <button type="button" onClick={resetFilters}>Show all nearby places</button>
          </div>
        )}
      </section>

      <section className="trustStrip" aria-label="Why use Kynisto">
        <div><span aria-hidden="true">⌖</span><p><b>Address first</b><small>No hunting through pages for the location.</small></p></div>
        <div><span aria-hidden="true">✓</span><p><b>Useful at a glance</b><small>Hours, distance and rating in one card.</small></p></div>
        <div><span aria-hidden="true">♥</span><p><b>Made for your locality</b><small>Save the places you use every week.</small></p></div>
      </section>

      <footer>
        <a className="brand footerBrand" href="#top"><KynistoLogo showTagline /></a>
        <p>Everything Around You, Smarter.</p>
        <p className="demoNote">Local listings for DLF Ankur Vihar, Loni, Ghaziabad · © 2026 Kynisto</p>
      </footer>

      {customizing && (
        <div className="modalLayer" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setCustomizing(false)}>
          <aside className="customizePanel" role="dialog" aria-modal="true" aria-labelledby="customize-title">
            <div className="modalHeader">
              <div><span className="kicker">Make it yours</span><h2 id="customize-title">Customize Kynisto</h2></div>
              <button type="button" className="closeButton" aria-label="Close customization" onClick={() => setCustomizing(false)}>×</button>
            </div>
            <p className="panelIntro">Your choices stay on this device.</p>

            <fieldset>
              <legend>Accent colour</legend>
              <div className="swatchRow">
                {([
                  ["royal", "Royal blue"],
                  ["navy", "Dark navy"],
                  ["cyan", "Cyan"],
                ] as [Accent, string][]).map(([value, label]) => (
                  <button key={value} className={`swatch swatch-${value}`} type="button" aria-pressed={accent === value} onClick={() => setAccent(value)}>
                    <i aria-hidden="true" /><span>{label}</span><b aria-hidden="true">✓</b>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Appearance</legend>
              <div className="densityRow themeModeRow">
                {([
                  ["light", "Light", "Warm cream and paper surfaces"],
                  ["dark", "Dark", "Low-glare evening browsing"],
                ] as [ThemeMode, string, string][]).map(([value, label, help]) => (
                  <button key={value} type="button" aria-pressed={themeMode === value} onClick={() => setThemeMode(value)}>
                    <span className={`themeModeIcon ${value}`} aria-hidden="true" />
                    <span><b>{label}</b><small>{help}</small></span>
                    <em aria-hidden="true">&#10003;</em>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Card spacing</legend>
              <div className="densityRow">
                {([
                  ["comfortable", "Comfortable", "Roomier cards and details"],
                  ["compact", "Compact", "See more places at once"],
                ] as [Density, string, string][]).map(([value, label, help]) => (
                  <button key={value} type="button" aria-pressed={density === value} onClick={() => setDensity(value)}>
                    <span className={`densityIcon densityIcon-${value}`} aria-hidden="true"><i /><i /><i /></span>
                    <span><b>{label}</b><small>{help}</small></span>
                    <em aria-hidden="true">✓</em>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="savedSummary"><span aria-hidden="true">♥</span><p><b>{saved.length} saved place{saved.length === 1 ? "" : "s"}</b><small>Signed-in favourites stay securely linked to your account.</small></p></div>
            <button className="doneButton" type="button" onClick={() => setCustomizing(false)}>Done</button>
          </aside>
        </div>
      )}

      {selectedStore && (
        <div className="modalLayer detailsLayer" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setSelectedStore(null)}>
          <section className="detailModal" role="dialog" aria-modal="true" aria-labelledby="store-detail-title">
            <div className={`detailHero tone-${selectedStore.tone}`}>
              <span className="visualPattern" aria-hidden="true" />
              <span className="detailGlyph" aria-hidden="true">{selectedStore.icon}</span>
              <button type="button" className="closeButton lightClose" aria-label="Close store details" onClick={() => setSelectedStore(null)}>×</button>
              <span className={`statusBadge ${selectedStore.open ? "isOpen" : "isClosed"}`}>{selectedStore.open ? "Open now" : "Closed"}</span>
            </div>
            <div className="detailBody">
              <span className="categoryLabel">{selectedStore.category}</span>
              <h2 id="store-detail-title">{selectedStore.name}</h2>
              <div className="detailRating"><b>★ {selectedStore.rating}</b><span>{selectedStore.reviews} local reviews</span><i /> <span>{selectedStore.distance.toFixed(1)} km away</span></div>
              <div className="addressBlock"><span aria-hidden="true">⌖</span><p><small>Full address</small><b>{selectedStore.address}</b></p></div>
              <div className="hoursBlock"><span aria-hidden="true">◷</span><p><small>Today</small><b>{selectedStore.hours}</b></p></div>
              <div className="serviceTags">{selectedStore.services.map((service) => <span key={service}>{service}</span>)}</div>
              <div className="detailActions">
                {selectedStore.slug && <Link href={`/stores/${selectedStore.slug}`}>Full profile <span aria-hidden="true">→</span></Link>}
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.address)}`} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
                <button type="button" aria-pressed={saved.includes(selectedStore.id)} onClick={() => void toggleSaved(selectedStore)}>{saved.includes(selectedStore.id) ? "♥ Saved" : "♡ Save place"}</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status" aria-live="polite">✓ {toast}</div>}
    </main>
  );
}
