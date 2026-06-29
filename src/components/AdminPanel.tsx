import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  UserPlus, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Award, 
  FileText, 
  Check, 
  X,
  CreditCard,
  Building,
  MapPin,
  Briefcase,
  Link2,
  AlertCircle,
  Info,
  Sparkles
} from "lucide-react";
import { User, Profile, District, Sect, EducationType } from "../types";
import { formatProfileCode, getAvatarPlaceholder } from "../utils/avatar";

interface AdminPanelProps {
  onBackToDashboard: () => void;
  currentUser: User | null;
}

export default function AdminPanel({ onBackToDashboard, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"users" | "profiles" | "create">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [promoDisabled, setPromoDisabled] = useState(false);
  const [realOtpEnabled, setRealOtpEnabled] = useState(false);
  const [showArchitectureInfo, setShowArchitectureInfo] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [viewingProofUrl, setViewingProofUrl] = useState<{ url: string; user: string } | null>(null);
  
  // Search and filter filters
  const [userQuery, setUserQuery] = useState("");
  const [profileQuery, setProfileQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "promotional" | "free">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");

  // Create Profile Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    gender: "Female" as "Male" | "Female",
    age: "24",
    height: "160",
    weight: "54",
    district: District.Malappuram,
    sect: Sect.General,
    education: EducationType.Graduate,
    educationDetails: "Bachelor of Commerce (B.Com)",
    occupation: "Accountant",
    incomeRange: "₹3L - ₹5L per annum",
    aboutMe: "I am a simple, down-to-earth person who values family traditions. Looking for a compatible and practicing partner.",
    religiousPractice: "Practicing" as "Very practicing" | "Practicing" | "Moderate" | "Liberal",
    fatherName: "K. Abdul Rahman",
    fatherOccupation: "Retired Government Employee",
    motherName: "Khadeeja",
    motherOccupation: "Homemaker",
    familyStatus: "Middle Class" as "Middle Class" | "Upper Middle Class" | "Affluent",
    familyValues: "Moderate" as "Orthodox" | "Traditional" | "Moderate" | "Liberal",
    siblingsDetails: "1 Brother (married), 1 Sister (studying)",
    nativePlace: "Manjeri, Malappuram",
    phone: "+91 9447231201",
    photoUrl: "",
    userType: "promotional" as "standard" | "promotional",
    maritalStatus: "Never Married" as "Never Married" | "Divorced" | "Widowed" | "Awaiting Divorce" | "Separated",
    profileFor: "Self" as "Self" | "Son" | "Daughter" | "Brother" | "Sister" | "Parent" | "Relative" | "Friend",
    address: ""
  });

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchPromoConfig = async () => {
    try {
      const res = await fetch("/api/admin/promo-toggle", {
        headers: currentUser ? { "X-User-Id": currentUser.id } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setPromoDisabled(!!data.disableAllPromotionalAccess);
      }
    } catch (e) {
      console.error("Error fetching promo config", e);
    }
  };

  const handleTogglePromo = async () => {
    const nextVal = !promoDisabled;
    try {
      const res = await fetch("/api/admin/promo-toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(currentUser ? { "X-User-Id": currentUser.id } : {})
        },
        body: JSON.stringify({ disabled: nextVal })
      });
      if (res.ok) {
        setPromoDisabled(nextVal);
        showMessage(nextVal ? "All promotional premium access stopped!" : "Promotional premium access resumed.");
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        showMessage(errData.error || `Failed to toggle promotional access (Status: ${res.status})`, "error");
      }
    } catch (e) {
      showMessage("Connection error", "error");
    }
  };

  const fetchOtpConfig = async () => {
    try {
      const res = await fetch("/api/admin/otp-toggle", {
        headers: currentUser ? { "X-User-Id": currentUser.id } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRealOtpEnabled(!!data.enableRealOtp);
      }
    } catch (e) {
      console.error("Error fetching OTP config", e);
    }
  };

  const handleToggleOtp = async () => {
    const nextVal = !realOtpEnabled;
    try {
      const res = await fetch("/api/admin/otp-toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(currentUser ? { "X-User-Id": currentUser.id } : {})
        },
        body: JSON.stringify({ enabled: nextVal })
      });
      if (res.ok) {
        setRealOtpEnabled(nextVal);
        showMessage(nextVal ? "Real SMTP OTP enabled (using Brevo/SMTP)." : "Default sandbox OTP (2026) enabled.");
      } else {
        const errData = await res.json().catch(() => ({}));
        showMessage(errData.error || `Failed to toggle OTP verification mode (Status: ${res.status})`, "error");
      }
    } catch (e) {
      showMessage("Connection error", "error");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error("Error fetching users", e);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/admin/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (e) {
      console.error("Error fetching profiles", e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchProfiles(), fetchPromoConfig(), fetchOtpConfig()]).finally(() => setLoading(false));
  }, []);

  const handleUpdatePayment = async (userId: string, isPaid: boolean, status: string, userType?: "standard" | "promotional") => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/update-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid, paymentProofStatus: status, userType })
      });
      if (res.ok) {
        showMessage("User payment/membership updated successfully!");
        fetchUsers();
      } else {
        showMessage("Failed to update user membership", "error");
      }
    } catch (e) {
      showMessage("Connection error", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateVerification = async (profileId: string, isVerified: boolean) => {
    setActionLoadingId(profileId);
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}/update-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified })
      });
      if (res.ok) {
        showMessage(isVerified ? "Profile is now Verified!" : "Profile verification removed.");
        fetchProfiles();
      } else {
        showMessage("Failed to update verification", "error");
      }
    } catch (e) {
      showMessage("Connection error", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!window.confirm("Are you sure you want to delete this profile?")) return;
    setActionLoadingId(profileId);
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}/delete`, {
        method: "POST"
      });
      if (res.ok) {
        showMessage("Profile deleted successfully.");
        fetchProfiles();
      } else {
        showMessage("Failed to delete profile", "error");
      }
    } catch (e) {
      showMessage("Connection error", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-database", { method: "POST" });
      if (res.ok) {
        showMessage("Database successfully reset to initial states!");
        await Promise.all([fetchUsers(), fetchProfiles()]);
      } else {
        showMessage("Failed to reset database", "error");
      }
    } catch (e) {
      showMessage("Error resetting database", "error");
    } finally {
      setLoading(false);
      setShowResetConfirm(false);
      setConfirmInput("");
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        district: formData.district,
        sect: formData.sect,
        education: formData.education,
        educationDetails: formData.educationDetails,
        occupation: formData.occupation,
        incomeRange: formData.incomeRange,
        aboutMe: formData.aboutMe,
        religiousPractice: formData.religiousPractice,
        phone: formData.phone,
        fatherName: formData.fatherName,
        fatherOccupation: formData.fatherOccupation,
        motherName: formData.motherName,
        motherOccupation: formData.motherOccupation,
        familyStatus: formData.familyStatus,
        familyValues: formData.familyValues,
        siblingsDetails: formData.siblingsDetails,
        nativePlace: formData.nativePlace,
        photos: formData.photoUrl ? [formData.photoUrl] : [],
        userType: formData.userType,
        maritalStatus: formData.maritalStatus,
        profileFor: formData.profileFor,
        address: formData.address
      };

      const res = await fetch("/api/admin/profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showMessage(`Matrimonial profile for ${formData.fullName} created successfully!`);
        // Reset fields
        setFormData(prev => ({
          ...prev,
          fullName: "",
          email: "",
          password: "",
          phone: "+91 " + Math.floor(9000000000 + Math.random() * 999999999),
          photoUrl: ""
        }));
        fetchProfiles();
        fetchUsers();
        setActiveTab("profiles");
      } else {
        showMessage("Failed to create profile", "error");
      }
    } catch (err) {
      showMessage("Error creating profile", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter lists
  const filteredUsers = users.filter(u => {
    // Search query filter
    const matchesSearch = u.fullName.toLowerCase().includes(userQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      (u.paymentProofStatus || "").toLowerCase().includes(userQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Payment filter
    if (paymentFilter === "pending") {
      return u.paymentProofStatus === "pending";
    }
    if (paymentFilter === "approved") {
      return u.isPaid || u.paymentProofStatus === "approved";
    }
    if (paymentFilter === "rejected") {
      return u.paymentProofStatus === "rejected";
    }
    if (paymentFilter === "promotional") {
      return u.userType === "promotional";
    }
    if (paymentFilter === "free") {
      return !u.isPaid && u.userType !== "promotional" && (!u.paymentProofStatus || u.paymentProofStatus === "none");
    }

    return true;
  });

  const filteredProfiles = profiles.filter(p => {
    // Exclude system admin profiles
    const linkedUser = users.find(u => u.profileId === p.id);
    if (linkedUser?.isAdmin || p.id === "prof_admin_seeded" || p.fullName.toLowerCase().includes("administrator") || p.fullName.toLowerCase().includes("admin")) {
      return false;
    }

    // Search query filter
    const matchesSearch = p.fullName.toLowerCase().includes(profileQuery.toLowerCase()) || 
      p.occupation.toLowerCase().includes(profileQuery.toLowerCase()) || 
      p.district.toLowerCase().includes(profileQuery.toLowerCase()) || 
      p.sect.toLowerCase().includes(profileQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Verification filter
    if (verificationFilter === "verified") {
      return p.isVerified;
    }
    if (verificationFilter === "unverified") {
      return !p.isVerified;
    }

    return true;
  });

  if (!currentUser?.isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-gray-150 rounded-3xl shadow-xl text-center space-y-6" id="admin_access_denied">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-150">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            You do not have administrative privileges. This area is reserved strictly for authenticated administrator accounts.
          </p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin_panel_root">
      
      {/* Toast Alert */}
      {message && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-bounce ${
            message.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          {message.text}
        </div>
      )}

      {/* Header section */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-emerald-950">KalyanHub Administrator Panel</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Secure admin sandbox environment. Manage premium user accounts, approve payments, verify candidates, or re-seed original state.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              setShowResetConfirm(true);
              setConfirmInput("");
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-200 text-gray-600 hover:text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Reset sandbox state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Reset Database Seed
          </button>
          
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            Back to Application
          </button>
        </div>
      </div>

      {/* Quick stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Total Users</p>
          <p className="text-2xl font-serif font-bold text-emerald-950 mt-1">{users.length}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Total Profiles</p>
          <p className="text-2xl font-serif font-bold text-emerald-950 mt-1">{profiles.length}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Premium Members</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {users.filter(u => u.isPaid).length}
          </p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Pending Approvals</p>
          <p className="text-2xl font-serif font-bold text-indigo-700 mt-1 animate-pulse">
            {users.filter(u => u.paymentProofStatus === "pending").length}
          </p>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/10 rounded-2xl p-4 shadow-3xs">
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800">Inactive (&gt;14d)</p>
          <p className="text-2xl font-serif font-bold text-amber-900 mt-1">
            {profiles.filter(p => !p.lastLoginAt || new Date(p.lastLoginAt).getTime() < (Date.now() - 14 * 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
      </div>

      {/* System Configurations & Feature Flags */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm mb-6" id="admin_system_configs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-3.5 flex items-center gap-1.5">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-800" />
          Live System Configurations & Feature Flags
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Real OTP Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl" id="config_otp_delivery">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                Enable Real OTP Delivery (Brevo / SMTP)
                {realOtpEnabled ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                    Active (Brevo live)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-150 text-gray-600 text-[9px] font-bold rounded">
                    Sandbox Code 2026
                  </span>
                )}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {realOtpEnabled 
                  ? "Verifications are sent live to emails using Brevo SMTP relay. Ensure Brevo credentials are set." 
                  : "Bypasses real email delivery. Newly registering or resetting users verify instantly with code '2026'."}
              </p>
            </div>
            <button
              onClick={handleToggleOtp}
              className={`ml-4 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                realOtpEnabled 
                  ? "bg-emerald-900 border-emerald-900 text-white hover:bg-emerald-800 shadow-sm" 
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              id="btn_toggle_real_otp"
            >
              {realOtpEnabled ? "Disable" : "Enable"}
            </button>
          </div>

          {/* Promotional Access Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl" id="config_promo_tier">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                Disable Promotional Auto-Premium
                {promoDisabled ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                    Auto-Premium Stopped
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                    Auto-Premium Enabled
                  </span>
                )}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {promoDisabled 
                  ? "Newly registered users default to Free Tier and must upgrade via payment verification." 
                  : "Newly registered users with 'Promotional' userType get instant Auto-Premium."}
              </p>
            </div>
            <button
              onClick={handleTogglePromo}
              className={`ml-4 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                promoDisabled 
                  ? "bg-amber-700 border-amber-700 text-white hover:bg-amber-600 shadow-sm" 
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              id="btn_toggle_promo_access"
            >
              {promoDisabled ? "Enable Auto-Premium" : "Stop Auto-Premium"}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Architectural Explanation Box */}
      <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4.5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-2.5">
            <Info className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif text-sm font-bold text-emerald-950">
                Understanding Users, Payments, & Matrimony Profiles
              </h4>
              <p className="text-gray-600 text-xs mt-1 font-sans">
                A quick architectural guide clarifying how candidate accounts, subscription tiers, and public profiles connect.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowArchitectureInfo(!showArchitectureInfo)}
            className="text-xs font-bold text-emerald-900 hover:text-emerald-950 underline cursor-pointer shrink-0"
          >
            {showArchitectureInfo ? "Collapse Guide" : "Read Connection Guide"}
          </button>
        </div>

        {showArchitectureInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 pt-4 border-t border-emerald-100/40 font-sans text-xs text-gray-600">
            <div className="space-y-1.5">
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] block">1. User Accounts (Credentials)</span>
              <p>
                Represents the **login identity** of a candidate or relative (Email & Password). This layer stores authentication status, active sessions, and active subscription preferences.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] block">2. Payments (Access Control)</span>
              <p>
                Governs the **user subscription tier**. When a user upgrades or uploads a bank receipt proof, their account status is updated. This controls platform permissions, such as unlocking contact numbers and messaging limits.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] block">3. Matrimony Profiles (The Bio)</span>
              <p>
                Represents the **public matrimonial biography** details (e.g., age, height, district, sect, job, family bio). Each matrimony profile maps to exactly **one** login user account using a secure reference ID (`profileId`), ensuring a unified connection.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "users" 
                ? "text-emerald-900 border-emerald-900" 
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Users & Payments
              {users.filter(u => u.paymentProofStatus === "pending").length > 0 && (
                <span className="bg-indigo-600 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {users.filter(u => u.paymentProofStatus === "pending").length}
                </span>
              )}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("profiles")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "profiles" 
                ? "text-emerald-900 border-emerald-900" 
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Matrimony Profiles
            </span>
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "create" 
                ? "text-emerald-900 border-emerald-900" 
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Create Profile
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER ACCOUNTS & PAYMENTS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Search & Filter bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, payment..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-emerald-800"
              />
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mr-1">Payment Status:</span>
              <button
                type="button"
                onClick={() => setPaymentFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  paymentFilter === "all"
                    ? "bg-emerald-900 text-white"
                    : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("pending")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer relative ${
                  paymentFilter === "pending"
                    ? "bg-indigo-600 text-white"
                    : "bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200"
                }`}
              >
                Pending Approval ({users.filter(u => u.paymentProofStatus === "pending").length})
                {users.filter(u => u.paymentProofStatus === "pending").length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("approved")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  paymentFilter === "approved"
                    ? "bg-amber-600 text-white"
                    : "bg-white hover:bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                Premium Active ({users.filter(u => u.isPaid || u.paymentProofStatus === "approved").length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("rejected")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  paymentFilter === "rejected"
                    ? "bg-rose-600 text-white"
                    : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                Rejected ({users.filter(u => u.paymentProofStatus === "rejected").length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("promotional")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  paymentFilter === "promotional"
                    ? "bg-purple-600 text-white"
                    : "bg-white hover:bg-purple-50 text-purple-800 border border-purple-200"
                }`}
              >
                Promo Premium ({users.filter(u => u.userType === "promotional").length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("free")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  paymentFilter === "free"
                    ? "bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                Free / No Proof ({users.filter(u => !u.isPaid && u.userType !== "promotional" && (!u.paymentProofStatus || u.paymentProofStatus === "none")).length})
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-gray-150">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Contact & Location</th>
                    <th className="p-4">Premium Status</th>
                    <th className="p-4">Payment Proof Info</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs text-gray-600 font-sans">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        No user accounts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isPending = user.paymentProofStatus === "pending";
                      const isApproved = user.paymentProofStatus === "approved";
                      const isRejected = user.paymentProofStatus === "rejected";
                      const matchingProfile = profiles.find(p => p.id === user.profileId);

                      return (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-800 text-sm">{user.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {user.id}</p>
                            
                            {matchingProfile ? (
                              <div className="mt-1.5 flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-medium">
                                  <Link2 className="w-3 h-3 text-emerald-600" />
                                  Bio Profile: {matchingProfile.fullName} ({formatProfileCode(matchingProfile)})
                                </span>
                              </div>
                            ) : (
                              <div className="mt-1.5 flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded text-[9px] font-medium">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  No Bio Profile Linked!
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-[11px] space-y-1 text-gray-700">
                            <p className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold w-12 shrink-0 uppercase tracking-widest text-[9px]">Email:</span>
                              <span className="text-emerald-950 font-semibold">{user.email}</span>
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold w-12 shrink-0 uppercase tracking-widest text-[9px]">Phone:</span>
                              <span>{matchingProfile?.phone || <span className="italic text-gray-400 text-[10px]">No profile linked</span>}</span>
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold w-12 shrink-0 uppercase tracking-widest text-[9px]">Place:</span>
                              <span className="truncate max-w-[200px]" title={matchingProfile?.family?.nativePlace || matchingProfile?.nativePlace}>
                                {matchingProfile?.family?.nativePlace || matchingProfile?.nativePlace || <span className="italic text-gray-400 text-[10px]">No profile linked</span>}
                              </span>
                            </p>
                          </td>
                          <td className="p-4">
                            {user.isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                                Admin Account
                              </span>
                            ) : user.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                                <Award className="w-3 h-3 text-amber-500 fill-amber-500/20" /> Paid Premium
                              </span>
                            ) : user.userType === "promotional" ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[10px] font-bold ${
                                !promoDisabled 
                                  ? "bg-purple-50 text-purple-800 border-purple-200" 
                                  : "bg-gray-100 text-gray-400 border-gray-200 line-through"
                              }`}>
                                <Award className={`w-3 h-3 ${!promoDisabled ? "text-purple-500 fill-purple-500/20" : "text-gray-400"}`} /> 
                                {!promoDisabled ? "Promo Premium" : "Promo (Disabled)"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded text-[10px] font-bold">
                                Free Tier
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {user.paymentProof ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="text-[11px] font-bold text-gray-700 truncate max-w-[160px]">
                                    Uploaded Slip Image
                                  </span>
                                </div>

                                {/* Thumbnail preview with click-to-expand */}
                                <div 
                                  onClick={() => setViewingProofUrl({ url: user.paymentProof!, user: user.fullName })}
                                  className="relative group w-14 h-14 border border-emerald-200/60 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-400 transition-all bg-emerald-50/20 flex items-center justify-center"
                                  title="Click to view full payment proof"
                                >
                                  {user.paymentProof.startsWith("data:") ? (
                                    <img 
                                      src={user.paymentProof} 
                                      alt="Payment proof preview" 
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span className="text-[8px] text-emerald-800 font-mono text-center p-1 font-bold">RAW STR</span>
                                  )}
                                  <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[9px] text-white font-bold uppercase tracking-wider bg-emerald-900/80 px-1.5 py-0.5 rounded text-[8px]">View</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setViewingProofUrl({ url: user.paymentProof!, user: user.fullName })}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer block text-left"
                                >
                                  View Full Attachment
                                </button>

                                <div className="flex flex-wrap gap-1">
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded text-[9px] font-bold">
                                      Pending Check
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded text-[9px] font-bold">
                                      Verified Paid
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 rounded text-[9px] font-bold">
                                      Rejected
                                    </span>
                                  )}
                                </div>

                                {user.paymentProofSubmittedAt && (
                                  <p className="text-[9px] text-gray-400">
                                    Sent: {new Date(user.paymentProofSubmittedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">No payment proof submitted yet</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {/* If they uploaded a payment proof, show fast actions */}
                              {user.paymentProof && isPending && (
                                <>
                                  <button
                                    onClick={() => handleUpdatePayment(user.id, true, "approved")}
                                    disabled={actionLoadingId === user.id}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                    title="Approve Premium"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePayment(user.id, false, "rejected")}
                                    disabled={actionLoadingId === user.id}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                    title="Reject Receipt"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Manual Upgrade/Downgrade Button */}
                              {user.isPaid ? (
                                <button
                                  onClick={() => handleUpdatePayment(user.id, false, "none")}
                                  disabled={actionLoadingId === user.id}
                                  className="px-2.5 py-1.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-700 border border-gray-200 hover:border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                >
                                  Revoke Premium
                                </button>
                              ) : (
                                <div className="flex flex-col sm:flex-row gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleUpdatePayment(user.id, true, "approved")}
                                    disabled={actionLoadingId === user.id}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 hover:border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all shrink-0"
                                  >
                                    Grant Paid Premium
                                  </button>

                                  {!user.isAdmin && (
                                    user.userType === "promotional" ? (
                                      <button
                                        onClick={() => handleUpdatePayment(user.id, false, user.paymentProofStatus || "none", "standard")}
                                        disabled={actionLoadingId === user.id}
                                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all shrink-0"
                                      >
                                        Convert to Standard
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUpdatePayment(user.id, false, user.paymentProofStatus || "none", "promotional")}
                                        disabled={actionLoadingId === user.id}
                                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all shrink-0"
                                        title="Convert to Promotional Account (grants Auto-Premium while promo is enabled)"
                                      >
                                        Convert to Promo Premium
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIMONIAL PROFILES */}
      {activeTab === "profiles" && (
        <div className="space-y-4">
          {/* Search & Filter bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search profiles by name, occupation, district..."
                value={profileQuery}
                onChange={(e) => setProfileQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-emerald-800"
              />
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mr-1">Verification Status:</span>
              <button
                type="button"
                onClick={() => setVerificationFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  verificationFilter === "all"
                    ? "bg-emerald-900 text-white"
                    : "bg-white hover:bg-gray-150 text-gray-600 border border-gray-200"
                }`}
              >
                All ({profiles.length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter("verified")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  verificationFilter === "verified"
                    ? "bg-amber-500 text-white"
                    : "bg-white hover:bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                Verified Only ({profiles.filter(p => p.isVerified).length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter("unverified")}
                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                  verificationFilter === "unverified"
                    ? "bg-amber-600 text-white"
                    : "bg-white hover:bg-gray-150 text-gray-500 border border-gray-200"
                }`}
              >
                Pending Verification ({profiles.filter(p => !p.isVerified).length})
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-gray-150">
                    <th className="p-4">Profile Info</th>
                    <th className="p-4">Demographics</th>
                    <th className="p-4">Professional Details</th>
                    <th className="p-4">Contact & Location</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs text-gray-600 font-sans">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        No matrimonial profiles found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const linkedUser = users.find(u => u.profileId === p.id);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {p.photos && p.photos.length > 0 ? (
                                <img
                                  src={p.photos[0]}
                                  alt={p.fullName}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-full object-cover border border-gray-150 shrink-0"
                                />
                              ) : (
                                <img
                                  src={getAvatarPlaceholder(p.gender, p.id)}
                                  alt={p.fullName}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-150 shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                                  {p.fullName}
                                  {p.isVerified && (
                                    <span className="w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-[8px] text-white" title="Admin Verified">✓</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {p.id}</p>
                                
                                {linkedUser ? (
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded text-[9px] font-medium">
                                      <Link2 className="w-3 h-3 text-indigo-600" />
                                      User: {linkedUser.email}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded text-[9px] font-medium">
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      No User Account!
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-gray-700">{p.gender}, {p.age} yrs</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">{p.height}cm / {p.weight}kg</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {p.district}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-gray-700 flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-emerald-600" />
                              {p.occupation}
                            </p>
                            <p className="text-gray-400 text-[10px] mt-0.5">{p.educationDetails}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                              <Building className="w-3 h-3 text-amber-500" />
                              {p.sect}
                            </div>
                          </td>
                          <td className="p-4 text-[11px] space-y-1 text-gray-700">
                            <p className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold w-12 shrink-0 uppercase tracking-widest text-[9px]">Email:</span>
                              <span className="text-emerald-950 font-semibold">{p.email || linkedUser?.email || <span className="italic text-gray-400 text-[10px]">No email specified</span>}</span>
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold w-12 shrink-0 uppercase tracking-widest text-[9px]">Phone:</span>
                              <span className="font-semibold text-emerald-950">{p.phone || <span className="italic text-gray-400 text-[10px]">No phone specified</span>}</span>
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold w-12 shrink-0 uppercase tracking-widest text-[9px]">Place:</span>
                              <span className="truncate max-w-[185px] inline-block font-sans" title={p.family?.nativePlace || p.nativePlace}>
                                {p.family?.nativePlace || p.nativePlace || <span className="italic text-gray-400 text-[10px]">No place specified</span>}
                              </span>
                            </p>
                          </td>
                          <td className="p-4">
                            {p.isVerified ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded text-[9px] font-bold">
                                  Verified Badge
                                </span>
                                {p.verifiedDate && <p className="text-[9px] text-gray-400">{p.verifiedDate}</p>}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-150 rounded text-[9px] font-bold">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Toggle Verification Button */}
                              <button
                                onClick={() => handleUpdateVerification(p.id, !p.isVerified)}
                                disabled={actionLoadingId === p.id}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                                  p.isVerified 
                                    ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100" 
                                    : "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100"
                                }`}
                              >
                                {p.isVerified ? "Remove Badge" : "Verify Profile"}
                              </button>

                              {/* Delete Profile button (only allow if it's not the default evaluation user!) */}
                              {p.id !== "prof_user_anvar" && (
                                <button
                                  onClick={() => handleDeleteProfile(p.id)}
                                  disabled={actionLoadingId === p.id}
                                  className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 hover:border-rose-200 rounded-lg cursor-pointer transition-colors"
                                  title="Delete matrimonial profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE PROFILE */}
      {activeTab === "create" && (
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-emerald-800" />
            <h3 className="font-serif text-lg font-bold text-emerald-950">Create Profile</h3>
          </div>
          <p className="text-gray-500 text-xs mb-6 font-sans">
            Register a new matrimony profile and create their login credentials. The email and password will allow the candidate to log in as a real user.
          </p>

          <form onSubmit={handleCreateProfile} className="space-y-6 font-sans text-xs">
            
            {/* Account Credentials (Mandatory) */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60 space-y-4">
              <h4 className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider">Account Login Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Login Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. candidate@example.com"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-emerald-800 font-sans"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] uppercase font-bold text-gray-500">Login Password *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                        let generated = "Kalyan_";
                        for (let i = 0; i < 6; i++) {
                          generated += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setFormData(prev => ({ ...prev, password: generated }));
                      }}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="e.g. StrongPass123"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-emerald-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g. Haseena Fathima"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as "Male" | "Female" }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                >
                  <option value="Female">Female (Bride)</option>
                  <option value="Male">Male (Groom)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Age (Years) *</label>
                <input
                  type="number"
                  required
                  min={18}
                  max={60}
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>
            </div>

            {/* Demographics & Denominations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">District / Region *</label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value as District }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                >
                  {Object.values(District).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Sect / Denomination *</label>
                <select
                  value={formData.sect}
                  onChange={(e) => setFormData(prev => ({ ...prev, sect: e.target.value as Sect }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                >
                  {Object.values(Sect).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Height (cm) *</label>
                <input
                  type="number"
                  required
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Weight (kg) *</label>
                <input
                  type="number"
                  required
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>
            </div>

            {/* Career & Academics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Education Category *</label>
                <select
                  value={formData.education}
                  onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value as EducationType }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                >
                  {Object.values(EducationType).map((edu) => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Specific Degree *</label>
                <input
                  type="text"
                  required
                  value={formData.educationDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, educationDetails: e.target.value }))}
                  placeholder="e.g. B.Tech in IT / MBA Finance"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Occupation & Income *</label>
                <input
                  type="text"
                  required
                  value={formData.occupation}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                  placeholder="e.g. Software Quality Analyst"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Income Range (Optional)</label>
                <input
                  type="text"
                  value={formData.incomeRange}
                  onChange={(e) => setFormData(prev => ({ ...prev, incomeRange: e.target.value }))}
                  placeholder="e.g. ₹5L - ₹7L per annum"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-emerald-800 mb-1.5">Account Type *</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as "standard" | "promotional" }))}
                  className="w-full p-2.5 bg-emerald-50/40 border border-emerald-150 rounded-xl focus:bg-white focus:outline-emerald-850 font-bold text-emerald-900"
                >
                  <option value="promotional">Promotional (Auto-Premium)</option>
                  <option value="standard">Standard (Free Tier)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Custom Photo URL (Unsplash/etc.)</label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="Leave empty for gender-default avatar"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>
            </div>

            {/* About & Practice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">About Me / Brief Bio *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.aboutMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, aboutMe: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Religious Observance *</label>
                <select
                  value={formData.religiousPractice}
                  onChange={(e) => setFormData(prev => ({ ...prev, religiousPractice: e.target.value as any }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-emerald-800"
                >
                  <option value="Practicing">Practicing</option>
                  <option value="Very practicing">Very practicing (Hijabi/Bearded/Sunnah-oriented)</option>
                  <option value="Moderate">Moderate (Blends custom with moderate deen)</option>
                  <option value="Liberal">Liberal</option>
                </select>
              </div>
            </div>

            {/* Family Details Segment */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
              <p className="font-serif font-bold text-emerald-950 flex items-center gap-1">
                👨‍👩‍👧‍👦 Family Background Credentials
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Father's Occupation</label>
                  <input
                    type="text"
                    value={formData.fatherOccupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, fatherOccupation: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData(prev => ({ ...prev, motherName: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Mother's Occupation</label>
                  <input
                    type="text"
                    value={formData.motherOccupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, motherOccupation: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Family Status</label>
                  <select
                    value={formData.familyStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, familyStatus: e.target.value as any }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  >
                    <option value="Middle Class">Middle Class</option>
                    <option value="Upper Middle Class">Upper Middle Class</option>
                    <option value="Affluent">Affluent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Family Values</label>
                  <select
                    value={formData.familyValues}
                    onChange={(e) => setFormData(prev => ({ ...prev, familyValues: e.target.value as any }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  >
                    <option value="Moderate">Moderate</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Orthodox">Orthodox</option>
                    <option value="Liberal">Liberal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Siblings Details</label>
                  <input
                    type="text"
                    value={formData.siblingsDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, siblingsDetails: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Native Place / Hometown</label>
                  <input
                    type="text"
                    value={formData.nativePlace}
                    onChange={(e) => setFormData(prev => ({ ...prev, nativePlace: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Profile Created For</label>
                  <select
                    value={formData.profileFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, profileFor: e.target.value as any }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
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
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Marital Status</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, maritalStatus: e.target.value as any }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="Never Married">Never Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Awaiting Divorce">Awaiting Divorce</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">Confidential Contact Address (hides from non-premium)</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                    placeholder="Provide full contact address"
                  />
                </div>
              </div>
            </div>

            {/* Action panel */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab("profiles")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#034435] hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4 text-gold-400" />
                Add & Publish Profile
              </button>
            </div>

          </form>
        </div>
      )}

      {/* CUSTOM DATABASE RESET CONFIRMATION DIALOG MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-white border border-gray-150 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-amber-500/10 border-b border-amber-200 p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
                <AlertTriangle className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-gray-900">Confirm Database Reset</h3>
                <p className="text-[11px] text-amber-800 mt-0.5">Destructive Sandbox Operation</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 font-sans text-xs text-gray-600 leading-relaxed">
              <p>
                You are about to re-seed the Firestore database. This action is irreversible and will perform the following:
              </p>
              
              <ul className="space-y-1.5 list-disc pl-5 text-gray-500 font-medium">
                <li>Delete all custom matrimony profiles created.</li>
                <li>Remove any newly registered user accounts.</li>
                <li>Reset active messaging logs and chat threads.</li>
                <li>Clear payment proof states and approve queues.</li>
                <li>Re-import original sample candidates (Mohammed Anvar, etc.).</li>
              </ul>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 text-gray-500 font-mono text-[10px]">
                Active DB: <span className="font-bold text-gray-700">ai-studio-kalyanhub</span>
              </div>

              {/* Safety verification input */}
              <div className="space-y-2 mt-4 pt-3 border-t border-gray-100">
                <label className="block font-bold text-gray-700 text-[10px] uppercase tracking-wider">
                  Type <span className="text-amber-700 select-none font-mono font-black">RESET</span> to confirm *
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Type RESET in all caps"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-amber-600 font-mono text-center text-sm uppercase font-bold text-gray-800 bg-white"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setConfirmInput("");
                }}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={confirmInput !== "RESET" || loading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Lightbox Modal */}
      {viewingProofUrl && (
        <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white animate-fadeIn">
          <div className="bg-emerald-950/95 border border-emerald-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900 bg-emerald-950">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Payment Proof Attachment</h3>
                <p className="text-[10px] text-emerald-400 font-mono">User: {viewingProofUrl.user}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProofUrl(null)}
                className="w-8 h-8 rounded-full bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-700/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="p-6 overflow-auto flex items-center justify-center bg-emerald-950/40 min-h-[300px] max-h-[60vh]">
              {viewingProofUrl.url.startsWith("data:") ? (
                <img
                  src={viewingProofUrl.url}
                  alt={`Payment proof for ${viewingProofUrl.user}`}
                  className="max-w-full max-h-full object-contain rounded-lg border border-emerald-900/50 shadow"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                  <p className="text-xs font-semibold text-gray-300">Non-image file type or raw string</p>
                  <pre className="p-3 bg-emerald-950/80 border border-emerald-900/60 rounded-xl font-mono text-[10px] text-emerald-400 select-all overflow-x-auto max-w-lg">
                    {viewingProofUrl.url}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-emerald-950 border-t border-emerald-900 flex items-center justify-between">
              <span className="text-[10px] text-emerald-500/70 font-mono">Format: Base64 Source</span>
              <div className="flex gap-3">
                {viewingProofUrl.url.startsWith("data:") && (
                  <a
                    href={viewingProofUrl.url}
                    download={`payment_proof_${viewingProofUrl.user.toLowerCase().replace(/\s+/g, "_")}.png`}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-102 flex items-center gap-1.5"
                  >
                    Download File
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingProofUrl(null)}
                  className="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
