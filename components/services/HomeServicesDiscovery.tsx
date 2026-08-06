"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Navbar3D } from "@/components/ui/Navbar3D";
import { VideoBackground } from "@/components/media/VideoBackground";
import { ShaderCanvas } from "@/components/ui/ShaderCanvas";
import { apiFetch } from "@/lib/client-api";

import { generateWhatsAppBookingUrl } from "@/lib/whatsapp";
import { PushNotificationManager } from "@/components/ui/PushNotificationManager";

export interface HomeService {
  id: string;
  name: string;
  categoryName: string;
  slug: string;
  description: string;
  startingPrice: number;
  estimatedArrival: string;
  storeName: string;
  storePhone?: string | null;
  area?: string;
  city?: string;
}

export function HomeServicesDiscovery() {
  const [services, setServices] = useState<HomeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "store_owner" | "customer" | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Your Locality");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedService, setSelectedService] = useState<HomeService | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState("Today");
  const [bookingSlot, setBookingSlot] = useState("10:00 AM - 12:00 PM");
  const [userAddress, setUserAddress] = useState("Your Locality, Block A");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const data = await apiFetch<{ ok: boolean; items: HomeService[] }>("/api/services");
        setServices(data.items || []);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    void loadServices();
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch<{ user: { role: "admin" | "store_owner" | "customer" } | null }>("/api/auth/me")
      .then(async (sessionData) => {
        if (!active) return;
        setUserRole(sessionData.user?.role ?? null);
        if (sessionData.user?.role === "customer" || sessionData.user?.role === "admin") {
          const favoriteData = await apiFetch<{ items: Array<{ storeId: string }> }>("/api/favorites");
          if (active) setSavedCount(favoriteData.items.length);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setToastMessage("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const label = `Your Locality (${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`;
        setLocationLabel(label);
        setUserAddress(label);
        setToastMessage("Location updated to your GPS position!");
      },
      () => {
        setToastMessage("Could not retrieve precise GPS location.");
      }
    );
  };

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        (service.categoryName && service.categoryName.toLowerCase().includes(query)) ||
        (service.storeName && service.storeName.toLowerCase().includes(query));
      const matchesCategory =
        selectedCategory === "All" || service.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const bookingId = `KS-SERV-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingSuccess(bookingId);
      setIsSubmitting(false);
    } catch {
      setToastMessage("Failed to process booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="services-page-shell">
      <style dangerouslySetInnerHTML={{ __html: servicesCustomCss }} />
      <VideoBackground />
      <ShaderCanvas />

      <Navbar3D
        userRole={userRole}
        savedCount={savedCount}
        mode="services"
      />

      {toastMessage && (
        <div className="services-toast-banner" role="alert">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

      {/* Hero Header */}
      <section className="services-hero">
        <div className="services-hero-kicker">
          <span>⚡ INSTANT LOCAL BOOKING</span>
        </div>
        <h1 className="services-hero-title">
          Book Trusted Local Professionals in Minutes.
        </h1>
        <p className="services-hero-subtitle">
          Verified plumbers, electricians, technicians & home experts near {locationLabel}. 100% upfront pricing & 30–60 min arrival guarantee.
        </p>

        {/* Real-time Proof Badges */}
        <div className="services-proof-badges">
          <div className="proof-chip">⚡ 30-60 Min Express Arrival</div>
          <div className="proof-chip">🛡️ 100% Background Verified</div>
          <div className="proof-chip">💰 Upfront Prices · No Hidden Fees</div>
        </div>

        {/* Search Bar */}
        <div className="services-search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plumber, electrician, AC repair, cleaning..."
            aria-label="Search home services"
            className="services-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="services-category-bar">
          {[
            "All",
            "Emergency",
            "Appliance",
            "Cleaning",
            "Maintenance",
            "Tech",
            "Shifting",
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "All" ? "All Services (23)" : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="services-grid-container">
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>
              {selectedCategory === "All"
                ? "All Available Home Services"
                : `${selectedCategory} Services`}
              <span className="count-badge">{filteredServices.length}</span>
            </h2>
            <span className="sub-note">Instant Dispatch in {locationLabel}</span>
          </div>
          <PushNotificationManager />
        </div>

        {filteredServices.length > 0 ? (
          <div className="services-grid">
            {filteredServices.map((service) => {
              const waUrl = generateWhatsAppBookingUrl({
                storeOrServiceName: service.storeName || service.name,
                whatsappNumber: service.storePhone || "919876543210",
                serviceOrProductName: service.name,
                price: service.startingPrice,
                customerAddress: userAddress,
              });

              return (
                <article key={service.id} className="service-card">
                  <div className="service-card-top">
                    <div
                      className="service-icon-box"
                      style={{ borderColor: "#FF5722" }}
                    >
                      <span>🛠️</span>
                    </div>
                    <span className="arrival-badge">⏱️ {service.estimatedArrival || "30–60 min"}</span>
                  </div>

                  <div className="service-card-body">
                    <span className="category-meta" style={{ color: "#FF8A00", fontWeight: 700 }}>
                      {service.categoryName || "General Service"}
                    </span>
                    <h3 className="service-name">{service.name}</h3>
                    <p className="service-desc">{service.description || "Professional service provided by local verified business."}</p>
                    {service.storeName && (
                      <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)" }}>
                        🏪 Provided by: <strong style={{ color: "#f8fafc" }}>{service.storeName}</strong>
                      </div>
                    )}
                  </div>

                  <div className="service-card-meta">
                    <div className="rating-box">
                      <span className="star">⭐ 4.9</span>
                      <span className="reviews">(Verified)</span>
                    </div>
                    <div className="price-box">
                      <small>Starting from</small>
                      <strong>₹{Number(service.startingPrice || 0).toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "16px" }}>
                    <button
                      type="button"
                      className="book-now-btn"
                      style={{ margin: 0 }}
                      onClick={() => setSelectedService(service)}
                    >
                      Book Now ➔
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="book-now-btn"
                      style={{
                        margin: 0,
                        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontWeight: 700,
                        fontSize: "13px",
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="services-empty-state" style={{ padding: "48px 24px", textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="empty-icon" style={{ fontSize: "3rem" }}>🛠️</span>
            <h3 style={{ fontSize: "1.3rem", marginTop: "12px", color: "#f8fafc" }}>No active services listed in this category yet</h3>
            <p style={{ color: "#94a3b8", maxWidth: "500px", margin: "8px auto 20px" }}>
              Are you a service professional, electrician, plumber, or technician? Register your business on Kynisto and start accepting bookings today!
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/onboarding" className="portalButton" style={{ padding: "10px 24px", textDecoration: "none", display: "inline-block" }}>
                + List Your Business Now
              </Link>
              {(searchQuery || selectedCategory !== "All") && (
                <button
                  type="button"
                  className="reset-search-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer" }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {selectedService && (
        <div
          className="services-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedService(null);
              setBookingSuccess(null);
            }
          }}
        >
          <div className="services-modal-content" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => {
                setSelectedService(null);
                setBookingSuccess(null);
              }}
            >
              ×
            </button>

            {bookingSuccess ? (
              <div className="booking-success-box">
                <div className="success-icon">🎉</div>
                <h2>Booking Confirmed!</h2>
                <p>
                  Your booking for <strong>{selectedService.name}</strong> has been received.
                </p>
                <div className="booking-ticket">
                  <div className="ticket-row">
                    <span>Booking Reference:</span>
                    <strong>{bookingSuccess}</strong>
                  </div>
                  <div className="ticket-row">
                    <span>Estimated Arrival:</span>
                    <strong>{selectedService.estimatedArrival}</strong>
                  </div>
                  <div className="ticket-row">
                    <span>Assigned Professional:</span>
                    <strong>Nearest Kynisto Partner</strong>
                  </div>
                  <div className="ticket-row">
                    <span>Service Location:</span>
                    <strong>{userAddress}</strong>
                  </div>
                  <div className="ticket-row">
                    <span>Estimated Fee:</span>
                    <strong style={{ color: "#10B981" }}>₹{selectedService.startingPrice} (Pay After Job)</strong>
                  </div>
                </div>
                
                <a
                  href={generateWhatsAppBookingUrl({
                    storeOrServiceName: selectedService.storeName || selectedService.name,
                    whatsappNumber: selectedService.storePhone || "919876543210",
                    serviceOrProductName: selectedService.name,
                    price: selectedService.startingPrice,
                    customerAddress: userAddress,
                    bookingDate: bookingDate,
                    bookingSlot: bookingSlot,
                    bookingId: bookingSuccess,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "14px",
                    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "14px",
                    textDecoration: "none",
                    borderRadius: "14px",
                    marginBottom: "12px",
                    boxShadow: "0 4px 20px rgba(37, 211, 102, 0.4)",
                  }}
                >
                  💬 Send Invoice &amp; Details to WhatsApp ➔
                </a>

                <p className="ticket-note" style={{ marginBottom: "16px" }}>
                  You can also click above to send this invoice directly to WhatsApp.
                </p>
                <button
                  type="button"
                  className="done-btn"
                  onClick={() => {
                    setSelectedService(null);
                    setBookingSuccess(null);
                  }}
                >
                  Done &amp; Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="booking-form">
                <div className="modal-header-banner">
                  <span className="modal-icon">{selectedService.icon}</span>
                  <div>
                    <span className="modal-kicker">{selectedService.category} Service</span>
                    <h2 className="modal-service-title">{selectedService.name}</h2>
                    <span className="modal-price">Starting from ₹{selectedService.startingPrice}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="service-date">Select Preferred Date</label>
                  <div className="option-pills">
                    {["Today", "Tomorrow", "Pick Later"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`pill-option ${bookingDate === d ? "selected" : ""}`}
                        onClick={() => setBookingDate(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="service-slot">Select Preferred Time Slot</label>
                  <div className="option-pills">
                    {[
                      "8:00 AM - 10:00 AM",
                      "10:00 AM - 12:00 PM",
                      "2:00 PM - 4:00 PM",
                      "4:00 PM - 6:00 PM",
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`pill-option ${bookingSlot === slot ? "selected" : ""}`}
                        onClick={() => setBookingSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="service-address">Service Address / Locality</label>
                  <input
                    id="service-address"
                    type="text"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    required
                    placeholder="Enter complete address & landmark"
                    className="modal-text-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="service-notes">Instructions for Professional (Optional)</label>
                  <textarea
                    id="service-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Bring extra long wire, call before arrival..."
                    rows={2}
                    className="modal-text-input"
                  />
                </div>

                <div className="booking-summary-strip">
                  <div>
                    <small>Payment Method</small>
                    <strong>Pay After Service (Cash / UPI)</strong>
                  </div>
                  <button type="submit" className="confirm-booking-btn" disabled={isSubmitting}>
                    {isSubmitting ? "Dispatching Expert..." : `Confirm Booking · ₹${selectedService.startingPrice}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="services-footer">
        <Link className="brand footerBrand" href="/">
          <KynistoLogo />
        </Link>
        <p className="demoNote">
          Kynisto Home Services · {locationLabel} · © 2026 Kynisto
        </p>
      </footer>
    </main>
  );
}

