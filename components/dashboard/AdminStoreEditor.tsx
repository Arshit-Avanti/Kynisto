"use client";

import type { FormEvent } from "react";

type AdminItem = Record<string, unknown>;

function parseDays(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch {
      return [0, 1, 2, 3, 4, 5, 6];
    }
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

function parseHours(value: unknown): { open: string; close: string } {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, { open?: string; close?: string }>;
      const first = Object.values(parsed)[0];
      if (first?.open && first?.close) return { open: first.open, close: first.close };
    } catch {
      return { open: "09:00", close: "21:00" };
    }
  }
  return { open: "09:00", close: "21:00" };
}

export function AdminStoreEditor({
  categories,
  owners,
  store,
  onSubmit,
}: {
  categories: AdminItem[];
  owners: AdminItem[];
  store?: AdminItem;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const hours = parseHours(store?.businessHours);
  const openingDays = parseDays(store?.openingDays);
  const text = (key: string, fallback = "") => String(store?.[key] ?? fallback);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      ...Object.fromEntries(form),
      openingDays: form.getAll("openingDay").map(Number),
    });
  }

  return (
    <section className="portalCard adminEditor">
      <div className="portalCardHeader">
        <h2>{store ? `Edit ${text("name")}` : "Create store"}</h2>
        <small>Complete listing, ownership, location and hours</small>
      </div>
      <form className="portalForm" onSubmit={submit}>
        <label>Store name<input name="name" defaultValue={text("name")} required /></label>
        <label>Business type<input name="businessType" defaultValue={text("businessType", "Local business")} required /></label>
        <label>Category<select name="categoryId" defaultValue={text("categoryId")} required><option value="">Choose category</option>{categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{String(category.name)}</option>)}</select></label>
        <label>Subcategory ID<input name="subcategoryId" defaultValue={text("subcategoryId")} placeholder="Optional" /></label>
        <label>Owner<select name="ownerId" defaultValue={text("ownerId")}><option value="">Unassigned</option>{owners.map((owner) => <option key={String(owner.id)} value={String(owner.id)}>{String(owner.name)}</option>)}</select></label>
        <label>Phone<input name="phone" defaultValue={text("phone")} /></label>
        <label>WhatsApp<input name="whatsapp" defaultValue={text("whatsapp")} /></label>
        <label>Email<input name="email" type="email" defaultValue={text("email")} /></label>
        <label>Website<input name="website" type="url" defaultValue={text("website")} /></label>
        <label className="full">Description<textarea name="description" defaultValue={text("description", "A trusted local business serving DLF Ankur Vihar, Loni and nearby communities.")} required /></label>
        <label className="full">Full address<input name="address" defaultValue={text("address", "Main Market Road, DLF Ankur Vihar")} required /></label>
        <label>Area<input name="area" defaultValue={text("area", "DLF Ankur Vihar")} /></label>
        <label>City<input name="city" defaultValue={text("city", "Loni")} /></label>
        <label>State<input name="state" defaultValue={text("state", "Uttar Pradesh")} /></label>
        <label>Country<input name="country" defaultValue={text("country", "India")} /></label>
        <label>PIN code<input name="postalCode" defaultValue={text("postalCode", "201102")} /></label>
        <label>Latitude<input name="latitude" type="number" step="any" defaultValue={text("latitude", "28.7381")} /></label>
        <label>Longitude<input name="longitude" type="number" step="any" defaultValue={text("longitude", "77.2669")} /></label>
        <label className="full">Google Maps URL<input name="googleMapsUrl" type="url" defaultValue={text("googleMapsUrl")} /></label>
        <label>Opens<input name="openTime" type="time" defaultValue={hours.open} /></label>
        <label>Closes<input name="closeTime" type="time" defaultValue={hours.close} /></label>
        <fieldset className="dayChecks full">
          <legend>Opening days</legend>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <label key={day}><input name="openingDay" type="checkbox" value={index} defaultChecked={openingDays.includes(index)} />{day}</label>)}
        </fieldset>
        <div className="formActions"><button className="portalButton" type="submit">{store ? "Save store changes" : "Create approved store"}</button></div>
      </form>
    </section>
  );
}
