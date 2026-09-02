"use client";

import { useState } from "react";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { Mail, Phone, MapPin, MessageSquare, Clock, Shield, CheckCircle2, Send } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Support / Question");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased selection:bg-orange-500 selection:text-white">
      <Navbar3D />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Support &amp; Grievance Desk</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Contact Kynisto
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Have questions about local discovery, outpatient virtual queues, or onboarding your clinic/shop? Reach out to our dedicated support teams.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-14">
          {/* Card 1: Official Email Support */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Email Support</h3>
              <p className="text-xs text-slate-400 mb-4">Guaranteed response within 24h</p>
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Founder / Grievance:</span>
                  <a href="mailto:nxt.arshit@gmail.com" className="font-bold text-orange-400 hover:underline">
                    nxt.arshit@gmail.com
                  </a>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">General Support:</span>
                  <a href="mailto:kynisto.in@gmail.com" className="font-bold text-orange-400 hover:underline">
                    kynisto.in@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Operating Hours */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Operating Hours</h3>
              <p className="text-xs text-slate-400 mb-4">Desk support timings</p>
              <div className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                <p><strong>Mon – Sat:</strong> 09:00 AM – 08:00 PM IST</p>
                <p><strong>Sunday:</strong> 10:00 AM – 04:00 PM IST</p>
                <p><strong>Queue Engine:</strong> 24/7 Live Telemetry</p>
              </div>
            </div>
          </div>

          {/* Card 3: Registered Address */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Registered Address</h3>
              <p className="text-xs text-slate-400 mb-4">Headquarters</p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kynisto Technologies Inc.<br />
                B-5/13, DLF Ankur Vihar, Loni,<br />
                Ghaziabad, Uttar Pradesh, India – 201102
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Container */}
        <section className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Send Us a Direct Message</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            Fill in the form below and our team will get back to you promptly.
          </p>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Thank you, {name || "there"}!</p>
                <p className="text-xs sm:text-sm text-emerald-300">Your message has been received. Our team will contact you at {email || "your email"} shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="contact-name">
                  Your Full Name
                </label>
                <input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500 text-sm bg-slate-950/80 text-white placeholder:text-slate-600"
                  placeholder="Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="contact-email">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500 text-sm bg-slate-950/80 text-white placeholder:text-slate-600"
                  placeholder="rahul@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="contact-subject">
                  Inquiry Topic
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500 text-sm bg-slate-950/80 text-white"
                >
                  <option className="bg-slate-900">General Support / Question</option>
                  <option className="bg-slate-900">Store / Clinic Onboarding Inquiry</option>
                  <option className="bg-slate-900">Virtual Queue Assistance</option>
                  <option className="bg-slate-900">Data Privacy / Grievance Redressal</option>
                  <option className="bg-slate-900">Partnership &amp; Press</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="contact-message">
                  Message / Description
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500 text-sm bg-slate-950/80 text-white placeholder:text-slate-600"
                  placeholder="Describe your question or feedback in detail..."
                />
              </div>

              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Submit Message</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      <Footer3D />
    </div>
  );
}
