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
  
  // Navigation & View States (synced via hash router)
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
  const [logoError, setLogoError] = useState(false);
  
  // High Security Shield States
  const [securityToast, setSecurityToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [securityBlocker, setSecurityBlocker] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const triggerSecurityToast = (msg: string) => {
    setSecurityToast({ visible: true, message: msg });
    // Clear after 4 seconds
    setTimeout(() => {
      setSecurityToast(prev => prev.message === msg ? { visible: false, message: "" } : prev);
    }, 4000);
  };

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
        
        // If there's no hash, default to matches
        if (!window.location.hash || window.location.hash === "#/" || window.location.hash === "#/landing") {
          window.location.hash = "#/matches";
        }
      } else {
        // Guest route defaults
        if (window.location.hash !== "" && window.location.hash !== "#/landing" && !window.location.hash.startsWith("#/profile/")) {
          window.location.hash = "#/landing";
        }
      }
    } catch (e) {
      console.log("No active session initialized yet.");
    }
  };

  // URL Hash Routing Sync Hook
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      
      // If there's no logged-in user, restrict views
      if (!currentUser) {
        if (hash.startsWith("#/profile/")) {
          const profileId = hash.replace("#/profile/", "");
          try {
            const response = await fetch(`/api/profiles/${profileId}`);
            if (response.ok) {
              const p = await response.json();
              setSelectedProfile(p);
              setActiveView("landing");
            } else {
              setSelectedProfile(null);
              setActiveView("landing");
            }
          } catch (e) {
            setSelectedProfile(null);
            setActiveView("landing");
          }
        } else {
          setActiveView("landing");
          setSelectedProfile(null);
          setChatPartner(null);
        }
        return;
      }

      // User IS logged in
      if (hash.startsWith("#/profile/")) {
        const profileId = hash.replace("#/profile/", "");
        try {
          const response = await fetch(`/api/profiles/${profileId}`);
          if (response.ok) {
            const p = await response.json();
            setSelectedProfile(p);
            setActiveView("dashboard");
            setChatPartner(null);
          } else {
            setSelectedProfile(null);
            window.location.hash = "#/matches";
          }
        } catch (e) {
          setSelectedProfile(null);
          window.location.hash = "#/matches";
        }
      } else if (hash.startsWith("#/chat/")) {
        const partnerId = hash.replace("#/chat/", "");
        try {
          const response = await fetch(`/api/profiles/${partnerId}`);
          if (response.ok) {
            const p = await response.json();
            setChatPartner(p);
            setActiveView("chat");
            setSelectedProfile(null);
          } else {
            setChatPartner(null);
            window.location.hash = "#/chat";
          }
        } catch (e) {
          setChatPartner(null);
          window.location.hash = "#/chat";
        }
      } else if (hash === "#/chat") {
        setActiveView("chat");
        setChatPartner(null);
        setSelectedProfile(null);
      } else if (hash === "#/admin") {
        if (currentUser.isAdmin) {
          setActiveView("admin");
          setSelectedProfile(null);
          setChatPartner(null);
        } else {
          window.location.hash = "#/matches";
        }
      } else if (hash === "#/landing") {
        // Redirect logged-in user to matches
        window.location.hash = "#/matches";
      } else {
        // Matches / Default view
        setActiveView("dashboard");
        setSelectedProfile(null);
        setChatPartner(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Execute on initial run
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [currentUser]);

  useEffect(() => {
    checkSession();
  }, []);

  // Secure Inactivity Auto-Logout Tracker (15 Minutes)
  useEffect(() => {
    if (!currentUser) return;

    // 15 minutes session timeout
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
    let timeoutId: any;

    const handleInactivityLogout = () => {
      console.log("Inactivity detected. Performing automatic secure logout...");
      handleSignOut();
      setSessionExpiredNotice(true);
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    
    // Register event listeners
    events.forEach(evt => window.addEventListener(evt, resetTimer));
    
    // Start initial timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser]);

  // Security, Screenshot & Copy Shield Layer
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
        triggerSecurityToast("🔒 Security Shield: Image saving and right-clicking are disabled to safeguard member privacy.");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      // Prevent copying content unless it is inside an input/textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }
      e.preventDefault();
      triggerSecurityToast("🔒 Security Shield: Copying member details or biodata content is prohibited.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Detect Print screen key (Key: "PrintScreen")
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        setSecurityBlocker(true);
        triggerSecurityToast("📸 Screenshot Deterred: Capturing member details is restricted on KalyanHub.");
        // Hide blocker overlay after 4 seconds
        setTimeout(() => setSecurityBlocker(false), 4000);
        return;
      }

      // 2. Prevent Ctrl+P / Cmd+P (Print / PDF capture)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setSecurityBlocker(true);
        triggerSecurityToast("🔒 Printing Restricted: Hardcopies and PDF generation are disabled for data safety.");
        setTimeout(() => setSecurityBlocker(false), 5000);
        return;
      }

      // 3. Prevent Ctrl+S / Cmd+S (Save webpage)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        triggerSecurityToast("🔒 Saving Locked: Member directory offline saving is disabled.");
        return;
      }

      // 4. Prevent Ctrl+Shift+I / Cmd+Option+I / F12 (Inspect Element)
      if (
        e.key === "F12" || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u"))
      ) {
        // We only show a friendly warning deterrent
        triggerSecurityToast("⚠️ Developer Notice: Page inspection is audited for candidate confidentiality.");
      }
    };

    // Listeners
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  // Sync favorites toggles with API
  const handleToggleFavorite = async (profileId: string) => {
    if (!currentUser) {
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
      window.location.hash = "#/matches";
    } else {
      triggerAuthModal("signup");
    }
  };

  const handleAuthSuccess = (data: { user: User; profile: Profile }) => {
    setSessionExpiredNotice(false);
    setCurrentUser(data.user);
    setCurrentUserProfile(data.profile);
    setFavorites(data.user.favorites || []);
    window.location.hash = "#/matches";
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
    window.location.hash = "#/landing";
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
    window.location.hash = `#/chat/${profile.id}`;
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
                  window.location.hash = "#/matches";
                } else {
                  window.location.hash = "#/landing";
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
              id="header_logo_group"
            >
              <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-md border border-emerald-950/20 shrink-0">
                {!logoError ? (
                  <img 
                    src="https://lh3.googleusercontent.com/d/10KWUPSR2X9kOYlCZXkvTsJ6TMjW2RkrI" 
                    alt="KalyanHub" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#034435] flex items-center justify-center text-white">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 group-hover:rotate-12 transition-transform" />
                  </div>
                )}
              </div>
              <div>
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-emerald-950">
                  Kalyan<span className="text-amber-600 italic">Hub</span>
                </span>
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Premium Kerala Muslim Matrimony
                </span>
              </div>
            </div>

            {/* Middle Nav Links (Only if logged in) */}
            {currentUser && (
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-gray-500">
                <button
                  onClick={() => {
                    window.location.hash = "#/matches";
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
                    window.location.hash = "#/chat";
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
                      window.location.hash = "#/admin";
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
                        window.location.hash = "#/admin";
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
                      window.location.hash = "#/chat";
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
            onSelectProfile={(p) => { window.location.hash = p ? "#/profile/" + p.id : "#/matches"; }}
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
            onBack={() => { window.location.hash = "#/matches"; }}
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
              window.location.hash = "#/matches";
            }}
            onSelectPartner={(partner) => {
              window.location.hash = partner ? `#/chat/${partner.id}` : "#/chat";
            }}
            onTriggerPaymentPortal={() => setPaymentModalOpen(true)}
          />
        )}

        {/* VIEW: Administrative Panel Sandbox */}
        {activeView === "admin" && (
          <AdminPanel
            currentUser={currentUser}
            onBackToDashboard={() => {
              window.location.hash = "#/matches";
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

      {/* Floating Security Shield Notification Toast */}
      {securityToast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] sm:w-auto bg-emerald-950/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-amber-300/30 flex items-start gap-3.5 transition-all animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-400/20 shrink-0 text-amber-300 mt-0.5">
            <span className="text-lg font-bold">🔒</span>
          </div>
          <div>
            <h5 className="font-serif text-xs font-extrabold text-amber-300 uppercase tracking-widest">KalyanHub Safety Shield</h5>
            <p className="text-[11px] text-gray-200 mt-1 leading-relaxed">{securityToast.message}</p>
          </div>
        </div>
      )}

      {/* Full Screen Session Expired Overlay */}
      {sessionExpiredNotice && (
        <div className="fixed inset-0 z-[99999] bg-emerald-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center text-white select-none pointer-events-auto">
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-400/30 flex items-center justify-center animate-bounce">
              <span className="text-4xl">🕒</span>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Security Session Notice
              </span>
              <h2 className="font-serif text-2xl font-bold text-white tracking-tight mt-3">
                Session Expired
              </h2>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
              For your privacy and security, your matrimonial session was automatically closed due to 15 minutes of inactivity.
            </p>

            <button
              id="session-expired-login-btn"
              onClick={() => {
                setSessionExpiredNotice(false);
                triggerAuthModal("login");
              }}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Sign In Again
            </button>
          </div>
        </div>
      )}

      {/* Full Screen High-Security Screenshot/Print Blocker Overlay */}
      {securityBlocker && (
        <div className="fixed inset-0 z-[100000] bg-emerald-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center text-white select-none pointer-events-auto">
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-400/30 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🛡️</span>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Privacy Protection Enabled
              </span>
              <h2 className="font-serif text-2xl font-bold text-white tracking-tight mt-3">
                Profile Screenshot Deterred
              </h2>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
              Under KalyanHub's strict privacy framework, taking screenshots, printing pages, or making screen-captures of member profiles is prohibited.
            </p>

            <div className="p-4 bg-emerald-900/40 rounded-2xl border border-emerald-800/30 text-emerald-200 text-3xs uppercase tracking-wider font-semibold">
              Jazakallah Khair for respecting our members' honor &amp; confidentiality.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
