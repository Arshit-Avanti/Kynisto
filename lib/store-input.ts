import {
  cleanText,
  emailInput,
  numberInput,
  phoneInput,
  urlInput,
  ValidationError,
} from "@/lib/validation";

export type StoreInput = ReturnType<typeof parseStoreInput>;

export function parseStoreInput(body: Record<string, unknown>) {
  const openingDays = Array.isArray(body.openingDays)
    ? body.openingDays.map((value) => numberInput(value, "Opening day", { min: 0, max: 6, integer: true }) as number)
    : [0, 1, 2, 3, 4, 5, 6];
  const openTime = cleanText(body.openTime ?? "09:00", "Opening time", { max: 5 });
  const closeTime = cleanText(body.closeTime ?? "21:00", "Closing time", { max: 5 });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closeTime)) {
    throw new ValidationError("Business hours must use 24-hour HH:MM format.");
  }
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const businessHours = Object.fromEntries(
    openingDays.map((day) => [dayKeys[day], { open: openTime, close: closeTime }]),
  );
  return {
    name: cleanText(body.name, "Store name", { min: 2, max: 120 }),
    description: cleanText(body.description, "Description", { min: 20, max: 3000 }),
    businessType: cleanText(body.businessType ?? "Local business", "Business type", { max: 100 }),
    categoryId: cleanText(body.categoryId, "Category", { max: 80 }),
    subcategoryId: cleanText(body.subcategoryId, "Subcategory", { max: 80, required: false }) || null,
    address: cleanText(body.address, "Address", { min: 8, max: 300 }),
    area: cleanText(body.area ?? "DLF Ankur Vihar", "Area", { min: 2, max: 100 }),
    city: cleanText(body.city ?? "Loni", "City", { min: 2, max: 100 }),
    state: cleanText(body.state ?? "Uttar Pradesh", "State", { min: 2, max: 100 }),
    country: cleanText(body.country ?? "India", "Country", { min: 2, max: 100 }),
    postalCode: cleanText(body.postalCode ?? "201102", "PIN code", { min: 4, max: 12 }),
    latitude: numberInput(body.latitude ?? 28.7381, "Latitude", { min: -90, max: 90 }) as number,
    longitude: numberInput(body.longitude ?? 77.2669, "Longitude", { min: -180, max: 180 }) as number,
    googleMapsUrl: urlInput(body.googleMapsUrl, "Google Maps URL"),
    phone: phoneInput(body.phone, "Phone"),
    whatsapp: phoneInput(body.whatsapp, "WhatsApp"),
    email: body.email ? emailInput(body.email) : null,
    website: urlInput(body.website, "Website"),
    businessHours: JSON.stringify(businessHours),
    openingDays: JSON.stringify(openingDays),
  };
}