const servicesCustomCss = `
.services-page-shell {
  min-height: 100vh;
  position: relative;
  color: #FFFFFF !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif !important;
}

.services-toast-banner {
  position: fixed;
  top: 90px;
  right: 20px;
  z-index: 999;
  background: rgba(16, 185, 129, 0.95);
  backdrop-filter: blur(16px);
  color: #FFFFFF;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 14px;
}

.services-hero {
  max-width: 1200px;
  margin: 110px auto 40px auto;
  padding: 0 20px;
  text-align: center;
}

.services-hero-kicker {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 9999px;
  background: rgba(255, 87, 34, 0.15);
  border: 1px solid rgba(255, 87, 34, 0.35);
  color: #FF8A00;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
}

.services-hero-title {
  font-size: clamp(2.4rem, 6vw, 4.2rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  margin-bottom: 16px;
}

.services-hero-subtitle {
  font-size: 1.15rem;
  color: #CBD5E1 !important;
  -webkit-text-fill-color: #CBD5E1 !important;
  max-width: 750px;
  margin: 0 auto 28px auto;
  line-height: 1.6;
  font-weight: 500;
}

.services-proof-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.proof-chip {
  padding: 8px 18px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  color: #F8FAFC;
  font-size: 13px;
  font-weight: 600;
}

.services-search-wrapper {
  position: relative;
  max-width: 680px;
  margin: 0 auto 28px auto;
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 12px 35px rgba(0,0,0,0.5);
  backdrop-filter: blur(25px);
}

.services-search-wrapper .search-icon {
  font-size: 18px;
  margin-right: 12px;
  opacity: 0.8;
}

.services-search-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #FFFFFF !important;
  font-size: 1.05rem;
  font-weight: 500;
}

.services-search-input::placeholder {
  color: #94A3B8 !important;
}

.clear-search-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #CBD5E1;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.services-category-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 1000px;
  margin: 0 auto;
}

.category-pill {
  padding: 10px 20px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94A3B8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-pill:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  border-color: rgba(255, 87, 34, 0.4);
}

.category-pill.active {
  background: linear-gradient(135deg, #FF5722 0%, #E53935 100%);
  color: #FFFFFF !important;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(255, 87, 34, 0.4);
}

.services-grid-container {
  max-width: 1350px;
  margin: 0 auto 80px auto;
  padding: 0 20px;
}

.services-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
}

.services-grid-header h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #FFFFFF !important;
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-badge {
  background: rgba(255, 87, 34, 0.25);
  color: #FF8A00;
  border: 1px solid rgba(255, 138, 0, 0.4);
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 800;
}

.sub-note {
  font-size: 13px;
  color: #94A3B8;
  font-weight: 600;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 22px;
}

.service-card {
  position: relative;
  background: rgba(12, 18, 30, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.service-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 87, 34, 0.5);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 87, 34, 0.2);
}

.popular-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  background: linear-gradient(135deg, #FF5722 0%, #F59E0B 100%);
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 6px;
}

.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.service-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: grid;
  place-items: center;
  font-size: 22px;
}

.arrival-badge {
  font-size: 11px;
  font-weight: 700;
  color: #10B981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 4px 10px;
  border-radius: 9999px;
}

.category-meta {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #FF8A00;
  display: block;
  margin-bottom: 4px;
}

.service-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #FFFFFF !important;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.service-desc {
  font-size: 0.9rem;
  color: #CBD5E1 !important;
  line-height: 1.5;
  margin-bottom: 20px;
  min-height: 40px;
}

.service-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.rating-box {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-box .star {
  font-size: 13px;
  font-weight: 800;
  color: #F59E0B;
}

.rating-box .reviews {
  font-size: 11px;
  color: #94A3B8;
}

.price-box small {
  display: block;
  font-size: 9px;
  color: #94A3B8;
  text-transform: uppercase;
}

.price-box strong {
  font-size: 1.15rem;
  font-weight: 900;
  color: #FFFFFF;
}

.book-now-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.book-now-btn:hover {
  background: linear-gradient(135deg, #FF5722 0%, #E53935 100%);
  border-color: transparent;
  box-shadow: 0 4px 18px rgba(255, 87, 34, 0.4);
}

.services-empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(12, 18, 30, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 24px;
}

.services-empty-state .empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.reset-search-btn {
  margin-top: 16px;
  padding: 10px 24px;
  border-radius: 12px;
  background: #FF5722;
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
}

/* Modal Styling */
.services-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.services-modal-content {
  position: relative;
  width: 100%;
  max-width: 540px;
  background: #0F172A;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #FFFFFF;
  font-size: 20px;
  cursor: pointer;
}

.modal-header-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-icon {
  font-size: 36px;
}

.modal-kicker {
  font-size: 10px;
  color: #FF8A00;
  font-weight: 800;
  text-transform: uppercase;
  display: block;
}

.modal-service-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #FFFFFF;
  margin: 2px 0;
}

.modal-price {
  font-size: 13px;
  color: #10B981;
  font-weight: 700;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #CBD5E1;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.option-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill-option {
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #CBD5E1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.pill-option.selected {
  background: rgba(255, 87, 34, 0.25);
  border-color: #FF5722;
  color: #FF8A00;
  font-weight: 700;
}

.modal-text-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  outline: none;
  font-size: 14px;
}

.booking-summary-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 16px;
}

.booking-summary-strip small {
  font-size: 10px;
  color: #94A3B8;
  display: block;
}

.booking-summary-strip strong {
  font-size: 12px;
  color: #10B981;
}

.confirm-booking-btn {
  padding: 14px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FF5722 0%, #E53935 100%);
  border: none;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(255, 87, 34, 0.4);
}

.booking-success-box {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 50px;
  margin-bottom: 12px;
}

.booking-ticket {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 16px;
  margin: 20px 0;
  text-align: left;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}

.ticket-row:last-child {
  border-bottom: none;
}

.ticket-row span {
  color: #94A3B8;
}

.ticket-row strong {
  color: #FFFFFF;
}

.ticket-note {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 20px;
}

.done-btn {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  background: #10B981;
  border: none;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
}

.services-footer {
  text-align: center;
  padding: 40px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .services-hero-title {
    font-size: 2.1rem !important;
  }
  .services-grid {
    grid-template-columns: 1fr;
  }
  .services-modal-content {
    padding: 20px;
  }
  .booking-summary-strip {
    flex-direction: column;
    align-items: stretch;
  }
}
`;
