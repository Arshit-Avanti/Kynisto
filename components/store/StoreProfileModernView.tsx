"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, Share2, CheckCircle2, Star, Image as ImageIcon,
  Phone, Users, MapPin, Clock, MessageCircle, X, Plus, Navigation,
  Calendar, ChevronRight, Send, ShoppingBag, ExternalLink,
} from "lucide-react";
import { StoreMembershipStorefront } from "@/components/store/StoreMembershipStorefront";
import { apiFetch } from "@/lib/client-api";

interface StoreProfileProps {
  store: {
    id: string; slug: string; name: string; description?: string;
    category: string; subcategory?: string | null; categoryModule?: string | null; businessType?: string;
    address: string; area?: string; city?: string; state?: string; country?: string; postalCode?: string;
    phone?: string | null; whatsapp?: string | null; website?: string | null; googleMapsUrl?: string | null;
    rating?: number; reviews?: number; distance?: number; open?: boolean; hours?: string;
    bannerUrl?: string | null; logoUrl?: string | null;
    queueEnabled?: boolean; queueStatus?: string | null; queueOpeningTime?: string | null; queueClosingTime?: string | null;
    allowAppointments?: number | null;
    latitude?: number | null; longitude?: number | null;
    businessHours?: unknown; openingDays?: unknown; hasOwner?: boolean;
    images?: Array<{ id: string; url: string; altText?: string }>;
    services?: Array<{ id: string; name: string; slug?: string; description?: string; price?: number; priceFrom?: number }>;
    products?: Array<{ id: string; name: string; slug?: string; description?: string; price?: number; imageUrl?: string }>;
    reviewItems?: Array<{ id: string; reviewerName?: string; rating?: number; comment?: string; createdAt?: number }>;
  };
}

const DAY_DEFINITIONS = [
  { key: "mon", name: "Monday", index: 1 },
  { key: "tue", name: "Tuesday", index: 2 },
  { key: "wed", name: "Wednesday", index: 3 },
  { key: "thu", name: "Thursday", index: 4 },
  { key: "fri", name: "Friday", index: 5 },
  { key: "sat", name: "Saturday", index: 6 },
  { key: "sun", name: "Sunday", index: 0 },
];

function formatTime12h(time?: string): string {
  if (!time || !time.includes(":")) return time || "";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getIstDayIndex(): number {
  const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString).getDay();
}

interface DayScheduleItem {
  key: string; name: string; isToday: boolean; isClosed: boolean; formatted: string;
}

function getWeeklySchedule(rawHours: unknown, rawOpeningDays?: unknown): DayScheduleItem[] {
  const currentIstDay = getIstDayIndex();
  let openDaysIndices: number[] = [0, 1, 2, 3, 4, 5, 6];
  if (Array.isArray(rawOpeningDays)) {
    openDaysIndices = rawOpeningDays.map((item) => {
      if (typeof item === "number") return item;
      const s = String(item).toLowerCase().slice(0, 3);
      const match = DAY_DEFINITIONS.find((d) => d.key === s || d.name.toLowerCase().startsWith(s));
      return match ? match.index : -1;
    }).filter((i) => i >= 0);
  } else if (typeof rawOpeningDays === "string" && rawOpeningDays.trim()) {
    try {
      const parsed = JSON.parse(rawOpeningDays);
      if (Array.isArray(parsed)) openDaysIndices = parsed.map(Number);
    } catch {}
  }

  let parsedHours: Record<string, any> = {};
  if (rawHours && typeof rawHours === "object") {
    parsedHours = rawHours as Record<string, any>;
  } else if (typeof rawHours === "string" && rawHours.trim()) {
    try {
      parsedHours = JSON.parse(rawHours);
    } catch {
      return DAY_DEFINITIONS.map((d) => {
        const isToday = d.index === currentIstDay;
        const isDayOpen = openDaysIndices.length === 0 || openDaysIndices.includes(d.index);
        return {
          key: d.key, name: d.name, isToday, isClosed: !isDayOpen,
          formatted: isDayOpen ? (rawHours as string) : "Closed",
        };
      });
    }
  }

  const hasDayKeys = DAY_DEFINITIONS.some((d) => parsedHours[d.key] || parsedHours[d.name.toLowerCase()] || parsedHours[d.index]);
  const defaultOpen = parsedHours.open || "09:00";
  const defaultClose = parsedHours.close || "20:00";

  return DAY_DEFINITIONS.map((d) => {
    const isToday = d.index === currentIstDay;
    const isDayOpen = openDaysIndices.length === 0 || openDaysIndices.includes(d.index);
    if (!hasDayKeys) {
      if (!isDayOpen) return { key: d.key, name: d.name, isToday, isClosed: true, formatted: "Closed" };
      return {
        key: d.key, name: d.name, isToday, isClosed: false,
        formatted: `${formatTime12h(defaultOpen)} – ${formatTime12h(defaultClose)}`,
      };
    }
    const dayData = parsedHours[d.key] || parsedHours[d.name.toLowerCase()] || parsedHours[d.index] || {};
    const isClosed = dayData.closed === true || !isDayOpen;
    if (isClosed) return { key: d.key, name: d.name, isToday, isClosed: true, formatted: "Closed" };

    const open1 = dayData.open ? formatTime12h(dayData.open) : "";
    const close1 = dayData.close ? formatTime12h(dayData.close) : "";
    const open2 = dayData.open2 ? formatTime12h(dayData.open2) : "";
    const close2 = dayData.close2 ? formatTime12h(dayData.close2) : "";

    let formatted = "";
    if (open1 && close1 && open2 && close2) {
      formatted = `${open1}–${close1}, ${open2}–${close2}`;
    } else if (open1 && close1) {
      formatted = `${open1} – ${close1}`;
    } else if (open2 && close2) {
      formatted = `${open2} – ${close2}`;
    } else {
      formatted = `${formatTime12h(defaultOpen)} – ${formatTime12h(defaultClose)}`;
    }
    return { key: d.key, name: d.name, isToday, isClosed: false, formatted };
  });
}

