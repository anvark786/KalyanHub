/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Profile, User } from "../types";
import { ArrowLeft, Shield, MapPin, Heart, BookOpen, Briefcase, Phone, MessageSquare, Info, Calendar, Ruler, Award, Users, DollarSign, Sparkles, Lock, Mail, Home, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { formatProfileCode, getAvatarPlaceholder } from "../utils/avatar";

interface ProfileDetailsProps {
  profile: Profile;
  isFavorited: boolean;
  onBack: () => void;
  onToggleFavorite: (profileId: string) => void;
  onStartChat: (profile: Profile) => void;
  onTriggerPaymentPortal: () => void;
  onRequestPhotoAccess: (profileId: string) => void;
  currentUser?: User | null;
}

export default function ProfileDetails({
  profile,
  isFavorited,
  onBack,
  onToggleFavorite,
  onStartChat,
  onTriggerPaymentPortal,
  onRequestPhotoAccess,
  currentUser
}: ProfileDetailsProps) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(
    (profile.phone && !profile.phone.includes("••")) || currentUser?.isAdmin ? profile.phone : null
  );
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);

  const handleRevealContact = async () => {
    setLoadingPhone(true);
    try {
      const response = await fetch(`/api/profiles/${profile.id}/reveal-contact`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setUnlockedPhone(data.phone);
      } else {
        // Any error like 402 payment_required triggers the portal
        onTriggerPaymentPortal();
      }
    } catch (e) {
      console.error("Reveal phone error", e);
      onTriggerPaymentPortal();
    } finally {
      setLoadingPhone(false);
    }
  };

  const isBlurred = profile.isBlurred && !currentUser?.isAdmin;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10" id={`profile_details_view_${profile.id}`}>
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950 hover:text-emerald-800 mb-8 bg-white px-4 py-2.5 rounded-xl border border-gray-150 shadow-3xs cursor-pointer transition-all hover:shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </button>

      <div className="bg-white rounded-3xl border border-gray-150/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
        
        {/* Left Column: Photos & Primary CTA */}
        <div className="md:col-span-5 bg-[#faf8f5]/80 p-8 flex flex-col justify-between border-r border-gray-150/60">
          <div className="space-y-6">
            {/* Main Active Photo with Golden Trim */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md border-2 border-amber-500/10">
              <img
                src={profile.photos[activePhoto] || getAvatarPlaceholder(profile.gender)}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? "blur-2xl scale-105 select-none pointer-events-none" : ""}`}
              />

              {/* Photo blur access request overlay */}
              {isBlurred && (
                <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 text-white z-10">
                  {profile.photoAccessRejected ? (
                    <>
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3 border border-red-500/30">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <h4 className="font-serif text-base font-bold text-red-200">Request Declined</h4>
                      <p className="text-[10px] text-red-100/90 mt-1.5 max-w-[200px] leading-relaxed">
                        To protect member privacy, your photo access request has been declined. You cannot submit another request.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 border border-white/20">
                        <Lock className="w-5 h-5 text-amber-400" />
                      </div>
                      <h4 className="font-serif text-base font-bold">Photo Access Required</h4>
                      <p className="text-[10px] text-emerald-100/95 mt-1 mb-5 max-w-[200px]">
                        {profile.fullName.split(' ')[0]} has chosen to blur their photos. Request access to unlock.
                      </p>

                      {profile.photoAccessRequested ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Access Pending
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            setRequestingAccess(true);
                            await onRequestPhotoAccess(profile.id);
                            setRequestingAccess(false);
                          }}
                          disabled={requestingAccess}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {requestingAccess ? "Requesting..." : "Request Photo Access"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {profile.isVerified && !isBlurred && (
                <div className="absolute top-4 left-4 bg-emerald-950/95 text-white px-3 py-1.5 rounded-full border border-amber-300/30 shadow-md flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Hand-Verified</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {profile.photos.length > 1 && !isBlurred && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {profile.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhoto(index)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activePhoto === index ? "border-amber-500 scale-95 shadow-sm" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Interactive Actions */}
          <div className="space-y-4 mt-10">
            <button
              onClick={() => onStartChat(profile)}
              className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-emerald-950/10"
            >
              <MessageSquare className="w-4 h-4 text-amber-300" />
              Send Secure Message
            </button>

            <button
              onClick={() => onToggleFavorite(profile.id)}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isFavorited
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-current text-red-600" : ""}`} />
              {isFavorited ? "Shortlisted (Saved)" : "Shortlist Profile"}
            </button>

            <div className="pt-4 border-t border-gray-200/60">
              {unlockedPhone ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center space-y-2 text-center">
                  <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest">Confidential Contact</span>
                  <a href={`tel:${unlockedPhone}`} className="text-base font-bold text-emerald-950 flex items-center gap-1.5 font-mono">
                    <Phone className="w-4 h-4 text-amber-600" />
                    {unlockedPhone}
                  </a>
                  <p className="text-[10px] text-gray-500">Vouched by KalyanHub Head Office</p>
                </div>
              ) : (
                <button
                  onClick={handleRevealContact}
                  disabled={loadingPhone}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
                >
                  <Phone className="w-4 h-4" />
                  {loadingPhone ? "Revealing..." : "Reveal Contact Details"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Exhaustive candidate details */}
        <div className="md:col-span-7 p-8 sm:p-10 space-y-10 max-h-[85vh] overflow-y-auto">
          {/* Admin view of direct contact details */}
          {currentUser?.isAdmin && (
            <div className="bg-emerald-950 text-white p-6 rounded-2xl border border-amber-500/25 shadow-lg space-y-4 font-sans">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">Administrative View: Direct Contact</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-emerald-300 font-medium block uppercase text-[9px] tracking-wider">Candidate Email</span>
                  <div className="flex items-center gap-1.5 font-mono text-white overflow-x-auto whitespace-nowrap scrollbar-thin">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{profile.email || `${profile.fullName.toLowerCase().replace(/\s+/g, "")}@kalyanhub.com`}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-emerald-300 font-medium block uppercase text-[9px] tracking-wider">Direct Phone</span>
                  <div className="flex items-center gap-1.5 font-mono text-white">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-emerald-300 font-medium block uppercase text-[9px] tracking-wider">District Residence</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{profile.district}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-emerald-300 font-medium block uppercase text-[9px] tracking-wider">Native Place / Address</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <Home className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{profile.family?.nativePlace || "Kerala"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header name and key specs */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-950 rounded-lg uppercase tracking-widest border border-emerald-200/50">
                {profile.sect}
              </span>
              <span className="px-3 py-1 text-[9px] font-bold bg-amber-500/10 text-amber-900 rounded-lg uppercase tracking-widest border border-amber-200/50">
                {profile.district}
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950">{profile.fullName}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Profile ID: {formatProfileCode(profile)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Active Match
              </span>
            </div>
          </div>

          {/* Section: About */}
          <div className="space-y-3.5">
            <h4 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2 border-b border-gray-150 pb-2">
              <Info className="w-4 h-4 text-amber-600" />
              Personal Statement
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic bg-emerald-50/20 p-4 rounded-2xl border border-emerald-900/5 font-sans">
              "{profile.aboutMe}"
            </p>
          </div>

          {/* Section: Quick Physical & Faith Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center">
              <Calendar className="w-4 h-4 text-emerald-800/80 mx-auto mb-1.5" />
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Age</div>
              <div className="text-xs font-bold text-emerald-950 mt-0.5">{profile.age} Years</div>
            </div>
            <div className="p-4 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center">
              <Ruler className="w-4 h-4 text-emerald-800/80 mx-auto mb-1.5" />
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Height</div>
              <div className="text-xs font-bold text-emerald-950 mt-0.5">{profile.height} cm</div>
            </div>
            <div className="p-4 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center">
              <Award className="w-4 h-4 text-emerald-800/80 mx-auto mb-1.5" />
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Faith Practice</div>
              <div className="text-xs font-bold text-emerald-950 mt-0.5">{profile.religiousPractice}</div>
            </div>
            <div className="p-4 bg-[#faf8f5] rounded-2xl border border-gray-100 text-center">
              <MapPin className="w-4 h-4 text-emerald-800/80 mx-auto mb-1.5" />
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">District</div>
              <div className="text-xs font-bold text-emerald-950 mt-0.5">{profile.district}</div>
            </div>
          </div>

          {/* Section: Education and Professional (Detailed) */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2 border-b border-gray-150 pb-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Education & Professional Outlook
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm font-sans">
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Qualification Details</span>
                <p className="font-semibold text-emerald-950">{profile.educationDetails} ({profile.education})</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Current Designation</span>
                <p className="font-semibold text-emerald-950">{profile.occupation}</p>
              </div>
              {profile.company && (
                <div className="space-y-1">
                  <span className="text-gray-400 text-xs">Employer / Organization</span>
                  <p className="font-semibold text-emerald-950">{profile.company}</p>
                </div>
              )}
              {profile.incomeRange && (
                <div className="space-y-1">
                  <span className="text-gray-400 text-xs">Annual Remuneration</span>
                  <p className="font-semibold text-emerald-950 flex items-center gap-0.5 text-emerald-800 font-mono">
                    <DollarSign className="w-4 h-4" />
                    {profile.incomeRange}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: FAMILY BACKGROUND (Crucial for Kerala Muslim community) */}
          <div className="space-y-5 bg-[#faf8f5] p-6 sm:p-8 rounded-3xl border border-emerald-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-emerald-950">
                <path d="M50 0 L100 50 L50 100 L0 50 Z" />
              </svg>
            </div>

            <h4 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2 border-b border-gray-200 pb-2">
              <Users className="w-4 h-4 text-amber-600" />
              Family Background & Ancestry
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-xs sm:text-sm font-sans">
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Father's Name</span>
                <p className="font-semibold text-emerald-950">{profile.family.fatherName}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Father's Occupation</span>
                <p className="font-semibold text-emerald-950">{profile.family.fatherOccupation}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Mother's Name</span>
                <p className="font-semibold text-emerald-950">{profile.family.motherName}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Mother's Occupation</span>
                <p className="font-semibold text-emerald-950">{profile.family.motherOccupation}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Family Status</span>
                <p className="font-semibold text-emerald-950">{profile.family.familyStatus}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Family Values</span>
                <p className="font-semibold text-emerald-950">{profile.family.familyValues}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-gray-400 text-xs">Native Place</span>
                <p className="font-semibold text-emerald-950">{profile.family.nativePlace}</p>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-0.5">
                <span className="text-gray-400 text-xs">Siblings Details</span>
                <p className="font-semibold text-emerald-950 leading-relaxed">{profile.family.siblingsDetails}</p>
              </div>
            </div>
          </div>

          {/* Section: Hobbies */}
          {profile.hobbies && profile.hobbies.length > 0 && (
            <div className="space-y-3.5">
              <h4 className="font-serif text-base font-bold text-emerald-950 border-b border-gray-150 pb-2">
                Hobbies & Personal Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map((hobby) => (
                  <span
                    key={hobby}
                    className="px-3 py-1 text-2xs font-semibold bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-150"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Security Assurance Disclaimer */}
          <div className="p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-[10px] text-gray-500 space-y-1.5 leading-relaxed font-sans">
            <p className="font-bold text-gray-700 flex items-center gap-1">🔒 KalyanHub Security & Privacy Guarantee</p>
            <p>
              To maintain the highest level of deen and cultural modesty, screenshots of this profile details page are blocked, and phone numbers are only revealed to verified premium users who have shared their ID credentials. Your chat exchanges are confidential and encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

