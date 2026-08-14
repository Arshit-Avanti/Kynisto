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
  const isHomeService = body.businessType === "Home Service Business";
  const openingDays = Array.isArray(body.openingDays)
    ? body.openingDays.map((value) => numberInput(value, "Opening day", { min: 0, max: 6, integer: true }) as number)
    : [0, 1, 2, 3, 4, 5, 6];
  const openTime = cleanText(body.openTime ?? "09:00", "Opening time", { max: 5 });
  const closeTime = cleanText(body.closeTime ?? "21:00", "Closing time", { max: 5 });

  let businessHoursStr: string;
  let finalOpeningDays = openingDays;

  if (isHomeService && typeof body.businessHours === "string" && body.businessHours.trim().length > 0 && !body.businessHours.startsWith("{")) {
    businessHoursStr = cleanText(body.businessHours, "Business hours", { max: 200 });
  } else if (typeof body.businessHours === "string" && body.businessHours.startsWith("{")) {
    try {
      const parsed = JSON.parse(body.businessHours) as Record<string, any>;
      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const validated: Record<string, any> = {};
      const calculatedOpenDays: number[] = [];

      dayKeys.forEach((key, index) => {
        const d = parsed[key];
        if (d && d.closed !== true) {
          calculatedOpenDays.push(index);
          const o1 = cleanText(d.open ?? "09:00", "Opening time", { max: 5 });
          const c1 = cleanText(d.close ?? "21:00", "Closing time", { max: 5 });
          const dayObj: Record<string, any> = { open: o1, close: c1, closed: false };
          if (d.open2 && d.close2) {
            dayObj.open2 = cleanText(d.open2, "Evening opening time", { max: 5 });
            dayObj.close2 = cleanText(d.close2, "Evening closing time", { max: 5 });
          }
          validated[key] = dayObj;
        } else {
          validated[key] = { closed: true };
        }
      });

      businessHoursStr = JSON.stringify(validated);
      if (calculatedOpenDays.length > 0) {
        finalOpeningDays = calculatedOpenDays;
      }
    } catch {
      businessHoursStr = JSON.stringify(
        Object.fromEntries(openingDays.map((day) => [["sun", "mon", "tue", "wed", "thu", "fri", "sat"][day], { open: openTime, close: closeTime }]))
      );
    }
  } else {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closeTime)) {
      throw new ValidationError("Business hours must use 24-hour HH:MM format.");
    }
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const businessHours = Object.fromEntries(
      openingDays.map((day) => [dayKeys[day], { open: openTime, close: closeTime }]),
    );
    businessHoursStr = JSON.stringify(businessHours);
  }

  return {
    name: cleanText(body.name, "Store name", { min: 2, max: 120 }),
    description: cleanText(body.description, "Description", { min: isHomeService ? 5 : 20, max: 3000 }),
    businessType: cleanText(body.businessType ?? "Local business", "Business type", { max: 100 }),
    categoryId: cleanText(body.categoryId, "Category", { max: 80 }),
    subcategoryId: cleanText(body.subcategoryId, "Subcategory", { max: 80, required: false }) || null,
    address: isHomeService
      ? (cleanText(body.address, "Address", { min: 0, max: 300, required: false }) || "Doorstep / Mobile Service")
      : cleanText(body.address, "Address", { min: 8, max: 300 }),
    area: cleanText(body.area ?? "Your Locality", "Area", { min: 2, max: 100 }),
    city: cleanText(body.city ?? "Loni", "City", { min: 2, max: 100 }),
    state: cleanText(body.state ?? "Uttar Pradesh", "State", { min: 2, max: 100 }),
    country: cleanText(body.country ?? "India", "Country", { min: 2, max: 100 }),
    postalCode: cleanText(body.postalCode ?? "201102", "PIN code", { min: 4, max: 12 }),
    latitude: numberInput(body.latitude ?? 28.7381, "Latitude", { min: -90, max: 90 }) as number,
    longitude: numberInput(body.longitude ?? 77.2669, "Longitude", { min: -180, max: 180 }) as number,
    // GPS accuracy in metres (null if owner did not use GPS capture)
    locationAccuracy: body.locationAccuracy != null ? (numberInput(body.locationAccuracy, "Location accuracy", { min: 0, max: 50000 }) as number) : null,
    // Whether the owner confirmed GPS coordinates via the location step
    locationVerified: Boolean(body.locationVerified),
    googleMapsUrl: urlInput(body.googleMapsUrl, "Google Maps URL"),
    phone: phoneInput(body.phone, "Phone"),
    whatsapp: phoneInput(body.whatsapp, "WhatsApp"),
    email: body.email ? emailInput(body.email) : null,
    website: urlInput(body.website, "Website"),
    businessHours: businessHoursStr,
    openingDays: JSON.stringify(finalOpeningDays),
  };
}