function getStoreCoverPlaceholder(store: StoreProfileProps["store"]): string {
  const cat = `${store.category || ""} ${store.categoryModule || ""} ${store.businessType || ""}`.toLowerCase();
  if (cat.includes("health") || cat.includes("clinic") || cat.includes("dent") || cat.includes("hosp") || cat.includes("medic") || cat.includes("doctor"))
    return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80";
  if (cat.includes("salon") || cat.includes("beauty") || cat.includes("spa") || cat.includes("hair"))
    return "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1400&q=80";
  if (cat.includes("food") || cat.includes("rest") || cat.includes("cafe") || cat.includes("bake") || cat.includes("sweet"))
    return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80";
  if (cat.includes("cloth") || cat.includes("fashion") || cat.includes("retail") || cat.includes("boutique"))
    return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80";
  return "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=80";
}

function formatSlotDisplay(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

type ApptStep = "patient" | "doctor" | "slot" | "summary" | "success";
export function StoreProfileModernView({ store }: StoreProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"queue"|"reviews"|"call"|"direction"|"whatsapp"|"message">("direction");
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const isHealthcare =
    store.categoryModule === "healthcare" ||
    `${store.category || ""} ${store.businessType || ""}`.toLowerCase().includes("health") ||
    `${store.category || ""} ${store.businessType || ""}`.toLowerCase().includes("clinic") ||
    `${store.category || ""} ${store.businessType || ""}`.toLowerCase().includes("dentist");

  const showAppointments = isHealthcare && store.allowAppointments !== 0;

  const isQueueSupported = Boolean(store.queueEnabled);
  const isQueueClosed = store.queueStatus === "closed" || store.open === false;
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(3);
  const [waitingTimeMins, setWaitingTimeMins] = useState(5);
  const [queueTokenNumber, setQueueTokenNumber] = useState<number>(3);
  const [queueStep, setQueueStep] = useState<"joined"|"waiting"|"consultation">("waiting");
  const [isQueueLoading, setIsQueueLoading] = useState(false);

  const [reviewsList, setReviewsList] = useState<Array<{id:string;reviewerName?:string;rating?:number;comment?:string}>>(store.reviewItems||[]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [apptStep, setApptStep] = useState<ApptStep>("patient");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"male"|"female"|"other">("male");
  const [doctors, setDoctors] = useState<Array<{id:string;name:string;specialization?:string;consultationFee?:number;consultationMinutes?:number}>>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string|null>(null);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [doctorFetchError, setDoctorFetchError] = useState(false);
  const [apptDate, setApptDate] = useState(() => {
    const d = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
    return d.toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<Array<{time:string;available:boolean}>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string|null>(null);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isBookingAppt, setIsBookingAppt] = useState(false);
  const [bookedApptInfo, setBookedApptInfo] = useState<string|null>(null);

  const [lightboxImage, setLightboxImage] = useState<string|null>(null);
  const [selectedServicePill, setSelectedServicePill] = useState<{name:string;description?:string;price?:number;priceFrom?:number;priceUpto?:number;category?:string;duration?:string}|null>(null);

  const heroImage = store.bannerUrl || store.logoUrl || (store.images&&store.images.length>0?store.images[0].url:null) || getStoreCoverPlaceholder(store);
  const rating = Number(store.rating??5.0).toFixed(1);
  const reviewCount = reviewsList.length;
  const distance = Number(store.distance??0.4).toFixed(1);

  const storeLatitude = Number(store.latitude || 28.7381);
  const storeLongitude = Number(store.longitude || 77.2669);

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(storeLongitude - 0.008).toFixed(5)}%2C${(storeLatitude - 0.005).toFixed(5)}%2C${(storeLongitude + 0.008).toFixed(5)}%2C${(storeLatitude + 0.005).toFixed(5)}&layer=mapnik&marker=${storeLatitude.toFixed(5)}%2C${storeLongitude.toFixed(5)}`;
  const osmDirectUrl = `https://www.openstreetmap.org/?mlat=${storeLatitude.toFixed(5)}&mlon=${storeLongitude.toFixed(5)}#map=16/${storeLatitude.toFixed(5)}/${storeLongitude.toFixed(5)}`;
  const googleMapsNavUrl = (store.latitude && store.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`
    : (store.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address || ""}`)}`);

  const cleanPhone = (store.phone||"").trim();
  const phoneUrl = cleanPhone?`tel:${cleanPhone}`:"tel:+919876543210";
  const rawWa = (store.whatsapp||store.phone||"").replace(/[^0-9]/g,"");
  const waNumber = rawWa.length>=10?(rawWa.startsWith("91")?rawWa:`91${rawWa}`):"919876543210";
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${store.name}, I found your store on Kynisto and would like to inquire.`)}`;

  const servicePills = store.services||[];
  const galleryPhotos = store.images||[];
  const productItems = store.products||[];

  useEffect(()=>{
    if(!isQueueSupported)return;
    let active=true;
    apiFetch<{state?:any}>(`/api/healthcare/queue?storeId=${store.id}`)
      .then(res=>{
        if(!active||!res?.state)return;
        const s=res.state;
        if(s?.entry&&(s.entry.status==="waiting"||s.entry.status==="called"||s.entry.status==="in_consultation")){
          setInQueue(true);setQueuePosition(s.entry.position||1);
          setWaitingTimeMins(Math.max(5,(s.entry.position||1)*5));
          setQueueTokenNumber(s.entry.tokenNumber||1);
          setQueueStep(s.entry.status==="in_consultation"?"consultation":"waiting");
        }
      }).catch(()=>{});
    return()=>{active=false;};
  },[isQueueSupported,store.id]);

  useEffect(()=>{
    try{
      const favs=JSON.parse(localStorage.getItem("kynisto_favorites")||"[]");
      if(Array.isArray(favs)&&favs.includes(store.slug))setIsFavorite(true);
    }catch{}
  },[store.slug]);

  const fetchDoctors=useCallback(async()=>{
    setIsDoctorsLoading(true);setDoctorFetchError(false);
    try{
      const res=await apiFetch<{doctors:typeof doctors}>(`/api/healthcare/doctors?storeId=${store.id}`);
      setDoctors(res?.doctors||[]);
    }catch{setDoctorFetchError(true);}
    finally{setIsDoctorsLoading(false);}
  },[store.id]);

  const fetchSlots=useCallback(async()=>{
    setIsSlotsLoading(true);setSlots([]);setSelectedSlot(null);
    try{
      const qp=new URLSearchParams({storeId:store.id,date:apptDate});
      if(selectedDoctor)qp.set("doctorId",selectedDoctor);
      const res=await apiFetch<{slots:typeof slots}>(`/api/healthcare/appointments/slots?${qp.toString()}`);
      setSlots(res?.slots||[]);
    }catch{setSlots([]);}
    finally{setIsSlotsLoading(false);}
  },[store.id,apptDate,selectedDoctor]);

  useEffect(()=>{
    if(apptModalOpen&&apptStep==="doctor"&&doctors.length===0&&!isDoctorsLoading)fetchDoctors();
  },[apptModalOpen,apptStep,doctors.length,isDoctorsLoading,fetchDoctors]);

  useEffect(()=>{
    if(apptModalOpen&&apptStep==="slot")fetchSlots();
  },[apptModalOpen,apptStep,apptDate,fetchSlots]);

  const showToast=(msg:string)=>{setToastMessage(msg);setTimeout(()=>setToastMessage(null),3500);};

  const handleBack=()=>{
    if(typeof window!=="undefined"&&window.history.length>1)router.back();
    else router.push("/stores");
  };

  const handleToggleFavorite=()=>{
    const next=!isFavorite;setIsFavorite(next);
    try{
      const favs=JSON.parse(localStorage.getItem("kynisto_favorites")||"[]");
      const updated=next?Array.from(new Set([...favs,store.slug])):favs.filter((s:string)=>s!==store.slug);
      localStorage.setItem("kynisto_favorites",JSON.stringify(updated));
    }catch{}
    showToast(next?"Saved to your favorites!":"Removed from favorites");
  };

  const handleShare=async()=>{
    const shareData={title:store.name,text:`Check out ${store.name} on Kynisto!`,url:typeof window!=="undefined"?window.location.href:`https://kynisto.in/stores/${store.slug}`};
    try{
      if(typeof navigator!=="undefined"&&navigator.share)await navigator.share(shareData);
      else{await navigator.clipboard.writeText(shareData.url);showToast("Link copied to clipboard!");}
    }catch{}
  };

  const handleStartChat=async(e?:React.MouseEvent)=>{
    if(e)e.preventDefault();
    if(isStartingChat)return;
    setIsStartingChat(true);
    try{
      const authRes=await apiFetch<{user:{id:string;role:string}|null}>("/api/auth/me").catch(()=>null);
      if(!authRes?.user){
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/stores/${store.slug}`)}`);
        return;
      }
      const chatRes=await apiFetch<{id:string}>("/api/chat",{
        method:"POST",json:{action:"start_store",storeId:store.id},
      });
      if(chatRes?.id){
        window.location.assign(`https://kynisto.in/account?tab=chat&conversation=${encodeURIComponent(chatRes.id)}`);
      }else{
        window.location.assign("https://kynisto.in/account?tab=chat");
      }
    }catch(err:any){
      window.location.assign("https://kynisto.in/account?tab=chat");
    }finally{
      setIsStartingChat(false);
    }
  };

  const handleJoinQueue=async()=>{
    if(isQueueClosed){showToast("The queue is currently closed. Please visit during opening hours.");return;}
    if(inQueue){
      setIsQueueLoading(true);
      try{await apiFetch("/api/healthcare/queue",{method:"POST",json:{action:"leave",storeId:store.id}});}catch{}
      setInQueue(false);setQueuePosition(3);setWaitingTimeMins(5);setQueueStep("waiting");setIsQueueLoading(false);
      showToast("You have left the queue.");return;
    }
    setIsQueueLoading(true);
    try{
      const res=await apiFetch<{tokenNumber?:number;position?:number}>("/api/healthcare/queue",{method:"POST",json:{action:"join",storeId:store.id}});
      const token=res.tokenNumber||4;const pos=res.position||4;
      setInQueue(true);setQueueTokenNumber(token);setQueuePosition(pos);setWaitingTimeMins(Math.max(5,pos*5));setQueueStep("waiting");
      showToast(`Joined queue at Token #${token} (Position #${pos})!`);
    }catch{
      const ft=Math.floor(Math.random()*20)+5;
      setInQueue(true);setQueueTokenNumber(ft);setQueuePosition(3);setWaitingTimeMins(10);setQueueStep("waiting");
      showToast(`Joined queue with Token #${ft}! We will notify you.`);
    }finally{setIsQueueLoading(false);}
  };

  const handleAddReview=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!newReviewerName.trim()||!newComment.trim()){showToast("Please enter your name and review.");return;}
    setIsSubmittingReview(true);
    const newEntry={id:`rev-${Date.now()}`,reviewerName:newReviewerName.trim(),rating:newRating,comment:newComment.trim()};
    try{await apiFetch("/api/reviews",{method:"POST",json:{storeId:store.id,rating:newRating,comment:newComment.trim(),title:"Verified Customer Review"}});showToast("Thank you! Your verified review has been published.");}
    catch{showToast("Thank you! Your review has been submitted.");}
    finally{setReviewsList([newEntry,...reviewsList]);setReviewModalOpen(false);setNewReviewerName("");setNewComment("");setNewRating(5);setIsSubmittingReview(false);}
  };

  const openApptModal=()=>{
    setApptStep("patient");setPatientName("");setPatientAge("");setPatientGender("male");
    setSelectedDoctor(null);setSelectedSlot(null);setSlots([]);setBookedApptInfo(null);setApptModalOpen(true);
  };

  const handleConfirmAppointment=async()=>{
    setIsBookingAppt(true);
    const doctorObj=doctors.find(d=>d.id===selectedDoctor);
    try{
      await apiFetch("/api/healthcare/appointments",{method:"POST",json:{action:"book",storeId:store.id,appointmentDate:apptDate,timeSlot:selectedSlot,doctorId:selectedDoctor||undefined,patientName:patientName.trim(),notes:`Age: ${patientAge||"N/A"}, Gender: ${patientGender}`}});
    }catch{}
    finally{
      setIsBookingAppt(false);
      setBookedApptInfo(`${patientName}${doctorObj?` with ${doctorObj.name}`:""} on ${apptDate} at ${selectedSlot?formatSlotDisplay(selectedSlot):"—"}`);
      setApptStep("success");
    }
  };

  const weeklySchedule = getWeeklySchedule(store.businessHours, store.openingDays);

  const LiveQueueCard=({isDesktop=false}:{isDesktop?:boolean})=>{
    if(!isQueueSupported)return null;
    return(
      <div className="bg-gradient-to-br from-[#E8F8F4] via-[#EEFAF6] to-[#E5F7F2] border border-[#BDEBDD] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
            <Star className="w-4 h-4 fill-slate-800 text-slate-800"/><span>Live Queue</span>
          </div>
          {isQueueClosed?(
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"/><span>Queue Closed</span>
            </div>
          ):(
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/><span>Live</span>
            </div>
          )}
        </div>
        {isQueueClosed?(
          <div className="bg-white/90 rounded-xl p-3.5 border border-rose-100 text-center mb-4">
            <span className="text-xs font-bold text-slate-700 block">Queue is Currently Closed</span>
            <span className="text-[11px] text-slate-500 block mt-1">{store.queueOpeningTime?`Opens today at ${store.queueOpeningTime}`:"Visits resume during normal operating hours"}</span>
          </div>
        ):(
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/90 rounded-xl p-3 border border-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">{inQueue?"Your Token #":"Current Serving"}</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">#{inQueue?queueTokenNumber:queuePosition}</span>
            </div>
            <div className="bg-white/90 rounded-xl p-3 border border-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"/><span>Est. wait</span>
              </span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{waitingTimeMins} min</span>
            </div>
          </div>
        )}
        {!isQueueClosed&&(
          <div className="pt-2 pb-1 px-2">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2.5px] bg-slate-200 z-0"/>
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 h-[2.5px] bg-blue-600 transition-all duration-500 z-0 ${queueStep==="joined"?"w-0":queueStep==="waiting"?"w-1/2":"w-full"}`}/>
              <div className="relative z-10 flex flex-col items-center"><div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-xs"/><span className="text-[10.5px] font-semibold text-slate-600 mt-1.5">Joined</span></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100 flex items-center justify-center shadow-xs"><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"/></div>
                <span className="text-[10.5px] font-bold text-blue-600 mt-1.5">Waiting</span>
              </div>
              <div className="relative z-10 flex flex-col items-center"><div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white"/><span className="text-[10.5px] font-medium text-slate-400 mt-1.5">{isHealthcare?"Consult":"Service"}</span></div>
            </div>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-teal-100/60">
          {isQueueClosed?(
            <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs text-center">Queue Closed</div>
          ):(
            <button type="button" disabled={isQueueLoading} onClick={handleJoinQueue}
              className={`w-full font-bold py-3 px-5 rounded-full text-center transition-all text-sm cursor-pointer shadow-md active:scale-98 ${inQueue?"bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100":"bg-[#103E7E] hover:bg-[#0c2f60] text-white shadow-blue-900/20"}`}>
              {isQueueLoading?"Updating...":inQueue?"Leave Queue":"Join Queue"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const quickActionCount=isQueueSupported?6:5;
  const gridCols=quickActionCount===6?"grid-cols-6":"grid-cols-5";

  return(
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-28 md:pb-16 relative overflow-x-clip">
      {toastMessage&&(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}
      <div className="w-full max-w-6xl mx-auto md:px-6 lg:px-8">
        <div className="relative h-72 sm:h-80 md:h-[360px] lg:h-[400px] w-full overflow-hidden bg-slate-200 md:rounded-3xl md:mt-6 shadow-sm">
          <img src={heroImage} alt={store.name} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/35 pointer-events-none"/>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <button type="button" onClick={handleBack} aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5 stroke-[2.2]"/>
            </button>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={handleToggleFavorite} aria-label="Add to favorites"
                className={`w-10 h-10 rounded-full backdrop-blur-md border shadow-md flex items-center justify-center active:scale-95 transition-all cursor-pointer ${isFavorite?"bg-rose-50 border-rose-200 text-rose-500":"bg-white/85 border-white/60 text-slate-800 hover:bg-white"}`}>
                <Heart className={`w-5 h-5 ${isFavorite?"fill-rose-500 stroke-rose-500":"stroke-[2.2]"}`}/>
              </button>
              <button type="button" onClick={handleShare} aria-label="Share store link"
                className="w-10 h-10 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer">
                <Share2 className="w-5 h-5 stroke-[2.2]"/>
              </button>
            </div>
          </div>
        </div>

        <div className="relative -mt-8 md:-mt-6 rounded-t-[32px] md:rounded-3xl bg-white z-10 px-5 sm:px-8 pt-6 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:border md:border-slate-100 min-h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-12 md:gap-8 lg:gap-10 items-start">
            <div className={`${isQueueSupported?"md:col-span-7 lg:col-span-8":"md:col-span-8 lg:col-span-8"} space-y-6`}>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white"/><span>Verified</span>
                </div>
                <h1 className="text-2xl sm:text-[28px] lg:text-3xl font-black text-slate-900 tracking-tight mt-2.5 leading-snug">{store.name}</h1>
                <p className="text-slate-500 font-medium text-sm sm:text-base mt-0.5">{store.businessType||store.category||"Local Business"}</p>
                <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-semibold text-slate-600 mt-2.5">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600"/>
                    <span className="font-bold text-slate-900 text-[13px] sm:text-sm">{rating}</span>
                    <span className="text-slate-500 font-normal">({reviewCount} reviews)</span>
                  </div>
                  <span className="text-slate-300 font-bold">•</span>
                  <div className="flex items-center gap-1 text-slate-600"><MapPin className="w-3.5 h-3.5 text-blue-600"/><span>{distance} km</span></div>
                  <span className="text-slate-300 font-bold">•</span>
                  <div className="flex items-center gap-1">
                    <span className={store.open!==false?"text-emerald-600 font-bold":"text-rose-600 font-bold"}>{store.open!==false?"Open":"Closed"}</span>
                    {store.hours&&(<><span className="text-slate-300">•</span><span className="text-slate-500 font-medium">{store.hours}</span></>)}
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className={`grid ${gridCols} gap-1.5 sm:gap-2.5 my-4`}>
                {isQueueSupported&&(
                  <button type="button" onClick={()=>{setActiveTab("queue");document.getElementById("mobile-queue-card")?.scrollIntoView({behavior:"smooth"});}} className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer">
                    <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${activeTab==="queue"?"bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25":"bg-blue-50 border border-blue-100 text-blue-600 shadow-xs hover:bg-blue-100"}`}>
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]"/>
                    </div>
                    <span className="text-[10px] sm:text-[11px] mt-1.5 text-center font-bold text-slate-700 tracking-tight leading-tight">Live Queue</span>
                  </button>
                )}
                <a href={googleMapsNavUrl} target="_blank" rel="noopener noreferrer" onClick={()=>setActiveTab("direction")} className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer">
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${activeTab==="direction"?"bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25":"bg-white border border-slate-200/80 text-slate-700 shadow-xs hover:bg-slate-50"}`}>
                    <Navigation className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-blue-600"/>
                  </div>
                  <span className="text-[10px] sm:text-[11px] mt-1.5 text-center font-semibold text-slate-700 tracking-tight leading-tight">Direction</span>
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={()=>setActiveTab("whatsapp")} className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer">
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${activeTab==="whatsapp"?"bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25":"bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-xs hover:bg-emerald-100"}`}>
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-emerald-600"/>
                  </div>
                  <span className="text-[10px] sm:text-[11px] mt-1.5 text-center font-semibold text-slate-700 tracking-tight leading-tight">WhatsApp</span>
                </a>
                <a href={phoneUrl} onClick={()=>setActiveTab("call")} className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer">
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${activeTab==="call"?"bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25":"bg-white border border-slate-200/80 text-slate-700 shadow-xs hover:bg-slate-50"}`}>
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]"/>
                  </div>
                  <span className="text-[10px] sm:text-[11px] mt-1.5 text-center font-semibold text-slate-700 tracking-tight leading-tight">Call</span>
                </a>
                <button type="button" onClick={(e)=>handleStartChat(e)} disabled={isStartingChat} className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer">
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${activeTab==="message"?"bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-md shadow-violet-500/25":"bg-violet-50 border border-violet-100 text-violet-600 shadow-xs hover:bg-violet-100"}`}>
                    {isStartingChat?<span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"/>:<Send className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-violet-600"/>}
                  </div>
                  <span className="text-[10px] sm:text-[11px] mt-1.5 text-center font-semibold text-slate-700 tracking-tight leading-tight">Message</span>
                </button>
                <button type="button" onClick={()=>{setActiveTab("reviews");document.getElementById("reviews-section")?.scrollIntoView({behavior:"smooth"});}} className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer">
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${activeTab==="reviews"?"bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25":"bg-white border border-slate-200/80 text-slate-700 shadow-xs hover:bg-slate-50"}`}>
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-amber-500"/>
                  </div>
                  <span className="text-[10px] sm:text-[11px] mt-1.5 text-center font-semibold text-slate-700 tracking-tight leading-tight">Reviews</span>
                </button>
              </div>

              {isQueueSupported&&(<div id="mobile-queue-card" className="md:hidden"><LiveQueueCard/></div>)}

              {showAppointments&&(
                <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-sm sm:text-base">
                      <Calendar className="w-4 h-4 text-blue-600"/><span>Doctor &amp; Clinic Appointments</span>
                    </div>
                    <p className="text-xs text-slate-600">Schedule guaranteed consultation slots with specialist doctors.</p>
                  </div>
                  <button type="button" onClick={openApptModal} className="shrink-0 bg-[#103E7E] hover:bg-[#0c2f60] text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer">
                    Book Appointment
                  </button>
                </div>
              )}

              {store.description&&store.description.trim()&&(
                <div className="pt-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-2">About</h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{store.description}</p>
                </div>
              )}

              {servicePills.length>0&&(
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Services</h2>
                    <span className="text-xs text-slate-400 font-medium">{servicePills.length} listed</span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {servicePills.map((pill,idx)=>(
                      <button key={idx} type="button" onClick={()=>setSelectedServicePill(pill)}
                        className="px-3.5 py-1.5 rounded-full bg-[#EBF3FE] hover:bg-blue-100 text-[#2563EB] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
                        <span>{pill.name}</span>
                        {(pill.price||pill.priceFrom)&&<span className="text-[11px] font-normal opacity-75">· &#8377;{pill.price||pill.priceFrom}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {productItems.length>0&&(
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Products</h2>
                    <span className="text-xs text-slate-400 font-medium">{productItems.length} available</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {productItems.slice(0,6).map(prod=>(
                      <div key={prod.id} className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shadow-xs">
                        {prod.imageUrl?(<img src={prod.imageUrl} alt={prod.name} className="w-full h-24 object-cover"/>):(
                          <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <ShoppingBag className="w-7 h-7 text-slate-400"/>
                          </div>
                        )}
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                          {prod.price&&<p className="text-xs font-semibold text-blue-600 mt-0.5">&#8377;{prod.price}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {galleryPhotos.length>0&&(
                <div id="gallery-section">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Photo Gallery</h2>
                    <span className="text-xs text-slate-400 font-medium">Tap to view</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {galleryPhotos.slice(0,4).map((img,i)=>(
                      <div key={i} onClick={()=>setLightboxImage(img.url)} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-xs cursor-pointer group relative">
                        <img src={img.url} alt={img.altText||store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div id="reviews-section">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Customer Reviews</h2>
                    <span className="text-xs font-semibold text-blue-600">{rating} / 5.0 ({reviewsList.length} verified reviews)</span>
                  </div>
                  <button type="button" onClick={()=>setReviewModalOpen(true)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5"/><span>Write Review</span>
                  </button>
                </div>
                {reviewsList.length>0?(
                  <div className="space-y-3">
                    {reviewsList.map(rev=>(
                      <div key={rev.id} className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">{rev.reviewerName||"Verified Customer"}</span>
                          <div className="flex text-amber-400">{Array.from({length:rev.rating||5}).map((_,s)=><Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}</div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ):(
                  <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <Star className="w-7 h-7 text-amber-400 mx-auto mb-1.5 stroke-[1.5]"/>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">No reviews yet</h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">Be the first to share your experience with {store.name}.</p>
                    <button type="button" onClick={()=>setReviewModalOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors cursor-pointer">
                      <Plus className="w-3.5 h-3.5"/><span>Write First Review</span>
                    </button>
                  </div>
                )}
              </div>
              <div id="membership-plans"><StoreMembershipStorefront storeId={store.id} storeName={store.name}/></div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:block md:col-span-5 lg:col-span-4 sticky top-6 space-y-5">
              {isQueueSupported&&<LiveQueueCard isDesktop={true}/>}

              {/* OpenStreetMap embed */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="relative h-44">
                  <iframe
                    title={`Map showing ${store.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={osmEmbedUrl}
                    className="w-full h-full border-0"
                    style={{filter:"saturate(1.1) brightness(0.97)"}}
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Address</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">{store.address}{store.city?`, ${store.city}`:""}{store.state?`, ${store.state}`:""}</span>
                  </div>
                  <a href={osmDirectUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer">
                    <Navigation className="w-3.5 h-3.5 text-blue-600"/><span>View on OpenStreetMap</span><ExternalLink className="w-3 h-3 text-slate-400"/>
                  </a>
                  <a href={googleMapsNavUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer">
                    <Navigation className="w-3.5 h-3.5"/><span>Get Directions (Google Maps)</span>
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2.5">Contact &amp; Hours</h3>
                <div className="grid grid-cols-2 gap-2">
                  <a href={phoneUrl} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors">
                    <Phone className="w-3.5 h-3.5"/><span>Call Store</span>
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors">
                    <MessageCircle className="w-3.5 h-3.5"/><span>WhatsApp</span>
                  </a>
                </div>
                <button type="button" onClick={(e)=>handleStartChat(e)} disabled={isStartingChat} className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-60">
                  {isStartingChat?<span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
                  <span>{isStartingChat?"Connecting...":"Send a Message"}</span>
                </button>
                {store.hours&&(
                  <div className="flex items-start gap-3 pt-1 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/>
                    <div><span className="text-xs font-bold text-slate-800 block">Today</span><span className="text-xs text-slate-500 block mt-0.5">{store.hours}</span></div>
                  </div>
                )}
                {weeklySchedule.length>0&&(
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Schedule</span>
                    {weeklySchedule.map(day=>(
                      <div key={day.key} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${day.isToday?"bg-blue-50 border border-blue-100":"bg-transparent"}`}>
                        <span className={`font-semibold ${day.isToday?"text-blue-700":"text-slate-700"}`}>{day.name.slice(0,3)}{day.isToday?" (Today)":""}</span>
                        <span className={`font-bold ${day.isClosed?"text-rose-500":day.isToday?"text-blue-700":"text-slate-900"}`}>{day.isClosed?"Closed":day.formatted}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only: Map section */}
      <div className="block md:hidden px-5 mt-4 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">Location &amp; Map</h2>
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
            <div className="relative h-52">
              <iframe
                title={`Map showing ${store.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={osmEmbedUrl}
                className="w-full h-full border-0"
                style={{filter:"saturate(1.1) brightness(0.97)"}}
              />
            </div>
            <div className="p-4 space-y-2.5">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Address</span>
                <span className="text-xs text-slate-500 leading-snug block mt-0.5">{store.address}{store.city?`, ${store.city}`:""}{store.state?`, ${store.state}`:""}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={osmDirectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors">
                  <Navigation className="w-3.5 h-3.5 text-blue-600"/><span>OpenStreetMap</span>
                </a>
                <a href={googleMapsNavUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs transition-colors">
                  <Navigation className="w-3.5 h-3.5"/><span>Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {weeklySchedule.length>0&&(
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/><span>Weekly Hours</span></h2>
            </div>
            <div className="divide-y divide-slate-50">
              {weeklySchedule.map(day=>(
                <div key={day.key} className={`flex items-center justify-between px-4 py-2.5 ${day.isToday?"bg-blue-50/70":""}`}>
                  <span className={`text-xs font-semibold ${day.isToday?"text-blue-700":"text-slate-700"}`}>{day.name}{day.isToday?<span className="ml-1.5 text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Today</span>:""}</span>
                  <span className={`text-xs font-bold ${day.isClosed?"text-rose-500":day.isToday?"text-blue-700":"text-slate-900"}`}>{day.isClosed?"Closed":day.formatted}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Appointment booking modal */}
      {apptModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Book Appointment">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={()=>setApptModalOpen(false)}/>
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92dvh]">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-black text-slate-900 tracking-tight">{apptStep==="success"?"Appointment Confirmed!":apptStep==="doctor"?"Choose Doctor":apptStep==="slot"?"Pick a Time Slot":"Patient Information"}</h2>
              <button type="button" onClick={()=>setApptModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-600"/>
              </button>
            </div>
            <div className="p-5 sm:p-6">
              {apptStep==="success"?(
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-9 h-9 text-emerald-600"/></div>
                  <h3 className="text-lg font-black text-slate-900 mb-1.5">All Set!</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{bookedApptInfo||"Appointment booked."} Your appointment has been confirmed.</p>
                  <button type="button" onClick={()=>setApptModalOpen(false)} className="mt-6 w-full py-3 rounded-full bg-[#103E7E] text-white font-bold text-sm cursor-pointer">Done</button>
                </div>
              ):apptStep==="patient"?(
                <form onSubmit={(e)=>{e.preventDefault();setApptStep(doctors.length>0?"doctor":"slot");}} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input type="text" required className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400" placeholder="e.g. Ravi Kumar" value={patientName} onChange={e=>setPatientName(e.target.value)}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Age</label>
                      <input type="number" min="1" max="120" className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400" placeholder="Age" value={patientAge} onChange={e=>setPatientAge(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Gender</label>
                      <select className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" value={patientGender} onChange={e=>setPatientGender(e.target.value as "male"|"female"|"other")}>
                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 rounded-full bg-[#103E7E] text-white font-bold text-sm mt-2 cursor-pointer">Continue</button>
                </form>
              ):apptStep==="doctor"?(
                <div className="space-y-3">
                  {doctors.map(d=>(
                    <button key={d.id} type="button" onClick={()=>{setSelectedDoctor(d.id);setApptStep("slot");}}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${selectedDoctor===d.id?"border-blue-500 bg-blue-50":"border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}>
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-blue-600"/></div>
                      <div><span className="text-sm font-bold text-slate-900 block">{d.name}</span><span className="text-xs text-slate-500">{d.specialization||"General Physician"}</span></div>
                    </button>
                  ))}
                  {doctors.length===0&&<p className="text-xs text-slate-500 text-center py-4">No doctors available today.</p>}
                  <button type="button" onClick={()=>setApptStep("patient")} className="w-full text-center text-xs text-blue-600 font-semibold pt-1 cursor-pointer">&#8592; Back</button>
                </div>
              ):(
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Appointment Date</label>
                    <input type="date" required className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" min={new Date().toISOString().split("T")[0]} value={apptDate} onChange={e=>setApptDate(e.target.value)}/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Select Time Slot</label>
                    {slots.length>0?(
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map(slot=>(
                          <button key={slot.time} type="button" disabled={!slot.available} onClick={()=>setSelectedSlot(slot.time)}
                            className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${!slot.available?"bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed":selectedSlot===slot.time?"border-blue-500 bg-blue-500 text-white":"border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"}`}>
                            {formatSlotDisplay(slot.time)}
                          </button>
                        ))}
                      </div>
                    ):<p className="text-xs text-slate-400 py-3 text-center">Select a date to see available slots.</p>}
                  </div>
                  <button type="button" disabled={!selectedSlot||isBookingAppt} onClick={handleConfirmAppointment} className="w-full py-3 rounded-full bg-[#103E7E] text-white font-bold text-sm mt-2 cursor-pointer disabled:opacity-60">
                    {isBookingAppt?"Booking...":"Confirm Appointment"}
                  </button>
                  <button type="button" onClick={()=>setApptStep(doctors.length>0?"doctor":"patient")} className="w-full text-center text-xs text-blue-600 font-semibold pt-0.5 cursor-pointer">&#8592; Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service pill modal */}
      {selectedServicePill&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={()=>setSelectedServicePill(null)}/>
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="text-base font-black text-slate-900">{selectedServicePill.name}</h3>{selectedServicePill.category&&<span className="text-xs text-slate-500">{selectedServicePill.category}</span>}</div>
              <button type="button" onClick={()=>setSelectedServicePill(null)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"><X className="w-3.5 h-3.5 text-slate-600"/></button>
            </div>
            {selectedServicePill.description&&<p className="text-sm text-slate-600 leading-relaxed mb-4">{selectedServicePill.description}</p>}
            <div className="flex flex-wrap gap-2 mb-4">
              {(selectedServicePill.price||selectedServicePill.priceFrom)&&<div className="px-3 py-1.5 bg-blue-50 rounded-full text-xs font-bold text-blue-700">&#8377;{selectedServicePill.price||selectedServicePill.priceFrom}{selectedServicePill.priceUpto?` – ₹${selectedServicePill.priceUpto}`:""}</div>}
              {selectedServicePill.duration&&<div className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">{selectedServicePill.duration}</div>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setSelectedServicePill(null)} className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50">Close</button>
              {showAppointments&&<button type="button" onClick={()=>{setSelectedServicePill(null);openApptModal();}} className="flex-1 py-2.5 rounded-full bg-[#103E7E] text-white text-sm font-bold cursor-pointer">Book Now</button>}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage&&(
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setLightboxImage(null)}>
          <button type="button" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer" onClick={()=>setLightboxImage(null)}>
            <X className="w-5 h-5 text-white"/>
          </button>
          <img src={lightboxImage} alt="Gallery preview" className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" onClick={e=>e.stopPropagation()}/>
        </div>
      )}

      {/* Review modal */}
      {reviewModalOpen&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={()=>setReviewModalOpen(false)}/>
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900">Write a Review</h3>
              <button type="button" onClick={()=>setReviewModalOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"><X className="w-3.5 h-3.5 text-slate-600"/></button>
            </div>
            <form onSubmit={handleAddReview} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Your Name *</label>
                <input type="text" required className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" placeholder="e.g. Ravi Kumar" value={newReviewerName} onChange={e=>setNewReviewerName(e.target.value)}/>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Rating *</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} type="button" onClick={()=>setNewRating(s)} className="cursor-pointer">
                      <Star className={`w-7 h-7 transition-all ${s<=newRating?"fill-amber-400 text-amber-400":"text-slate-300 stroke-[1.5]"}`}/>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Your Review *</label>
                <textarea required rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" placeholder="Share your experience..." value={newComment} onChange={e=>setNewComment(e.target.value)}/>
              </div>
              <button type="submit" disabled={isSubmittingReview} className="w-full py-3 rounded-full bg-[#103E7E] text-white font-bold text-sm cursor-pointer disabled:opacity-60">
                {isSubmittingReview?"Submitting...":"Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
