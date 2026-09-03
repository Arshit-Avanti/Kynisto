import { HomeServicesDiscovery } from "@/components/services/HomeServicesDiscovery";

export const metadata = {
  title: "Local Home Services & Professionals Near You | Kynisto",
  alternates: { canonical: "https://kynisto.in/services" },
  openGraph: { title: "Local Home Services & Professionals Near You | Kynisto", description: "Book verified plumbers, electricians, carpenters, AC technicians and home service professionals near you.", type: "website", url: "https://kynisto.in/services" },
};

export default function ServicesPage() {
  return <HomeServicesDiscovery />;
}
