import { HomeServicesDiscovery } from "@/components/services/HomeServicesDiscovery";

export const metadata = {
  title: "Local Home Services & Professionals Near You | Kynisto",
  description: "Book verified plumbers, electricians, carpenters, AC technicians, cleaning experts and home service professionals near you.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <HomeServicesDiscovery />;
}
