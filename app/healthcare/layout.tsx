import type { Metadata } from "next";
import "./healthcare.css";
import "./healthcare-queue-badge.css";
import "./healthcare-dark.css";

export const metadata: Metadata = {
  title: "Healthcare near DLF Ankur Vihar",
  description: "Find verified hospitals, clinics, diagnostic labs, pharmacies and live patient queues near DLF Ankur Vihar, Loni.",
  alternates: { canonical: "/healthcare" },
  openGraph: { title: "Kynisto Healthcare", description: "Verified local care and live queue status near DLF Ankur Vihar.", type: "website" },
};

export default function HealthcareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
