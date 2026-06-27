/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { District, Sect } from "../types";
import { Search, Shield, Heart, Users, MessageSquare, Star, ArrowRight, UserCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onStartSearch: (initialFilters: {
    gender: "Male" | "Female";
    district?: District;
    sect?: Sect;
  }) => void;
  onOpenAuth: (mode: "login" | "signup") => void;
}

export default function LandingPage({ onStartSearch, onOpenAuth }: LandingPageProps) {
  const [quickGender, setQuickGender] = useState<"Male" | "Female">("Female");
  const [quickDistrict, setQuickDistrict] = useState<string>("ALL");
  const [quickSect, setQuickSect] = useState<string>("ALL");

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onStartSearch({
      gender: quickGender,
      district: quickDistrict !== "ALL" ? (quickDistrict as District) : undefined,
      sect: quickSect !== "ALL" ? (quickSect as Sect) : undefined,
    });
  };

  const successStories = [
    {
      names: "Dr. Shareef & Dr. Jasmine",
      location: "Kozhikode & Malappuram",
      story: "We found our perfect match through KalyanHub in May 2025. Both families were extremely happy with the transparency of information, especially the detailed family background checks.",
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600"
    },
    {
      names: "Nihal & Aisha Nisrin",
      location: "Ernakulam & Dubai (NRI)",
      story: "Being an NRI in Dubai, finding a partner who matches my professional background and is willing to relocate was a challenge. KalyanHub's advanced filters made it so simple to connect.",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600"
    }
  ];

  return (
    <div className="relative overflow-hidden bg-[#faf8f5]" id="landing_page_container">
      {/* Decorative Top Accent */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-950 via-amber-500 to-emerald-950" />

      {/* Elegant Ambient Glowing Backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <div className="relative pt-16 pb-24 md:pt-24 md:pb-36 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/40 to-transparent">
        
        {/* Decorative Geometric Outline */}
        <div className="absolute right-6 top-12 opacity-5 pointer-events-none hidden lg:block">
          <svg width="450" height="450" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.7" className="text-emerald-900">
            <path d="M50 0 L100 50 L50 100 L0 50 Z" />
            <path d="M50 10 L90 50 L50 90 L10 50 Z" />
            <circle cx="50" cy="50" r="20" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left text column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/50 shadow-3xs">
                <Shield className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500/10" />
                <span>100% Confidential & Hand-Verified Profiles</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-emerald-950 font-bold tracking-tight leading-[1.1]">
                Begin Your Blessed Matrimonial Journey in the{" "}
                <span className="relative inline-block text-amber-700 italic">
                  Kerala Tradition
                  <span className="absolute bottom-1 left-0 w-full h-[6px] bg-amber-100 -z-10" />
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
                Welcome to <strong className="text-emerald-900 font-semibold">KalyanHub</strong>, the premier digital hub for premium Muslim matrimonial matchmaking across Kerala & the GCC. Experience high-integrity privacy, deeply detailed family verification, and beautifully secure conversations.
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-6 pt-4 max-w-lg mx-auto lg:mx-0">
                <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-gray-100 shadow-3xs text-center transition-all hover:border-amber-200">
                  <div className="text-3xl font-bold text-emerald-900 font-serif">15,000+</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Active Hearts</div>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-gray-100 shadow-3xs text-center transition-all hover:border-amber-200">
                  <div className="text-3xl font-bold text-amber-600 font-serif">100%</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Manual Vetting</div>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-gray-100 shadow-3xs text-center transition-all hover:border-amber-200">
                  <div className="text-3xl font-bold text-emerald-900 font-serif">2,400+</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Blessed Unions</div>
                </div>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                <button
                  onClick={() => onOpenAuth("signup")}
                  className="px-8 py-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-950/20"
                  id="hero_register_btn"
                >
                  Register Free Account <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
                <button
                  onClick={() => onOpenAuth("login")}
                  className="px-8 py-4 rounded-xl bg-white hover:bg-gray-50 text-emerald-950 border border-gray-200 font-semibold text-xs uppercase tracking-wider transition-all shadow-3xs cursor-pointer"
                  id="hero_login_btn"
                >
                  Sign In Privately
                </button>
              </div>
            </div>

            {/* Right Quick Search Panel / Decorative Card */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-150/50 p-8 relative"
              >
                {/* Decorative golden geometric corner ribbon */}
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden rounded-tr-3xl">
                  <div className="absolute top-[12px] right-[-32px] w-24 h-6 rotate-45 bg-amber-500 text-[9px] text-white font-bold uppercase tracking-wider text-center flex items-center justify-center shadow-xs">
                    PROMO
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Smart Matchmaking</span>
                </div>
                
                <h3 className="font-serif text-2xl text-emerald-950 font-bold mb-1">Begin Your Search</h3>
                <p className="text-xs text-gray-500 mb-8">Set your initial criteria to browse compatible profiles instantly.</p>

                <form onSubmit={handleQuickSearch} className="space-y-5">
                  {/* Gender Select */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">I am looking for a</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQuickGender("Female")}
                        className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                          quickGender === "Female"
                            ? "bg-emerald-50/80 text-emerald-900 border-emerald-900 shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Bride-to-be
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickGender("Male")}
                        className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                          quickGender === "Male"
                            ? "bg-emerald-50/80 text-emerald-900 border-emerald-900 shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Groom-to-be
                      </button>
                    </div>
                  </div>

                  {/* District select */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">District Preference</label>
                    <select
                      value={quickDistrict}
                      onChange={(e) => setQuickDistrict(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-white"
                    >
                      <option value="ALL">Any District (Kerala / NRI)</option>
                      {Object.values(District).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sect/Sub-community select */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Sect / Denomination</label>
                    <select
                      value={quickSect}
                      onChange={(e) => setQuickSect(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-white"
                    >
                      <option value="ALL">Any Sect (No bar)</option>
                      {Object.values(Sect).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:from-emerald-900 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-8 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-amber-300" /> Discover Profiles
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Highlight Features Section */}
      <div className="py-24 bg-white border-y border-gray-150/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Our Sacred Pillars</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-emerald-950 font-bold mt-2">Built with Integrity, Custom, and Trust</h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto mt-4 rounded-full" />
            <p className="text-sm text-gray-500 mt-4 leading-relaxed font-sans">
              Unlike generic match platforms, KalyanHub understands the traditional intricacies of the Kerala Muslim community. We offer elegant, secure options to preserve privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center space-y-4 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-900 border border-emerald-100 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-amber-600 fill-amber-500/10" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950 font-serif">100% Vetted Profiles</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Our administrative panels carefully confirm family details, career specifications, and identity documentation to guarantee truthfulness.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center space-y-4 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-900 border border-emerald-100 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 text-amber-600 fill-amber-500/10" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950 font-serif">Comprehensive Denominations</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Filter prospective partners by Sunni EK, Sunni AP, Mujahid, Jamaat-e-Islami, or general sects, alongside strict regional parameters across Kerala.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center space-y-4 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-900 border border-emerald-100 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6 text-amber-600 fill-amber-500/10" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950 font-serif">High-Privacy Communication</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Initiate discussions safely inside our built-in real-time chat system before exchanging telephone numbers or coordinating physical family meets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern High-End Step-by-Step Guide ("Journey to Nikah") */}
      <div className="py-24 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Simplifying the Blessed Sunnah</span>
            <h2 className="font-serif text-3xl text-emerald-950 font-bold mt-2">How It Works</h2>
            <div className="w-12 h-[3px] bg-emerald-900 mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Create Profile", text: "Complete your basic biological, cultural, occupational, and family details." },
              { step: "02", title: "Verification Check", text: "Our staff reviews and grants your profile a Gold Vetted status within 24 hours." },
              { step: "03", title: "Discover & Connect", text: "Filter candidates by sub-sects, education levels, districts, and start secure chat." },
              { step: "04", title: "Coordinate Nikah", text: "Involve guardians, review family reputation, and move forward with blessings." }
            ].map((s, idx) => (
              <div key={idx} className="relative p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-amber-200 transition-all">
                <span className="text-3xl font-serif font-black text-amber-500/30 absolute top-4 right-4">{s.step}</span>
                <h4 className="text-sm font-bold text-emerald-950 font-sans mt-2">{s.title}</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-sans">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Verified Union Narratives</span>
            <h2 className="font-serif text-3xl text-emerald-950 font-bold mt-2">Blessed Matrimonies Made Possible</h2>
            <div className="w-12 h-[3px] bg-amber-500 mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {successStories.map((story, idx) => (
              <div key={idx} className="bg-[#faf8f5] rounded-3xl border border-gray-150/40 shadow-sm overflow-hidden flex flex-col sm:flex-row transition-all hover:shadow-md hover:border-emerald-900/10 group">
                <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.names}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent sm:hidden" />
                </div>
                <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
                  <div className="space-y-3">
                    <div className="flex text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 italic font-sans leading-relaxed">"{story.story}"</p>
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-emerald-950">{story.names}</h4>
                    <span className="text-[10px] text-amber-700 uppercase tracking-widest font-semibold">{story.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Quote / Footer banner */}
      <div className="bg-emerald-950 text-white py-20 px-4 relative overflow-hidden">
        {/* Subtle decorative dome background vector outline */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          <svg className="w-full max-w-3xl" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
            <path d="M10 90 C 20 30, 50 15, 50 15 C 50 15, 80 30, 90 90" />
            <path d="M20 90 C 30 50, 50 35, 50 35 C 50 35, 70 50, 80 90" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <span className="font-serif italic text-amber-100 text-lg sm:text-2xl leading-relaxed max-w-2xl mx-auto block">
            "And among His signs is this, that He created for you mates from among yourselves, that you may dwell in tranquility with them..."
          </span>
          <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold">— Surah Ar-Rum, Verse 21</p>
          
          <div className="pt-6 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <p className="text-xs text-emerald-100 font-sans">Ready to complete half your deen with honor?</p>
            <button
              onClick={() => onOpenAuth("signup")}
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

