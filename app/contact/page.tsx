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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <Navbar3D />

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-36 pb-28">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Support &amp; Grievance Desk</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Contact Kynisto
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Have questions about local discovery, outpatient virtual queues, or onboarding your clinic/shop? Reach out to our dedicated support teams.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 mb-16">
          {/* Card 1: Official Email Support */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5 border border-sky-200">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Email Support</h3>
              <p className="text-xs text-slate-500 mb-5">Guaranteed response within 24h</p>
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold">Founder / Grievance:</span>
                  <a href="mailto:nxt.arshit@gmail.com" className="font-bold text-orange-600 hover:underline">
                    nxt.arshit@gmail.com
                  </a>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold">General Support:</span>
                  <a href="mailto:kynisto.in@gmail.com" className="font-bold text-orange-600 hover:underline">
                    kynisto.in@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Operating Hours */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-200">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Operating Hours</h3>
              <p className="text-xs text-slate-500 mb-5">Desk support timings</p>
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Mon – Sat:</strong> 09:00 AM – 08:00 PM IST</p>
                <p><strong>Sunday:</strong> 10:00 AM – 04:00 PM IST</p>
                <p><strong>Queue Engine:</strong> 24/7 Live Telemetry</p>
              </div>
            </div>
          </div>

          {/* Card 3: Registered Address */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5 border border-purple-200">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Registered Address</h3>
              <p className="text-xs text-slate-500 mb-5">Headquarters</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Kynisto Technologies Inc.<br />
                B-5/13, DLF Ankur Vihar, Loni,<br />
                Ghaziabad, Uttar Pradesh, India – 201102
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Container with Spacious Padding */}
        <section className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Send Us a Direct Message</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-8">
            Fill in the form below and our team will get back to you promptly.
          </p>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-lg font-bold text-slate-900">Thank you, {name || "there"}!</p>
                <p className="text-sm text-emerald-800 mt-1">Your message has been received. Our support desk will contact you at {email || "your email"} shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2" htmlFor="contact-name">
                  Your Full Name
                </label>
                <input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  placeholder="Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2" htmlFor="contact-email">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  placeholder="rahul@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2" htmlFor="contact-subject">
                  Inquiry Topic
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500 text-sm bg-slate-50 text-slate-900"
                >
                  <option>General Support / Question</option>
                  <option>Store / Clinic Onboarding Inquiry</option>
                  <option>Virtual Queue Assistance</option>
                  <option>Data Privacy / Grievance Redressal</option>
                  <option>Partnership &amp; Press</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2" htmlFor="contact-message">
                  Message / Description
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  placeholder="Describe your question or feedback in detail..."
                />
              </div>

              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-full shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
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
