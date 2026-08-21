"use client";

import { Star } from "lucide-react";

export function TestimonialsSection() {
  const reviews = [
    {
      name: "Dr. Ananya Sharma",
      role: "Chief Physician, CarePoint Clinic",
      text: "The live queue module completely eliminated overcrowding outside our consultation chambers. Patients arrive exactly on time for their token.",
      stars: 5,
    },
    {
      name: "Rajesh Malhotra",
      role: "Owner, Malhotra Supermarket",
      text: "Adding our store to Kynisto gave us a 40% boost in neighborhood footfall. Local shoppers find our inventory and chat with us in seconds.",
      stars: 5,
    },
    {
      name: "Pooja Verma",
      role: "Resident & Verified Shopper",
      text: "I booked my salon appointment and joined the pediatrician queue while still at home. Kynisto is indispensable for everyday neighborhood life.",
      stars: 5,
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="text-[#f59e0b] font-bold text-xs uppercase tracking-widest block mb-2">
          Community Trust
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
          Loved by Thousands of Clinics &amp; Shoppers
        </h2>
        <p className="text-slate-600 text-base">
          Read verified feedback from healthcare practitioners, local business owners, and active residents.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <div key={r.name} className="p-7 rounded-2xl bg-white/90 border border-slate-200/90 shadow-md flex flex-col justify-between hover:border-sky-300 transition-all">
            <div>
              <div className="flex items-center gap-1 text-[#f59e0b] mb-4">
                {[...Array(r.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic mb-6 leading-relaxed">"{r.text}"</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
              <p className="text-xs text-slate-500">{r.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
