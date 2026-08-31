import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* 404 Number */}
        <div
          className="font-black mb-4 select-none"
          style={{
            fontSize: "clamp(72px, 18vw, 128px)",
            background: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1,
          }}
        >
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-slate-500 text-base mb-8 leading-relaxed max-w-md mx-auto">
          This page doesn&apos;t exist or has been moved. Let&apos;s get you
          back to something useful.
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-full font-bold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
              boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
            }}
          >
            🏠 Go Home
          </Link>
          <Link
            href="/search"
            className="px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105 active:scale-95"
          >
            🔍 Search Kynisto
          </Link>
          <Link
            href="/healthcare"
            className="px-6 py-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm shadow-sm hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95"
          >
            🏥 Healthcare
          </Link>
        </div>

        {/* Popular quick links */}
        <div className="mt-10 pt-8 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Popular pages
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { href: "/search?q=clinic", label: "Clinics" },
              { href: "/search?q=grocery", label: "Grocery" },
              { href: "/search?q=salon", label: "Salons" },
              { href: "/search?q=dentist", label: "Dentists" },
              { href: "/search?q=electrician", label: "Electricians" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          If you believe this is an error, please{" "}
          <a
            href="mailto:support@kynisto.in"
            className="text-orange-500 hover:underline"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </main>
  );
}
