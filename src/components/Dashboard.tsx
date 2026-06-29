/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Profile, District, Sect, EducationType } from "../types";
import ProfileCard from "./ProfileCard";
import { Search, Filter, Shield, Heart, User, Check, RefreshCw, ChevronDown, Sliders, Briefcase, BookOpen, MapPin, Sparkles, Lock, Upload, AlertCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarPlaceholder } from "../utils/avatar";

interface DashboardProps {
  currentUserProfile: Profile | null;
  currentUserFavorites: string[];
  onSelectProfile: (profile: Profile) => void;
  onToggleFavorite: (profileId: string) => void;
  onUpdateMyProfile: (updatedProfile: any) => void;
  initialQueryFilters?: {
    gender: "Male" | "Female";
    district?: District;
    sect?: Sect;
  };
}

export function getProfileCompleteness(profile: Profile | null) {
  if (!profile) return { percent: 0, missingFields: [] as string[] };
  
  const checks = [
    { name: "Phone Number", isComplete: !!profile.phone && profile.phone !== "Not specified" && profile.phone !== "+91 9876543210" && profile.phone.trim() !== "" },
    { name: "About Me / Bio", isComplete: !!profile.aboutMe && profile.aboutMe !== "Not specified" && !profile.aboutMe.includes("have recently joined") && !profile.aboutMe.includes("looking for a suitable partner") && profile.aboutMe.trim() !== "" },
    { name: "Education Details", isComplete: !!profile.educationDetails && profile.educationDetails !== "Not specified" && profile.educationDetails.trim() !== "" },
    { name: "Occupation", isComplete: !!profile.occupation && profile.occupation !== "Not specified" && profile.occupation.trim() !== "" },
    { name: "Father's Name", isComplete: !!profile.family?.fatherName && profile.family.fatherName !== "Not specified" && profile.family.fatherName.trim() !== "" },
    { name: "Father's Occupation", isComplete: profile.family?.fatherStatus === "Passed Away" || (!!profile.family?.fatherOccupation && profile.family.fatherOccupation !== "Not specified" && profile.family.fatherOccupation.trim() !== "") },
    { name: "Mother's Name", isComplete: !!profile.family?.motherName && profile.family.motherName !== "Not specified" && profile.family.motherName.trim() !== "" },
    { name: "Mother's Occupation", isComplete: !!profile.family?.motherOccupation && profile.family.motherOccupation !== "Not specified" && profile.family.motherOccupation.trim() !== "" },
    { name: "Siblings Details", isComplete: !!profile.family?.siblingsDetails && profile.family.siblingsDetails !== "Not specified" && profile.family.siblingsDetails.trim() !== "" },
    { name: "Native Place / Address", isComplete: !!profile.family?.nativePlace && profile.family.nativePlace !== "Not specified" && profile.family.nativePlace.trim() !== "" },
  ];
  
  const completed = checks.filter(c => c.isComplete);
  const percent = Math.round((completed.length / checks.length) * 100);
  const missing = checks.filter(c => !c.isComplete).map(c => c.name);
  
  return { percent, missingFields: missing };
}

