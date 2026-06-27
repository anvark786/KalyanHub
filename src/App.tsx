/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import ProfileDetails from "./components/ProfileDetails";
import ChatCenter from "./components/ChatCenter";
import PaymentModal from "./components/PaymentModal";
import AdminPanel from "./components/AdminPanel";
import { Profile, User, District, Sect } from "./types";
import { Heart, MessageSquare, LogIn, UserPlus, LogOut, Shield, Compass, Star, UserCheck } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Navigation & View States
  const [activeView, setActiveView] = useState<"landing" | "dashboard" | "chat" | "admin">("landing");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [chatPartner, setChatPartner] = useState<Profile | null>(null);
  
  // Query Filters from Quick Search on Landing Page
  const [initialQueryFilters, setInitialQueryFilters] = useState<{
    gender: "Male" | "Female";
    district?: District;
    sect?: Sect;
  } | undefined>(undefined);

  // Authentication Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  // Premium paywall portal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleRequestPhotoAccess = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/request-photo-access`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedProfile(data.profile);
      }
    } catch (e) {
      console.error("Error requesting photo access", e);
    }
  };

  const handlePaymentSuccess = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    // Refresh detailed profile if currently viewed
    if (selectedProfile) {
      fetch(`/api/profiles/${selectedProfile.id}`)
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(p => {
          if (p) setSelectedProfile(p);
        })
        .catch(err => console.error(err));
    }
  };

  // Fetch Session on Startup
  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setCurrentUserProfile(data.profile);
        setFavorites(data.user.favorites || []);
        setActiveView("dashboard");
      }
    } catch (e) {
      console.log("No active session initialized yet.");
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Sync favorites toggles with API
  const handleToggleFavorite = async (profileId: string) => {
    if (!currentUser) {
      // Prompt sign up if guest triggers interest
      triggerAuthModal("signup");
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}/favorite`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (e) {
      console.error("Error toggling favorite", e);
    }
  };

  // Trigger quick search transition
  const handleQuickSearchTransition = (filters: {
    gender: "Male" | "Female";
    district?: District;
    sect?: Sect;
  }) => {
    setInitialQueryFilters(filters);
    if (currentUser) {
      setActiveView("dashboard");
    } else {
      triggerAuthModal("signup");
    }
  };

  const handleAuthSuccess = (data: { user: User; profile: Profile }) => {
    setCurrentUser(data.user);
    setCurrentUserProfile(data.profile);
    setFavorites(data.user.favorites || []);
    setActiveView("dashboard");
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setCurrentUserProfile(null);
    setFavorites([]);
    setSelectedProfile(null);
    setChatPartner(null);
    setActiveView("landing");
  };

  const triggerAuthModal = (mode: "login" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleStartChat = (profile: Profile) => {
    if (!currentUser) {
      triggerAuthModal("signup");
      return;
    }
    setChatPartner(profile);
    setActiveView("chat");
    setSelectedProfile(null); // Close detail view
  };

  const handleUpdateMyProfileLocally = (updated: Profile) => {
    setCurrentUserProfile(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ecebe6]">
      
      {/* Premium Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-150/60 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo and Brand */}
            <div 
              onClick={() => {
                if (currentUser) {
                  setActiveView("dashboard");
                } else {
                  setActiveView("landing");
                }
                setSelectedProfile(null);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
              id="header_logo_group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#034435] flex items-center justify-center text-white shadow-md border border-emerald-950/20">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-emerald-950">
                  Kalyan<span className="text-amber-600 italic">Hub</span>
                </span>
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Premium Kerala Matrimony
                </span>
              </div>
            </div>

            {/* Middle Nav Links (Only if logged in) */}
            {currentUser && (
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-gray-500">
                <button
                  onClick={() => {
                    setActiveView("dashboard");
                    setSelectedProfile(null);
                  }}
                  className={`hover:text-emerald-950 cursor-pointer flex items-center gap-1.5 py-1.5 transition-colors border-b-2 ${
                    activeView === "dashboard" && !selectedProfile
                      ? "text-[#034435] border-amber-500"
                      : "border-transparent"
                  }`}
                >
                  <Compass className="w-4 h-4 text-amber-500" /> Matches
                </button>
                <button
                  onClick={() => {
                    setActiveView("chat");
                    setChatPartner(null);
                  }}
                  className={`hover:text-emerald-950 cursor-pointer flex items-center gap-1.5 py-1.5 transition-colors border-b-2 ${
                    activeView === "chat" ? "text-[#034435] border-amber-500" : "border-transparent"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-amber-500" /> In-App Chat
                </button>
                {currentUser?.isAdmin && (
                  <button
                    onClick={() => {
                      setActiveView("admin");
                      setSelectedProfile(null);
                    }}
                    className={`hover:text-emerald-950 cursor-pointer flex items-center gap-1.5 py-1.5 transition-colors border-b-2 ${
                      activeView === "admin" ? "text-[#034435] border-amber-500" : "border-transparent"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-amber-500" /> Admin Panel
                  </button>
                )}
              </nav>
            )}

            {/* Right Action buttons */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  {/* Logged in layout */}
                  <div className="hidden sm:flex items-center gap-2.5 mr-2 font-sans">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm" />
                    <span className="text-xs font-bold text-emerald-950">
                      As: {currentUser.fullName.split(' ')[0]}
                    </span>
                    {currentUser.isPaid ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200/80 rounded text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                        Premium
                      </span>
                    ) : (
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-900 border border-gray-200/80 hover:border-amber-200/80 rounded text-[9px] font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        Free (Upgrade)
                      </button>
                    )}
                  </div>

                  {/* Header Admin Icon for Mobile */}
                  {currentUser?.isAdmin && (
                    <button
                      onClick={() => {
                        setActiveView("admin");
                        setSelectedProfile(null);
                      }}
                      className={`md:hidden p-2 rounded-xl border relative cursor-pointer ${
                        activeView === "admin" 
                          ? "bg-emerald-50 border-emerald-900 text-emerald-900" 
                          : "bg-white border-gray-200 text-gray-500"
                      }`}
                      title="Admin Panel"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}

                  {/* Header Chat Icon for Mobile */}
                  <button
                    onClick={() => {
                      setActiveView("chat");
                      setChatPartner(null);
                    }}
                    className={`md:hidden p-2 rounded-xl border relative cursor-pointer ${
                      activeView === "chat" 
                        ? "bg-emerald-50 border-emerald-900 text-emerald-900" 
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="p-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 text-gray-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Sign Out Account"
                    id="sign_out_button"
                  >
                    <LogOut className="w-4 h-4 shrink-0 text-red-500" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Guest Layout */}
                  <button
                    onClick={() => triggerAuthModal("login")}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-900 hover:bg-emerald-50/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    id="header_login_btn"
                  >
                    <LogIn className="w-4 h-4 text-gold-600" />
                    Sign In
                  </button>
                  <button
                    onClick={() => triggerAuthModal("signup")}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold uppercase tracking-wider bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                    id="header_signup_btn"
                  >
                    <UserPlus className="w-4 h-4 text-gold-200" />
                    Register Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* DYNAMIC SCREEN CONTENT VIEW ROUTER */}
      <main className="flex-grow">
        {/* VIEW: Landing Screen */}
        {activeView === "landing" && !selectedProfile && (
          <LandingPage
            onStartSearch={handleQuickSearchTransition}
            onOpenAuth={triggerAuthModal}
          />
        )}

        {/* VIEW: Dashboard Matches Search Screen */}
        {activeView === "dashboard" && !selectedProfile && (
          <Dashboard
            currentUserProfile={currentUserProfile}
            currentUserFavorites={favorites}
            onSelectProfile={(p) => setSelectedProfile(p)}
            onToggleFavorite={handleToggleFavorite}
            onUpdateMyProfile={handleUpdateMyProfileLocally}
            initialQueryFilters={initialQueryFilters}
          />
        )}

        {/* VIEW: Detailed Profile Page */}
        {selectedProfile && (
          <ProfileDetails
            profile={selectedProfile}
            isFavorited={favorites.includes(selectedProfile.id)}
            onBack={() => setSelectedProfile(null)}
            onToggleFavorite={handleToggleFavorite}
            onStartChat={handleStartChat}
            onTriggerPaymentPortal={() => setPaymentModalOpen(true)}
            onRequestPhotoAccess={handleRequestPhotoAccess}
            currentUser={currentUser}
          />
        )}

        {/* VIEW: In-App Chat space */}
        {activeView === "chat" && (
          <ChatCenter
            currentUserProfile={currentUserProfile}
            activeChatPartner={chatPartner}
            onBackToDashboard={() => {
              setActiveView("dashboard");
              setChatPartner(null);
            }}
            onSelectPartner={(partner) => setChatPartner(partner)}
            onTriggerPaymentPortal={() => setPaymentModalOpen(true)}
          />
        )}

        {/* VIEW: Administrative Panel Sandbox */}
        {activeView === "admin" && (
          <AdminPanel
            currentUser={currentUser}
            onBackToDashboard={() => {
              setActiveView("dashboard");
            }}
          />
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-gray-150 py-6 text-center">
        <p className="text-3xs text-gray-400 font-semibold uppercase tracking-wider">
          © 2026 KalyanHub Matrimonial Services. All Rights Reserved.
        </p>
      </footer>

      {/* Unified Registration & Login Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Unified Premium Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        user={currentUser}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
