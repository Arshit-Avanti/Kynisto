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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar3D />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>We&apos;re Here to Help</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Contact Kynisto
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Have questions about finding local stores, managing clinic patient queues, or listing your business? Reach out to our dedicated support teams.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Card 1: Official Email Support */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Email Support</h3>
              <p className="text-xs text-slate-500 mb-4">Response within 24 hours</p>
              <div className="space-y-2 text-sm text-slate-700">
                <div>
                  <span className="text-xs text-slate-500 block">Primary Email:</span>
                  <a href="mailto:nxt.arshit@gmail.com" className="font-bold text-sky-600 hover:underline">
                    nxt.arshit@gmail.com
                  </a>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Official Desk:</span>
                  <a href="mailto:kynisto.in@gmail.com" className="font-bold text-sky-600 hover:underline">
                    kynisto.in@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Operating Hours */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Operating Hours</h3>
              <p className="text-xs text-slate-500 mb-4">Support desk timings</p>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p><strong>Monday – Saturday:</strong> 09:00 AM – 08:00 PM IST</p>
                <p><strong>Sunday:</strong> 10:00 AM – 04:00 PM IST</p>
                <p><strong>Emergency Queue Ops:</strong> 24/7 Monitoring</p>
              </div>
            </div>
          </div>

          {/* Card 3: Registered Address */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Registered Address</h3>
              <p className="text-xs text-slate-500 mb-4">Headquarters</p>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Kynisto Technologies Inc.<br />
                B-5/13, DLF Ankur Vihar, Loni,<br />
                Ghaziabad, Uttar Pradesh, India – 201102
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Container */}
        <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Send Us a Direct Message</h2>
          <p className="text-sm text-slate-600 mb-6">
            Fill in the form below and our team will get back to you promptly.
          </p>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Thank you, {name || "there"}!</p>
                <p className="text-sm text-emerald-700">Your message has been received. Our team will contact you at {email || "your email"} shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="contact-name">
                  Your Full Name
                </label>
                <input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 text-sm bg-slate-50"
                  placeholder="Rahul Gupta"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="contact-email">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 text-sm bg-slate-50"
                  placeholder="rahul@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="contact-subject">
                  Inquiry Topic
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 text-sm bg-slate-50"
                >
                  <option>General Support / Question</option>
                  <option>Store / Clinic Onboarding Inquiry</option>
                  <option>Virtual Queue Issue</option>
                  <option>Data Privacy / Grievance</option>
                  <option>Partnership &amp; Press</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="contact-message">
                  Message / Description
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-sky-500 text-sm bg-slate-50"
                  placeholder="Describe your question or feedback in detail..."
                />
              </div>

              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
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
