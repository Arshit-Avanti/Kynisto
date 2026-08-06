/**
 * Kynisto WhatsApp Invoice & Deep Linking Engine
 */

export interface WhatsAppBookingPayload {
  storeOrServiceName: string;
  whatsappNumber: string;
  serviceOrProductName: string;
  price: number | string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  bookingDate?: string;
  bookingSlot?: string;
  bookingId?: string;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function generateWhatsAppBookingUrl(payload: WhatsAppBookingPayload): string {
  const cleanPhone = cleanPhoneForWhatsApp(payload.whatsappNumber);
  const shortId = payload.bookingId || `KYN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  
  const text = [
    `👋 *Hi ${payload.storeOrServiceName}*,`,
    `I would like to book a service via *Kynisto*:`,
    ``,
    `📌 *Item / Service:* ${payload.serviceOrProductName}`,
    `💰 *Fee / Price:* ₹${payload.price}`,
    payload.bookingDate ? `📅 *Date & Slot:* ${payload.bookingDate} (${payload.bookingSlot || "Flexi"})` : null,
    payload.customerName ? `👤 *Customer Name:* ${payload.customerName}` : null,
    payload.customerPhone ? `📞 *Phone:* ${payload.customerPhone}` : null,
    payload.customerAddress ? `📍 *Address:* ${payload.customerAddress}` : null,
    ``,
    `🆔 *Booking Ref:* #${shortId}`,
    `⚡ *Sent via Kynisto Hyper-Local Platform*`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const encodedText = encodeURIComponent(text);
  
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
