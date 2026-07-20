import { KynistoLogo } from "@/components/brand/KynistoLogo";

export default function Loading() {
  return <div className="routeLoading" role="status" aria-label="Loading Kynisto"><KynistoLogo showTagline /><small>Loading what is around you…</small></div>;
}
