import { ProductDiscovery } from "@/components/store/ProductDiscovery";

export const metadata = {
  title: "Local Products Near You | Kynisto",
  description: "Search products available from local shops in your area.",
};

export default function ProductsPage() {
  return <ProductDiscovery />;
}
