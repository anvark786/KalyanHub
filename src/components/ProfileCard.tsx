/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Profile } from "../types";
import { Shield, MapPin, Heart, BookOpen, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { formatProfileCode, getAvatarPlaceholder } from "../utils/avatar";

interface ProfileCardProps {
  key?: string;
  profile: Profile;
  isFavorited: boolean;
  onSelect: (profile: Profile) => void;
  onToggleFavorite: (profileId: string, e: React.MouseEvent) => void;
}

export default function ProfileCard({ profile, isFavorited, onSelect, onToggleFavorite }: ProfileCardProps) {
  const isBlurred = profile.isBlurred === true;

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
      onClick={() => onSelect(profile)}
      className="bg-white rounded-3xl border border-gray-150/80 shadow-xs hover:shadow-xl hover:border-emerald-900/20 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full group"
      id={`profile_card_${profile.id}`}
    >
      {/* Photo Container with elegant rounded-t mask */}
      <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-[#faf8f5]">
        <img
          src={profile.photos[0] || getAvatarPlaceholder(profile.gender, profile.id)}
          alt={profile.fullName}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out ${isBlurred ? "blur-xl scale-105 select-none pointer-events-none" : ""}`}
        />

        {/* Premium Verified Badge */}
        {profile.isVerified && (
          <div className="absolute top-4 left-4 bg-emerald-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-300/30 shadow-sm flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Verified</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => onToggleFavorite(profile.id, e)}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow-xs border cursor-pointer ${
            isFavorited
              ? "bg-red-500 text-white border-red-500 scale-105"
              : "bg-white/90 text-gray-400 border-gray-100 hover:text-red-500 hover:bg-white hover:scale-105"
          }`}
          title={isFavorited ? "Remove from Favorites" : "Save to Favorites"}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Elegant Bottom Quick Tags */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-emerald-950/85 backdrop-blur-md text-white uppercase tracking-widest border border-white/10">
            {profile.sect}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-amber-500/90 backdrop-blur-md text-emerald-950 uppercase tracking-widest border border-white/10">
            {profile.age} Yrs • {profile.height} cm
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-emerald-800/95 backdrop-blur-md text-white uppercase tracking-widest border border-white/10">
            {profile.maritalStatus || "Never Married"}
          </span>
        </div>
        
        {/* Soft elegant vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent opacity-70 pointer-events-none" />
      </div>

      {/* Card Body content */}
      <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between space-y-5">
        <div className="space-y-3.5">
          <div className="flex items-start justify-between">
            <h4 className="font-serif text-lg font-bold text-emerald-950 group-hover:text-emerald-800 transition-colors line-clamp-1">
              {profile.fullName}
            </h4>
          </div>

          <div className="space-y-2.5 text-xs text-gray-500 font-sans">
            {/* Native Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium text-gray-700 line-clamp-1">{profile.district}</span>
            </div>

            {/* Education Summary */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-800/60 shrink-0" />
              <span className="line-clamp-1">{profile.educationDetails || profile.education}</span>
            </div>

            {/* Profession/Occupation */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-800/60 shrink-0" />
              <span className="line-clamp-1">{profile.occupation} {profile.company ? `at ${profile.company}` : ""}</span>
            </div>
          </div>
        </div>

        {/* Elegant Footer Details */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono">
            ID: {formatProfileCode(profile)}
          </span>
          <span className="text-xs font-bold text-emerald-900 group-hover:text-amber-700 group-hover:translate-x-1 transition-all flex items-center gap-1 font-sans">
            View Profile <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

