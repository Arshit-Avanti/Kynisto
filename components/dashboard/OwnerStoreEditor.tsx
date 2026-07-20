"use client";

import { useMemo, useState, type FormEvent } from "react";

type DataItem = Record<string, unknown>;

function parseJsonArray(value: unknown): number[] {
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

function firstHours(value: unknown): { open: string; close: string } {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, { open?: string; close?: string }>;
      const first = Object.values(parsed)[0];
      if (first?.open && first.close) return { open: first.open, close: first.close };
    } catch {
      return { open: "09:00", close: "21:00" };
    }
  }
  return { open: "09:00", close: "21:00" };
}

export function OwnerStoreEditor({ categories, store, onSubmit }: { categories: DataItem[]; store?: DataItem; onSubmit: (body: unknown) => Promise<void> }) {
  const [categoryId, setCategoryId] = useState(String(store?.categoryId ?? ""));
  const children = useMemo(() => {
    const category = categories.find((item) => String(item.id) === categoryId);
    return Array.isArray(category?.children) ? category.children as DataItem[] : [];
  }, [categories, categoryId]);
  const openingDays = parseJsonArray(store?.openingDays);
  const hours = firstHours(store?.businessHours);
  const text = (key: string, fallback = "") => String(store?.[key] ?? fallback);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({ ...Object.fromEntries(form), openingDays: form.getAll("openingDay").map(Number) });
  }

  return <form className="portalForm" onSubmit={submit}>
    <label>Store name<input name="name" defaultValue={text("name")} required /></label>
    <label>Business type<input name="businessType" defaultValue={text("businessType", "Local business")} required /></label>
    <label>Category<select name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="">Choose category</option>{categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{String(category.name)}</option>)}</select></label>
    <label>Subcategory<select name="subcategoryId" defaultValue={text("subcategoryId")}><option value="">Optional</option>{children.map((child) => <option key={String(child.id)} value={String(child.id)}>{String(child.name)}</option>)}</select></label>
    <label className="full">Description<textarea name="description" defaultValue={text("description", "Tell customers what makes your local business useful and trustworthy.")} required /></label>
    <label className="full">Full address<input name="address" defaultValue={text("address", "Main Market Road, DLF Ankur Vihar")} required /></label>
    <label>Area<input name="area" defaultValue={text("area", "DLF Ankur Vihar")} /></label>
    <label>City<input name="city" defaultValue={text("city", "Loni")} /></label>
    <label>State<input name="state" defaultValue={text("state", "Uttar Pradesh")} /></label>
    <label>Country<input name="country" defaultValue={text("country", "India")} /></label>
    <label>PIN code<input name="postalCode" defaultValue={text("postalCode", "201102")} /></label>
    <label>Phone<input name="phone" defaultValue={text("phone")} /></label>
    <label>WhatsApp<input name="whatsapp" defaultValue={text("whatsapp")} /></label>
    <label>Email<input name="email" type="email" defaultValue={text("email")} /></label>
    <label>Website<input name="website" type="url" defaultValue={text("website")} /></label>
    <label>Latitude<input name="latitude" type="number" step="any" defaultValue={text("latitude", "28.7381")} /></label>
    <label>Longitude<input name="longitude" type="number" step="any" defaultValue={text("longitude", "77.2669")} /></label>
    <label className="full">Google Maps URL<input name="googleMapsUrl" type="url" defaultValue={text("googleMapsUrl")} /></label>
    <label>Opens<input name="openTime" type="time" defaultValue={hours.open} /></label>
    <label>Closes<input name="closeTime" type="time" defaultValue={hours.close} /></label>
    <fieldset className="dayChecks full"><legend>Opening days</legend>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <label key={day}><input name="openingDay" type="checkbox" value={index} defaultChecked={openingDays.includes(index)} />{day}</label>)}</fieldset>
    <div className="formActions"><button className="portalButton" type="submit">{store ? "Save changes" : "Submit business"}</button></div>
  </form>;
}