export default function Dashboard({
  currentUserProfile,
  currentUserFavorites,
  onSelectProfile,
  onToggleFavorite,
  onUpdateMyProfile,
  initialQueryFilters
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"matches" | "favorites" | "myprofile">("matches");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);

  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSects, setSelectedSects] = useState<Sect[]>(
    initialQueryFilters?.sect ? [initialQueryFilters.sect] : []
  );
  const [selectedDistricts, setSelectedDistricts] = useState<District[]>(
    initialQueryFilters?.district ? [initialQueryFilters.district] : []
  );
  const [selectedEducations, setSelectedEducations] = useState<EducationType[]>([]);
  const [selectedMaritalStatuses, setSelectedMaritalStatuses] = useState<string[]>([]);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(45);
  const [minHeight, setMinHeight] = useState<number>(140);
  const [maxHeight, setMaxHeight] = useState<number>(200);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "default">("newest");

  // My Profile Edit State
  const [editName, setEditName] = useState(currentUserProfile?.fullName || "");
  const [editAge, setEditAge] = useState(currentUserProfile?.age || 26);
  const [editHeight, setEditHeight] = useState(currentUserProfile?.height || 175);
  const [editDistrict, setEditDistrict] = useState<District>(currentUserProfile?.district || District.Malappuram);
  const [editSect, setEditSect] = useState<Sect>(currentUserProfile?.sect || Sect.Sunni_EK);
  const [editEdu, setEditEdu] = useState<EducationType>(currentUserProfile?.education || EducationType.Engineer);
  const [editEduDetails, setEditEduDetails] = useState(currentUserProfile?.educationDetails || "");
  const [editOccupation, setEditOccupation] = useState(currentUserProfile?.occupation || "");
  const [editCompany, setEditCompany] = useState(currentUserProfile?.company || "");
  const [editIncome, setEditIncome] = useState(currentUserProfile?.incomeRange || "");
  const [editAbout, setEditAbout] = useState(currentUserProfile?.aboutMe || "");
  const [editPhone, setEditPhone] = useState(currentUserProfile?.phone || "");
  const [editPhotos, setEditPhotos] = useState<string[]>(currentUserProfile?.photos || []);
  const [editMaritalStatus, setEditMaritalStatus] = useState<"Never Married" | "Divorced" | "Widowed" | "Awaiting Divorce" | "Separated">(currentUserProfile?.maritalStatus || "Never Married");
  const [editProfileFor, setEditProfileFor] = useState<"Self" | "Son" | "Daughter" | "Brother" | "Sister" | "Parent" | "Relative" | "Friend">(currentUserProfile?.profileFor || "Self");
  const [editAddress, setEditAddress] = useState(currentUserProfile?.address || "");
  const [isDragging, setIsDragging] = useState(false);
  
  // Family Edit State
  const [fatherName, setFatherName] = useState(currentUserProfile?.family?.fatherName || "");
  const [fatherStatus, setFatherStatus] = useState<"Alive" | "Passed Away">(currentUserProfile?.family?.fatherStatus || "Alive");
  const [fatherOcc, setFatherOcc] = useState(currentUserProfile?.family?.fatherOccupation || "");
  const [motherName, setMotherName] = useState(currentUserProfile?.family?.motherName || "");
  const [motherOcc, setMotherOcc] = useState(currentUserProfile?.family?.motherOccupation || "");
  const [famStatus, setFamStatus] = useState(currentUserProfile?.family?.familyStatus || "Middle Class");
  const [famValues, setFamValues] = useState(currentUserProfile?.family?.familyValues || "Moderate");
  const [siblings, setSiblings] = useState(currentUserProfile?.family?.siblingsDetails || "");
  const [nativePl, setNativePl] = useState(currentUserProfile?.family?.nativePlace || "");

  // Partner Preferences State
  const [prefMinAge, setPrefMinAge] = useState<number>(currentUserProfile?.partnerPreference?.minAge || 18);
  const [prefMaxAge, setPrefMaxAge] = useState<number>(currentUserProfile?.partnerPreference?.maxAge || 45);
  const [prefMinHeight, setPrefMinHeight] = useState<number>(currentUserProfile?.partnerPreference?.minHeight || 140);
  const [prefMaxHeight, setPrefMaxHeight] = useState<number>(currentUserProfile?.partnerPreference?.maxHeight || 210);
  const [prefSects, setPrefSects] = useState<Sect[]>(currentUserProfile?.partnerPreference?.sects || []);
  const [prefDistricts, setPrefDistricts] = useState<District[]>(currentUserProfile?.partnerPreference?.districts || []);
  const [prefEducations, setPrefEducations] = useState<EducationType[]>(currentUserProfile?.partnerPreference?.educations || []);

  // Recommendations Tab Filter Toggle
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  // Security Update Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Deactivate Account State
  const [profileStatus, setProfileStatus] = useState<"Active" | "Inactive">(currentUserProfile?.status || "Active");
  const [deactivateReason, setDeactivateReason] = useState(currentUserProfile?.inactiveReason || "Married Done");

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, etc.).");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          
          if (editPhotos.length >= 4) {
            alert("Maximum 4 photos allowed in the gallery. Please remove an existing photo first.");
            return;
          }
          setEditPhotos((prev) => [...prev, compressedDataUrl]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Photo Privacy Dashboard States
  const [isPhotoBlurred, setIsPhotoBlurred] = useState(currentUserProfile?.isPhotoBlurred || false);
  const [photoRequests, setPhotoRequests] = useState<{ pending: Profile[]; approved: Profile[] }>({ pending: [], approved: [] });

  const fetchPhotoRequests = async () => {
    try {
      const response = await fetch("/api/profiles/my-photo-requests");
      if (response.ok) {
        const data = await response.json();
        setPhotoRequests(data);
      }
    } catch (e) {
      console.error("Error fetching photo requests:", e);
    }
  };

  const handleTogglePhotoBlur = async () => {
    try {
      const response = await fetch("/api/profiles/toggle-photo-blur", {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setIsPhotoBlurred(data.profile.isPhotoBlurred);
        onUpdateMyProfile(data.profile);
      }
    } catch (e) {
      console.error("Error toggling photo blur:", e);
    }
  };

  const handleApproveRequest = async (requesterProfileId: string) => {
    try {
      const response = await fetch(`/api/profiles/photo-access-requests/${requesterProfileId}/approve`, {
        method: "POST"
      });
      if (response.ok) {
        fetchPhotoRequests();
      }
    } catch (e) {
      console.error("Error approving request:", e);
    }
  };

  const handleRejectRequest = async (requesterProfileId: string) => {
    try {
      const response = await fetch(`/api/profiles/photo-access-requests/${requesterProfileId}/reject`, {
        method: "POST"
      });
      if (response.ok) {
        fetchPhotoRequests();
      }
    } catch (e) {
      console.error("Error rejecting request:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "myprofile") {
      fetchPhotoRequests();
    }
  }, [activeTab, currentUserProfile]);

  // Sync edit form with profile changes
  useEffect(() => {
    if (currentUserProfile) {
      setIsPhotoBlurred(currentUserProfile.isPhotoBlurred || false);
      setEditName(currentUserProfile.fullName);
      setEditAge(currentUserProfile.age);
      setEditHeight(currentUserProfile.height);
      setEditDistrict(currentUserProfile.district);
      setEditSect(currentUserProfile.sect);
      setEditEdu(currentUserProfile.education);
      setEditEduDetails(currentUserProfile.educationDetails);
      setEditOccupation(currentUserProfile.occupation);
      setEditCompany(currentUserProfile.company || "");
      setEditIncome(currentUserProfile.incomeRange);
      setEditAbout(currentUserProfile.aboutMe);
      setEditPhone(currentUserProfile.phone || "");
      setEditPhotos(currentUserProfile.photos || []);
      setEditMaritalStatus(currentUserProfile.maritalStatus || "Never Married");
      setEditProfileFor(currentUserProfile.profileFor || "Self");
      setEditAddress(currentUserProfile.address || "");
      
      setFatherName(currentUserProfile.family?.fatherName || "");
      setFatherStatus(currentUserProfile.family?.fatherStatus || "Alive");
      setFatherOcc(currentUserProfile.family?.fatherOccupation || "");
      setMotherName(currentUserProfile.family?.motherName || "");
      setMotherOcc(currentUserProfile.family?.motherOccupation || "");
      setFamStatus(currentUserProfile.family?.familyStatus || "Middle Class");
      setFamValues(currentUserProfile.family?.familyValues || "Moderate");
      setSiblings(currentUserProfile.family?.siblingsDetails || "");
      setNativePl(currentUserProfile.family?.nativePlace || "");

      setPrefMinAge(currentUserProfile.partnerPreference?.minAge || 18);
      setPrefMaxAge(currentUserProfile.partnerPreference?.maxAge || 45);
      setPrefMinHeight(currentUserProfile.partnerPreference?.minHeight || 140);
      setPrefMaxHeight(currentUserProfile.partnerPreference?.maxHeight || 210);
      setPrefSects(currentUserProfile.partnerPreference?.sects || []);
      setPrefDistricts(currentUserProfile.partnerPreference?.districts || []);
      setPrefEducations(currentUserProfile.partnerPreference?.educations || []);

      setProfileStatus(currentUserProfile.status || "Active");
      setDeactivateReason(currentUserProfile.inactiveReason || "Married Done");
    }
  }, [currentUserProfile]);

  // Fetch Profiles on filter change
  const fetchProfiles = async (pageToFetch = 1, isLoadMore = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSects.length > 0) params.append("sects", selectedSects.join(","));
      if (selectedDistricts.length > 0) params.append("districts", selectedDistricts.join(","));
      if (selectedEducations.length > 0) params.append("educations", selectedEducations.join(","));
      if (selectedMaritalStatuses.length > 0) params.append("maritalStatuses", selectedMaritalStatuses.join(","));
      params.append("minAge", minAge.toString());
      params.append("maxAge", maxAge.toString());
      params.append("minHeight", minHeight.toString());
      params.append("maxHeight", maxHeight.toString());
      if (isVerifiedOnly) params.append("isVerifiedOnly", "true");
      if (searchQuery) params.append("searchQuery", searchQuery);
      params.append("sortBy", sortBy);
      params.append("page", pageToFetch.toString());
      params.append("limit", "6"); // Show 6 per page to easily demonstrate pagination

      const response = await fetch(`/api/profiles?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (isLoadMore) {
          setProfiles((prev) => [...prev, ...data.profiles]);
        } else {
          setProfiles(data.profiles);
        }
        setPage(data.page);
        setHasMore(data.hasMore);
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Error fetching profiles:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles(1, false);
  }, [selectedSects, selectedDistricts, selectedEducations, selectedMaritalStatuses, minAge, maxAge, minHeight, maxHeight, isVerifiedOnly, activeTab, sortBy]);

  const handleToggleDeactivate = async () => {
    const isCurrentlyActive = currentUserProfile?.status === "Active" || currentUserProfile?.status === undefined;
    const nextStatus = isCurrentlyActive ? "Inactive" : "Active";
    const promptMessage = isCurrentlyActive 
      ? "Are you sure you want to temporarily deactivate your profile?\n\nIt will be hidden from search recommendations and other candidates, but you can still log in and reactivate it anytime."
      : "Reactivate your profile now?\n\nIt will immediately become visible to understanding candidates again!";
      
    if (!confirm(promptMessage)) {
      return;
    }
    
    try {
      const res = await fetch("/api/profiles/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, inactiveReason: "Temporarily deactivated by user" })
      });
      const data = await res.json();
      if (res.ok) {
        alert(isCurrentlyActive ? "Your profile is now inactive and hidden from other users." : "Your profile has been successfully reactivated!");
        onUpdateMyProfile(data.profile);
      } else {
        alert(data.error || "Failed to update profile status.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure you want to permanently delete your account?\n\nThis cannot be undone and you will lose access to KalyanHub permanently.")) {
      return;
    }
    if (!confirm("Confirming for the second time:\n\nAll your profile data will be permanently hidden and you will never be able to log in with this account again.")) {
      return;
    }
    
    try {
      const res = await fetch("/api/profiles/delete-account", {
        method: "POST"
      });
      if (res.ok) {
        alert("Your account has been permanently deleted. Goodbye.");
        window.location.href = "/";
      } else {
        alert("Failed to delete account. Please contact admin.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles(1, false);
  };

  const handleToggleSect = (sect: Sect) => {
    if (selectedSects.includes(sect)) {
      setSelectedSects(selectedSects.filter((s) => s !== sect));
    } else {
      setSelectedSects([...selectedSects, sect]);
    }
  };

  const handleToggleDistrict = (dist: District) => {
    if (selectedDistricts.includes(dist)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== dist));
    } else {
      setSelectedDistricts([...selectedDistricts, dist]);
    }
  };

  const handleToggleEdu = (edu: EducationType) => {
    if (selectedEducations.includes(edu)) {
      setSelectedEducations(selectedEducations.filter((e) => e !== edu));
    } else {
      setSelectedEducations([...selectedEducations, edu]);
    }
  };

  const handleToggleMaritalStatus = (status: string) => {
    if (selectedMaritalStatuses.includes(status)) {
      setSelectedMaritalStatuses(selectedMaritalStatuses.filter((s) => s !== status));
    } else {
      setSelectedMaritalStatuses([...selectedMaritalStatuses, status]);
    }
  };

  const resetFilters = () => {
    setSelectedSects([]);
    setSelectedDistricts([]);
    setSelectedEducations([]);
    setSelectedMaritalStatuses([]);
    setMinAge(18);
    setMaxAge(45);
    setMinHeight(140);
    setMaxHeight(200);
    setIsVerifiedOnly(false);
    setSearchQuery("");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      const payload = {
        fullName: editName,
        age: Number(editAge),
        height: Number(editHeight),
        district: editDistrict,
        sect: editSect,
        education: editEdu,
        educationDetails: editEduDetails,
        occupation: editOccupation,
        company: editCompany,
        incomeRange: editIncome,
        aboutMe: editAbout,
        phone: editPhone,
        photos: editPhotos,
        maritalStatus: editMaritalStatus,
        profileFor: editProfileFor,
        address: editAddress,
        family: {
          fatherName,
          fatherStatus,
          fatherOccupation: fatherStatus === "Passed Away" ? "" : fatherOcc,
          motherName,
          motherOccupation: motherOcc,
          familyStatus: famStatus,
          familyValues: famValues,
          siblingsDetails: siblings,
          nativePlace: nativePl
        },
        partnerPreference: {
          minAge: Number(prefMinAge),
          maxAge: Number(prefMaxAge),
          minHeight: Number(prefMinHeight),
          maxHeight: Number(prefMaxHeight),
          sects: prefSects,
          districts: prefDistricts,
          educations: prefEducations
        }
      };

      const res = await fetch("/api/profiles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        onUpdateMyProfile(data.profile);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 5000);
      } else {
        throw new Error(data.error || "Failed to save profile. The server rejected the profile update.");
      }
    } catch (err: any) {
      console.error("Error updating profile", err);
      const errMsg = err.message || "An unexpected network error occurred while saving profile changes.";
      setUpdateError(errMsg);
      alert("Error: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const completeness = getProfileCompleteness(currentUserProfile);

  // Favorites filter
  const favoritedProfiles = profiles.filter((p) => currentUserFavorites.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="dashboard_workspace">
      {/* Upper Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-6 mb-8 gap-6">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 shrink-0" />
            {activeTab === "matches" ? "Recommended Partners" : activeTab === "favorites" ? "Shortlisted Candidates" : "Your Matrimony Cabin"}
          </h2>
          <p className="text-xs text-gray-500 mt-2 font-sans">
            {activeTab === "matches"
              ? "Handpicked prospective matches conforming to your profile and beliefs."
              : activeTab === "favorites"
              ? "Profiles you marked with interest for further family considerations."
              : "Keep your profile up to date to get highly matched partners."}
          </p>
        </div>

        {/* Custom Tab selectors - capsule style matching screenshot, responsive with horizontal swipe on mobile */}
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white border border-gray-300 p-1 rounded-2xl sm:rounded-full shadow-2xs gap-1.5 self-stretch sm:self-auto justify-start sm:justify-start whitespace-nowrap">
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === "matches"
                ? "bg-[#034435] text-white shadow-2xs"
                : "text-gray-500 hover:text-emerald-950 hover:bg-gray-50"
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === "favorites"
                ? "bg-[#034435] text-white shadow-2xs"
                : "text-gray-500 hover:text-emerald-950 hover:bg-gray-50"
            }`}
          >
            Shortlist ({currentUserFavorites.length})
          </button>
          <button
            onClick={() => setActiveTab("myprofile")}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === "myprofile"
                ? "bg-[#034435] text-white shadow-2xs"
                : "text-gray-500 hover:text-emerald-950 hover:bg-gray-50"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Dashboard</span>
            {completeness.percent < 100 && (
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-white animate-pulse shrink-0" title={`Profile is ${completeness.percent}% complete! Please fill in missing details.`} />
            )}
          </button>
        </div>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="space-y-6" id="dashboard_content_body">
        
        {completeness.percent < 100 && (
          <div className="max-w-7xl mx-auto p-5 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-fade-in" id="profile_incomplete_highlight">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-amber-600 fill-amber-500/10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-gray-900">
                  Complete Your Matrimony Profile ({completeness.percent}% Filled)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed max-w-3xl font-sans">
                  To establish family trust and secure hand-verified proposals, all members are required to fill out their profile completely. Please update your: <span className="font-semibold text-amber-900">{completeness.missingFields.slice(0, 4).join(", ")}{completeness.missingFields.length > 4 ? "..." : ""}</span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("myprofile")}
              className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
            >
              Complete Now →
            </button>
          </div>
        )}

        {/* Full-width Search & Horizontal Collapsible Filters */}
        {activeTab !== "myprofile" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Search Input Bar - Wide & Elegant */}
            <form onSubmit={handleSearchSubmit} className="relative shadow-3xs">
              <input
                type="text"
                placeholder="Search job, name, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-6 pr-12 py-3.5 rounded-2xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent placeholder-gray-400 font-sans shadow-3xs"
              />
              <button 
                type="submit" 
                className="absolute right-3 top-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-emerald-950 transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Custom Horizontal Controls: Filters Trigger & Sort Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="py-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center justify-center gap-2.5 cursor-pointer shadow-3xs hover:bg-gray-50/50 hover:border-emerald-800/20 transition-all"
              >
                <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{mobileFiltersOpen ? "Hide Advanced Filters" : "Show Advanced Filters"}</span>
              </button>

              <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-1.5 shadow-3xs hover:border-emerald-800/20 transition-all">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mr-2 shrink-0">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "default")}
                  className="w-full bg-transparent text-xs font-bold text-emerald-950 focus:outline-none border-none py-2 cursor-pointer"
                >
                  <option value="newest">🆕 Newly Created (Recent Joins)</option>
                  <option value="default">🤝 Default Matching Order</option>
                </select>
              </div>
            </div>

            {/* Collapsible Horizontal Bento Filters Panel */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 space-y-6 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-950 flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-amber-600" /> Filter Matrimony Criteria
                    </span>
                    <button
                      onClick={resetFilters}
                      className="text-xs font-bold text-gray-400 hover:text-emerald-900 cursor-pointer uppercase tracking-wider transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Sect Column */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Sect (Deen Wing)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.values(Sect).map((sect) => {
                          const isChecked = selectedSects.includes(sect);
                          return (
                            <button
                              key={sect}
                              type="button"
                              onClick={() => handleToggleSect(sect)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                isChecked
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-900 shadow-3xs"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {sect}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* District Column */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">District / Native</span>
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {Object.values(District).map((district) => {
                          const isChecked = selectedDistricts.includes(district);
                          return (
                            <button
                              key={district}
                              type="button"
                              onClick={() => handleToggleDistrict(district)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                isChecked
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-900 shadow-3xs"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {district}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Education Column */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Education Group</span>
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {Object.values(EducationType).map((edu) => {
                          const isChecked = selectedEducations.includes(edu);
                          return (
                            <button
                              key={edu}
                              type="button"
                              onClick={() => handleToggleEdu(edu)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-900 shadow-3xs"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {edu}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Marital Status Column */}
                    <div className="space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Marital Status</span>
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {["Never Married", "Divorced", "Widowed", "Awaiting Divorce", "Separated"].map((status) => {
                          const isChecked = selectedMaritalStatuses.includes(status);
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleToggleMaritalStatus(status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-900 shadow-3xs"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Age and Verification Column */}
                    <div className="space-y-5">
                      {/* Age Bracket */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Age Bracket</span>
                          <span className="text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            {minAge} - {maxAge} Yrs
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min Age</span>
                            <input
                              type="number"
                              min="18"
                              max="60"
                              value={minAge}
                              onChange={(e) => setMinAge(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Age</span>
                            <input
                              type="number"
                              min="18"
                              max="60"
                              value={maxAge}
                              onChange={(e) => setMaxAge(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Verified Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-900/5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-amber-500 fill-amber-500/10" /> Hand-Verified Only
                        </span>
                        <input
                          type="checkbox"
                          checked={isVerifiedOnly}
                          onChange={(e) => setIsVerifiedOnly(e.target.checked)}
                          className="rounded text-emerald-800 focus:ring-emerald-800 w-4 h-4 accent-emerald-800 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* MAIN RESULTS DISPLAY PANELS */}
        <div className="max-w-7xl mx-auto w-full">
          
          {/* TAB: Matches Results */}
          {activeTab === "matches" && (
            <div>
              {/* Deactivated Notice Banner */}
              {(currentUserProfile?.status === "Inactive" || currentUserProfile?.isDeactivated) && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs max-w-7xl mx-auto">
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-amber-100 rounded-full text-amber-800 shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Your Profile is Temporarily Inactive</h5>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Your profile is currently hidden from recommendations and search listings. Feel free to browse, but other candidates cannot find you until you reactivate!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleDeactivate}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap self-stretch sm:self-auto text-center cursor-pointer"
                  >
                    Reactivate Profile Now
                  </button>
                </div>
              )}

              {/* Preferences matching filter switch */}
              {currentUserProfile?.isVerified && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white border border-gray-150 p-4 rounded-2xl shadow-3xs max-w-7xl mx-auto gap-4">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-[#034435] flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 animate-pulse" />
                      Dynamic Match Discovery
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      Switch between general matches and tailored recommendations based on your partner preferences.
                    </p>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 self-stretch sm:self-auto justify-between sm:justify-start">
                    <button
                      type="button"
                      onClick={() => setShowRecommendedOnly(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                        !showRecommendedOnly
                          ? "bg-[#034435] text-white shadow-3xs"
                          : "text-gray-500 hover:text-emerald-950"
                      }`}
                    >
                      All Verified Candidates
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRecommendedOnly(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        showRecommendedOnly
                          ? "bg-[#034435] text-white shadow-3xs"
                          : "text-gray-500 hover:text-emerald-950"
                      }`}
                    >
                      ⭐ Tailored Recommendations
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Sorting compatible profiles...</p>
                </div>
              ) : !currentUserProfile?.isVerified ? (
                <div className="bg-gradient-to-br from-white to-emerald-50/10 rounded-2xl border border-gray-150 p-12 text-center space-y-5 shadow-3xs max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800 border border-emerald-100 shadow-3xs">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif text-lg font-bold text-emerald-950">Verification Pending</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Assalamu Alaikum! To maintain an authentic and trusted environment, KalyanHub hides profile search and discovery until our team manually verifies your profile.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50/50 border border-amber-100/60 rounded-xl inline-block max-w-md text-left">
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      💡 <strong>Tip for quick approval:</strong> Make sure you have entered correct details, specified education, and added a clear profile photo.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={() => setActiveTab("myprofile")}
                      className="px-4 py-2.5 bg-emerald-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-emerald-800 cursor-pointer active:scale-98 transition-all"
                    >
                      Complete Profile Details
                    </button>
                    <a
                      href={`https://wa.me/919496538664?text=Assalamu%20Alaikum%20Admin,%20I%20have%20registered%20on%20KalyanHub.%20Please%20verify%20my%20profile.%20My%20Name:%20${encodeURIComponent(currentUserProfile?.fullName || "")}%20ID:%20${encodeURIComponent(currentUserProfile?.id || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.887-6.968C16.683 1.968 14.211 1.01 11.582 1.01 6.15 1.01 1.725 5.43 1.72 10.862c-.001 1.702.447 3.366 1.301 4.8l-.426 1.556 1.595-.418zM17.487 14.39c-.322-.162-1.91-.942-2.203-1.049-.293-.108-.507-.162-.72.162-.213.324-.827 1.049-1.014 1.265-.187.215-.373.242-.695.08-.322-.162-1.36-.5-2.59-1.6-.957-.852-1.602-1.905-1.79-2.228-.187-.324-.02-.499.141-.659.145-.144.322-.377.483-.565.161-.188.215-.323.322-.539.107-.215.053-.404-.027-.565-.08-.162-.72-1.742-.987-2.388-.26-.627-.525-.541-.72-.551-.186-.01-.4-.01-.614-.01-.213 0-.56.08-.853.404-.293.324-1.12 1.096-1.12 2.673 0 1.578 1.147 3.1 1.307 3.315.16.215 2.257 3.447 5.47 4.832.763.329 1.36.525 1.824.673.768.243 1.467.209 2.02.127.616-.093 1.91-.78 2.176-1.496.267-.717.267-1.328.187-1.457-.08-.129-.294-.216-.615-.378z" />
                      </svg>
                      Notify Admin on WhatsApp
                    </a>
                  </div>
                </div>
              ) : profiles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center space-y-4 shadow-3xs">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <Search className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-emerald-950">No Candidates Found Matching Filters</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Try broadening your search metrics (e.g. including surrounding districts like Kozhikode or Malappuram, or choosing "Any Sect").
                  </p>
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-emerald-800 cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    const displayedProfiles = showRecommendedOnly
                      ? profiles.filter(p => {
                          const pref = currentUserProfile?.partnerPreference;
                          if (!pref) return true;

                          if (pref.minAge && p.age < pref.minAge) return false;
                          if (pref.maxAge && p.age > pref.maxAge) return false;
                          if (pref.minHeight && p.height < pref.minHeight) return false;
                          if (pref.maxHeight && p.height > pref.maxHeight) return false;
                          if (pref.sects && pref.sects.length > 0 && !pref.sects.includes(p.sect)) return false;
                          if (pref.districts && pref.districts.length > 0 && !pref.districts.includes(p.district)) return false;
                          if (pref.educations && pref.educations.length > 0 && !pref.educations.includes(p.education)) return false;

                          return true;
                        })
                      : profiles;

                    if (displayedProfiles.length === 0) {
                      return (
                        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center space-y-4 shadow-3xs max-w-2xl mx-auto my-6">
                          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
                            <Sparkles className="w-7 h-7" />
                          </div>
                          <h4 className="font-serif text-lg font-bold text-emerald-950">No Recommendation Candidates Found</h4>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                            We couldn&rsquo;t find profiles matching your exact criteria. Try adjusting your partner preferences in &ldquo;My Dashboard&rdquo; or switch back to &ldquo;All Verified Matches&rdquo;.
                          </p>
                          <div className="flex gap-3 justify-center pt-2">
                            <button
                              type="button"
                              onClick={() => setShowRecommendedOnly(false)}
                              className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-emerald-800 cursor-pointer transition-colors"
                            >
                              Show All Matches
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("myprofile");
                                setTimeout(() => {
                                  const prefSec = document.getElementById("partner_preferences_card");
                                  if (prefSec) prefSec.scrollIntoView({ behavior: "smooth" });
                                }, 100);
                              }}
                              className="px-4 py-2 bg-amber-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-amber-900 cursor-pointer transition-colors"
                            >
                              Adjust Preferences
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedProfiles.map((prof) => (
                          <ProfileCard
                            key={prof.id}
                            profile={prof}
                            isFavorited={currentUserFavorites.includes(prof.id)}
                            onSelect={onSelectProfile}
                            onToggleFavorite={(profileId, e) => {
                              e.stopPropagation();
                              onToggleFavorite(profileId);
                            }}
                          />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Pagination load more / indicator */}
                  <div className="pt-6 border-t border-gray-100 flex flex-col items-center justify-center space-y-3">
                    <p className="text-xs text-gray-400 font-medium">
                      Showing {profiles.length} of {total} verified compatible profiles
                    </p>

                    {hasMore && (
                      <button
                        onClick={() => fetchProfiles(page + 1, true)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-[#faf8f5] border border-gray-200 text-emerald-950 hover:text-emerald-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-3xs disabled:opacity-50"
                      >
                        {loading ? (
                          <span className="w-3.5 h-3.5 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        )}
                        Load More Profiles
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Shortlisted Favorites */}
          {activeTab === "favorites" && (
            <div>
              {!currentUserProfile?.isVerified ? (
                <div className="bg-gradient-to-br from-white to-emerald-50/10 rounded-2xl border border-gray-150 p-12 text-center space-y-4 shadow-3xs max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800 border border-emerald-100 shadow-3xs">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-emerald-950">Verification Required</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Shortlists and bookmarks are locked until your profile is vetted and verified by our system administrators.
                  </p>
                </div>
              ) : favoritedProfiles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center space-y-4 shadow-3xs">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-emerald-950">No Bookmarked Matches Yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Tap the heart icon on any recommended partner's profile to shortlist them. They will appear here for easy reference during family reviews.
                  </p>
                  <button
                    onClick={() => setActiveTab("matches")}
                    className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-emerald-800 cursor-pointer"
                  >
                    Browse Candidates
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoritedProfiles.map((prof) => (
                    <ProfileCard
                      key={prof.id}
                      profile={prof}
                      isFavorited={true}
                      onSelect={onSelectProfile}
                      onToggleFavorite={(profileId, e) => {
                        e.stopPropagation();
                        onToggleFavorite(profileId);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: User Dashboard Cabin (Edit My Profile) */}
          {activeTab === "myprofile" && (
            <div className="bg-white rounded-2xl border border-gray-150 p-6 sm:p-8 shadow-3xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-5 mb-8 gap-4">
                <div className="flex items-center gap-4">
                  {/* Mock profile avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-emerald-900/10 shadow-xs relative shrink-0">
                    <img
                      src={currentUserProfile?.photos[0] || getAvatarPlaceholder(currentUserProfile?.gender || "Female", currentUserProfile?.id)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-emerald-950">{currentUserProfile?.fullName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {currentUserProfile?.isVerified ? "Vetted & Verified Premium Partner" : "Verification Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Completeness Progress Card */}
                <div className="w-full sm:w-72 space-y-2 bg-amber-50/40 p-4 rounded-2xl border border-amber-100 shrink-0">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-gray-500">Profile Completeness</span>
                    <span className={completeness.percent === 100 ? "text-emerald-850 font-black" : "text-amber-800 font-black"}>
                      {completeness.percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200/70 h-2 rounded-full overflow-hidden border border-gray-300/30">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        completeness.percent === 100 
                          ? "bg-emerald-800" 
                          : completeness.percent >= 70 
                          ? "bg-amber-500" 
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${completeness.percent}%` }}
                    />
                  </div>
                  {completeness.percent < 100 ? (
                    <p className="text-[9px] text-gray-500 leading-tight">
                      Please complete the <span className="font-bold text-amber-900">{completeness.missingFields.length} missing fields</span> highlighted below to build family trust.
                    </p>
                  ) : (
                    <p className="text-[9px] text-emerald-800 font-bold leading-tight flex items-center gap-1">
                      ✓ Your profile is 100% complete. Thank you!
                    </p>
                  )}
                </div>

                {updateSuccess && (
                  <div className="px-4 py-2 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200 flex items-center gap-1.5 animate-bounce">
                    <Check className="w-4 h-4" /> Profile updated successfully!
                  </div>
                )}
              </div>

              {/* Photo Privacy & Access Management Control Board */}
              <div className="mb-10 bg-gradient-to-br from-[#faf8f5] to-emerald-50/40 p-6 rounded-3xl border border-emerald-950/5 grid grid-cols-1 md:grid-cols-12 gap-8 shadow-xs">
                <div className="md:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-300/20 px-3 py-1 rounded-full">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-[9px] font-bold text-amber-900 uppercase tracking-widest">Privacy Controls</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-emerald-950">Photo Privacy Control</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Protect your identity. Enable photo blurring to restrict images to only candidates you explicitly authorize.
                  </p>

                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-150 shadow-3xs">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Blur My Photos</span>
                      <span className="text-[10px] text-gray-400">Other members must request access</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPhotoBlurred}
                        onChange={handleTogglePhotoBlur}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4 border-t md:border-t-0 md:border-l border-gray-200/60 md:pl-8 pt-6 md:pt-0">
                  <h4 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-widest">
                    Incoming Photo Access Requests ({photoRequests.pending.length})
                  </h4>

                  {photoRequests.pending.length === 0 ? (
                    <div className="text-center py-8 bg-white/40 rounded-2xl border border-dashed border-gray-200">
                      <Lock className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No pending access requests.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {photoRequests.pending.map((reqUser) => (
                        <div key={reqUser.id} className="p-3.5 bg-white rounded-2xl border border-gray-150 flex items-center justify-between gap-3 shadow-3xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                              <img src={reqUser.photos[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-emerald-950 block">{reqUser.fullName}</span>
                              <span className="text-[10px] text-gray-400 font-mono font-semibold">{reqUser.age} Yrs • {reqUser.district}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(reqUser.id)}
                              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(reqUser.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {photoRequests.approved.length > 0 && (
                    <div className="pt-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Authorized Members ({photoRequests.approved.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {photoRequests.approved.map(appUser => (
                          <div key={appUser.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-semibold text-emerald-950">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {appUser.fullName.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Management Gallery Manager */}
              <div className="mb-10 p-6 sm:p-8 bg-emerald-50/20 border border-emerald-950/10 rounded-3xl space-y-6" id="photo_gallery_manager_card">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                    📸
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-bold text-emerald-950">Manage My Photos</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Upload, change, or rearrange your matrimony photos. The first photo is your primary profile display. Click &ldquo;Save Profile Changes&rdquo; below to update.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left part: current photos */}
                  <div className="lg:col-span-7 space-y-4">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Current Gallery ({editPhotos.length} / 4)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {editPhotos.map((url, index) => (
                        <div key={index} className="group relative aspect-square bg-gray-100 rounded-2xl border border-gray-150 overflow-hidden shadow-3xs hover:border-emerald-800 transition-all">
                          <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          
                          {/* Position Badge */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-3xs">
                            {index === 0 ? "★ Primary" : `#${index + 1}`}
                          </div>

                          {/* Hover Overlay Controls */}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1.5">
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [url, ...editPhotos.filter((_, i) => i !== index)];
                                  setEditPhotos(updated);
                                }}
                                className="w-full py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                              >
                                Make Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editPhotos.filter((_, i) => i !== index);
                                setEditPhotos(updated);
                              }}
                              className="w-full py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Empty Placeholder slots up to 4 */}
                      {Array.from({ length: Math.max(0, 4 - editPhotos.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-3">
                          <span className="text-gray-300 text-xs">Slot {editPhotos.length + i + 1}</span>
                          <span className="text-[9px] text-gray-400 mt-1">Empty</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right part: Add photo */}
                  <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-gray-200/60 lg:pl-8 pt-6 lg:pt-0">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Add a Photo</span>
                      
                      {/* Drag and Drop Zone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleImageFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById("photo_file_upload_input");
                          if (fileInput) fileInput.click();
                        }}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                          isDragging
                            ? "border-emerald-800 bg-emerald-50/50 scale-[1.01]"
                            : "border-gray-200 bg-gray-50/40 hover:bg-emerald-50/10 hover:border-emerald-800/50"
                        }`}
                      >
                        <input
                          id="photo_file_upload_input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFile(e.target.files[0]);
                            }
                          }}
                        />
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDragging ? "bg-emerald-100 text-emerald-800 animate-pulse" : "bg-gray-100 text-gray-500"}`}>
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-800">
                            Drag &amp; drop your photo here
                          </p>
                          <p className="text-[10px] text-gray-500">
                            or <span className="text-emerald-800 font-semibold underline">browse file</span> from computer
                          </p>
                        </div>
                        <p className="text-[9px] text-gray-400">
                          Supports JPG, PNG (Auto-compressed)
                        </p>
                      </div>

                      {/* Or divider */}
                      <div className="flex items-center my-3">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="px-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Or paste URL</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          id="new_photo_url_input"
                          type="url"
                          placeholder="Paste photo image URL..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                if (editPhotos.length >= 4) {
                                  alert("Maximum 4 photos allowed in the gallery.");
                                  return;
                                }
                                setEditPhotos([...editPhotos, input.value.trim()]);
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("new_photo_url_input") as HTMLInputElement;
                            if (input && input.value.trim()) {
                              if (editPhotos.length >= 4) {
                                alert("Maximum 4 photos allowed in the gallery.");
                                return;
                              }
                              setEditPhotos([...editPhotos, input.value.trim()]);
                              input.value = "";
                            }
                          }}
                          className="px-3 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select From Premium Avatars</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((variantNum) => getAvatarPlaceholder(currentUserProfile?.gender || "Female", variantNum))
                        .map((presetUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={editPhotos.includes(presetUrl)}
                            onClick={() => {
                              if (editPhotos.length >= 4) {
                                alert("Maximum 4 photos allowed.");
                                return;
                              }
                              setEditPhotos([...editPhotos, presetUrl]);
                            }}
                            className={`relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
                              editPhotos.includes(presetUrl)
                                ? "border-emerald-800 opacity-40 cursor-not-allowed scale-95"
                                : "border-gray-200 hover:border-emerald-800 hover:scale-105 active:scale-95"
                            }`}
                          >
                            <img src={presetUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-8">
                {/* 1. Basic Bio-data */}
                <div className="space-y-4">
                  <h4 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-widest border-l-3 border-gold-600 pl-2">
                    1. Core Personal Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Full Name</span>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Age (Years)</span>
                      <input
                        type="number"
                        required
                        min="18"
                        max="70"
                        value={editAge}
                        onChange={(e) => setEditAge(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Height (cm)</span>
                      <input
                        type="number"
                        required
                        min="100"
                        max="240"
                        value={editHeight}
                        onChange={(e) => setEditHeight(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Native District</span>
                      <select
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value as District)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        {Object.values(District).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Sect / Deen Line</span>
                      <select
                        value={editSect}
                        onChange={(e) => setEditSect(e.target.value as Sect)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        {Object.values(Sect).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Education Group</span>
                      <select
                        value={editEdu}
                        onChange={(e) => setEditEdu(e.target.value as EducationType)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        {Object.values(EducationType).map((edu) => (
                          <option key={edu} value={edu}>
                            {edu}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Contact Phone Number</span>
                        {(!editPhone || editPhone === "Not specified" || editPhone === "+91 9876543210" || editPhone.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 9447XXXXXX"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white text-xs ${
                          (!editPhone || editPhone === "Not specified" || editPhone === "+91 9876543210" || editPhone.trim() === "") ? "border-amber-300 ring-1 ring-amber-100" : "border-gray-200"
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-gray-500">Profile Created For Whom</span>
                      <select
                        value={editProfileFor}
                        onChange={(e) => setEditProfileFor(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        <option value="Self">Self</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Parent">Parent</option>
                        <option value="Relative">Relative</option>
                        <option value="Friend">Friend</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-gray-500">Marital Status</span>
                      <select
                        value={editMaritalStatus}
                        onChange={(e) => setEditMaritalStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        <option value="Never Married">Never Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Awaiting Divorce">Awaiting Divorce</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <span className="text-gray-500">Confidential Contact Address (Hides from non-premium)</span>
                      <input
                        type="text"
                        placeholder="e.g. Baitul Noor, Hill Palace Road, Ernakulam"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Educational & Profession */}
                <div className="space-y-4">
                  <h4 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-widest border-l-3 border-gold-600 pl-2">
                    2. Qualifications & Professional Employment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Education Details</span>
                        {(!editEduDetails || editEduDetails === "Not specified" || editEduDetails.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech in CS, NIT Calicut"
                        value={editEduDetails}
                        onChange={(e) => setEditEduDetails(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!editEduDetails || editEduDetails === "Not specified" || editEduDetails.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Occupation Designation</span>
                        {(!editOccupation || editOccupation === "Not specified" || editOccupation.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Tech Architect / Physician"
                        value={editOccupation}
                        onChange={(e) => setEditOccupation(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!editOccupation || editOccupation === "Not specified" || editOccupation.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Company Name / Location</span>
                      <input
                        type="text"
                        placeholder="e.g. InfoPark, Kakkanad Kochi"
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Annual Income Range (Optional)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. ₹10L - ₹12L per annum"
                        value={editIncome}
                        onChange={(e) => setEditIncome(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. FAMILY DATA (Extremely crucial) */}
                <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-150">
                  <h4 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-widest border-l-3 border-emerald-900 pl-2 mb-2">
                    3. Family Roots & Reputation Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Father's Name</span>
                        {(!fatherName || fatherName === "Not specified" || fatherName.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!fatherName || fatherName === "Not specified" || fatherName.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Father's Status</span>
                      <select
                        value={fatherStatus}
                        onChange={(e) => {
                          const val = e.target.value as "Alive" | "Passed Away";
                          setFatherStatus(val);
                          if (val === "Passed Away") {
                            setFatherOcc("");
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        <option value="Alive">Alive</option>
                        <option value="Passed Away">Passed Away</option>
                      </select>
                    </div>
                    {fatherStatus === "Alive" && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Father's Employment</span>
                          {(!fatherOcc || fatherOcc === "Not specified" || fatherOcc.trim() === "") && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={fatherOcc}
                          onChange={(e) => setFatherOcc(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                            (!fatherOcc || fatherOcc === "Not specified" || fatherOcc.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                          }`}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Mother's Name</span>
                        {(!motherName || motherName === "Not specified" || motherName.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!motherName || motherName === "Not specified" || motherName.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Mother's Employment</span>
                        {(!motherOcc || motherOcc === "Not specified" || motherOcc.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={motherOcc}
                        onChange={(e) => setMotherOcc(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!motherOcc || motherOcc === "Not specified" || motherOcc.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Family Financial Status</span>
                      <select
                        value={famStatus}
                        onChange={(e) => setFamStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        <option value="Middle Class">Middle Class</option>
                        <option value="Upper Middle Class">Upper Middle Class</option>
                        <option value="Affluent">Affluent</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500">Family Values Style</span>
                      <select
                        value={famValues}
                        onChange={(e) => setFamValues(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white"
                      >
                        <option value="Orthodox">Orthodox</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Liberal">Liberal</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Native Town / Mahalla Locality</span>
                        {(!nativePl || nativePl === "Not specified" || nativePl.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Kondotty, Perinthalmanna"
                        value={nativePl}
                        onChange={(e) => setNativePl(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!nativePl || nativePl === "Not specified" || nativePl.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Siblings Details</span>
                        {(!siblings || siblings === "Not specified" || siblings === "None" || siblings.trim() === "") && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Missing info</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. One elder brother (Married, working in Qatar)"
                        value={siblings}
                        onChange={(e) => setSiblings(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white ${
                          (!siblings || siblings === "Not specified" || siblings === "None" || siblings.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. About Me Statement */}
                <div className="space-y-4">
                  <h4 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-widest border-l-3 border-gold-600 pl-2">
                    4. Personal Introduction Statement
                  </h4>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Tell others about your personality and partner criteria</span>
                      {(!editAbout || editAbout === "Not specified" || editAbout.includes("have recently joined") || editAbout.includes("suitable partner") || editAbout.trim() === "") && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">Write a custom statement</span>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={editAbout}
                      onChange={(e) => setEditAbout(e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white text-xs leading-relaxed ${
                        (!editAbout || editAbout === "Not specified" || editAbout.includes("have recently joined") || editAbout.includes("suitable partner") || editAbout.trim() === "") ? "border-amber-300 ring-1 ring-amber-50" : "border-gray-200"
                      }`}
                    />
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    {updateError && (
                      <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-750 text-xs rounded-lg flex items-center gap-1.5 font-medium animate-pulse">
                        <span>⚠️ Error: {updateError}</span>
                      </div>
                    )}
                    {updateSuccess && (
                      <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5 font-medium">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Profile updated successfully!</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-emerald-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-800 cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 sm:self-end"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Save Cabin Changes
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* PASSWORD UPDATE SECTION */}
              <div className="mt-8 pt-8 border-t border-gray-150">
                <div className="bg-white rounded-2xl border border-gray-150 p-6 sm:p-8 shadow-3xs max-w-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-emerald-800" />
                    <h4 className="font-serif text-base font-bold text-emerald-950">Update Account Password</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Keep your account secure by updating your password. Make sure it is strong and easy to remember.
                  </p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const currentPassword = (form.elements.namedItem("currentPassword") as HTMLInputElement).value;
                    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
                    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
                    
                    if (newPassword !== confirmPassword) {
                      alert("New passwords do not match!");
                      return;
                    }
                    
                    try {
                      const res = await fetch("/api/auth/update-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ currentPassword, newPassword })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert("Password updated successfully!");
                        form.reset();
                      } else {
                        alert(data.error || "Failed to update password");
                      }
                    } catch (err) {
                      console.error(err);
                      alert("An error occurred. Please try again.");
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Current Password</span>
                        <input
                          name="currentPassword"
                          type="password"
                          required
                          placeholder="••••••"
                          className="w-full px-3 py-2 rounded-lg border border-gray-250 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">New Password</span>
                        <input
                          name="newPassword"
                          type="password"
                          required
                          placeholder="••••••"
                          className="w-full px-3 py-2 rounded-lg border border-gray-250 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Confirm New Password</span>
                        <input
                          name="confirmPassword"
                          type="password"
                          required
                          placeholder="••••••"
                          className="w-full px-3 py-2 rounded-lg border border-gray-250 focus:outline-none focus:ring-1 focus:ring-emerald-800 bg-white text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors cursor-pointer"
                      >
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Account Status & Danger Zone Block */}
              <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden mt-6" id="danger_zone_section">
                <div className="bg-amber-50/30 border-b border-gray-150 p-4 sm:p-5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">Account Status & Danger Zone</span>
                </div>
                <div className="p-5 space-y-6">
                  {/* Temporary Deactivation Option */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                        <span>Temporary Deactivation</span>
                        {currentUserProfile?.status === "Inactive" || currentUserProfile?.isDeactivated ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-md">Currently Inactive</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md">Currently Active</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed max-w-2xl">
                        {(currentUserProfile?.status === "Inactive" || currentUserProfile?.isDeactivated)
                          ? "Your profile is currently deactivated. No other matrimony candidates can see you in searches or matches. You can reactivate anytime to become visible again."
                          : "Temporarily deactivate your profile to hide it from all other users on the portal. You can still log in, browse, and reactivate whenever you are ready."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleDeactivate}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-wider self-start md:self-auto cursor-pointer ${
                        currentUserProfile?.status === "Inactive" || currentUserProfile?.isDeactivated
                          ? "bg-emerald-900 hover:bg-emerald-800 text-white"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                    >
                      {currentUserProfile?.status === "Inactive" || currentUserProfile?.isDeactivated ? "Reactivate Profile" : "Deactivate Profile"}
                    </button>
                  </div>

                  {/* Permanent Deletion Option */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-red-100 bg-red-50/10 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-red-900 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-700" />
                        <span>Permanent Account Deletion</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed max-w-2xl">
                        Deleting your account will permanently erase your profile details, family setup, and photos from the registry. You will be logged out immediately and cannot log in with this account ever again.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all self-start md:self-auto cursor-pointer"
                    >
                      Delete Account Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
