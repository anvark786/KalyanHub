/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { District, Sect, EducationType } from "../types";
import { X, Lock, Mail, User, Shield, Briefcase, Calendar, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "login" | "signup";
  onSuccess: (data: { user: any; profile: any }) => void;
}

export default function AuthModal({ isOpen, onClose, initialMode, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("165");
  const [district, setDistrict] = useState<District>(District.Malappuram);
  const [sect, setSect] = useState<Sect>(Sect.Sunni_EK);
  const [education, setEducation] = useState<EducationType>(EducationType.Graduate);
  const [occupation, setOccupation] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<"Never Married" | "Divorced" | "Widowed" | "Awaiting Divorce" | "Separated">("Never Married");
  const [profileFor, setProfileFor] = useState<"Self" | "Son" | "Daughter" | "Brother" | "Sister" | "Parent" | "Relative" | "Friend">("Self");
  const [address, setAddress] = useState("");

  // Family & Self Details states for signup
  const [fatherName, setFatherName] = useState("");
  const [fatherStatus, setFatherStatus] = useState<"Alive" | "Passed Away">("Alive");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [siblingsDetails, setSiblingsDetails] = useState("");
  const [aboutMe, setAboutMe] = useState("");

  // Account Finder / Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSearching, setForgotSearching] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Password Reset states
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDevCode, setResetDevCode] = useState<string | null>(null);

  // Register OTP flow states
  const [registerOtpPending, setRegisterOtpPending] = useState(false);
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerDevCode, setRegisterDevCode] = useState<string | null>(null);

  // Reset form states on open or mode toggle to avoid leaking previous state
  React.useEffect(() => {
    setError(null);
    setForgotError(null);
    setResetError(null);
    setResetSuccessMessage(null);
    
    // Reset specific input states
    setEmail("");
    setPassword("");
    setPhone("");
    setFullName("");
    setGender("Female");
    setAge("25");
    setHeight("165");
    setDistrict(District.Malappuram);
    setSect(Sect.Sunni_EK);
    setEducation(EducationType.Graduate);
    setOccupation("");
    setMaritalStatus("Never Married");
    setProfileFor("Self");
    setAddress("");
    
    setFatherName("");
    setFatherStatus("Alive");
    setFatherOccupation("");
    setMotherName("");
    setMotherOccupation("");
    setSiblingsDetails("");
    setAboutMe("");

    setForgotEmail("");
    setForgotSearching(false);

    setResettingEmail(null);
    setResetOtp("");
    setResetNewPassword("");
    setResetDevCode(null);

    setRegisterOtpPending(false);
    setRegisterOtp("");
    setRegisterDevCode(null);
  }, [isOpen, mode]);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSearching(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate password reset.");
      }

      setResettingEmail(data.email);
      setResetOtp("");
      setResetNewPassword("");
      setResetError(null);
      setResetSuccessMessage(null);
      setResetDevCode(data.devCode || null);
    } catch (err: any) {
      setForgotError(err.message || "Failed to find account.");
    } finally {
      setForgotSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address (e.g. user@example.com).");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup" && !registerOtpPending) {
        // Step 1: Send registration OTP
        const response = await fetch("/api/auth/send-register-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to send registration verification code.");
        }

        setRegisterOtpPending(true);
        setRegisterOtp("");
        setRegisterDevCode(data.devCode || null);
        setLoading(false);
        return;
      }

      // Step 2: Final submit (Login or Register Verification)
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" 
        ? { email, password } 
        : { 
            email, 
            password, 
            phone, 
            fullName, 
            gender, 
            age, 
            height, 
            district, 
            sect, 
            education, 
            occupation,
            fatherName,
            fatherStatus,
            fatherOccupation,
            motherName,
            motherOccupation,
            siblingsDetails,
            aboutMe,
            maritalStatus,
            profileFor,
            address,
            otpCode: registerOtp
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMessage(null);
    setResetLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resettingEmail,
          otpCode: resetOtp,
          newPassword: resetNewPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setResetSuccessMessage("Password reset successfully! Redirecting you to sign in...");
      setEmail(resettingEmail || "");
      setPassword(resetNewPassword);
      setTimeout(() => {
        setResettingEmail(null);
        setResetOtp("");
        setResetNewPassword("");
        setMode("login");
        setResetSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AnimatePresence id="auth_modal_container">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-850 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-white bg-emerald-800/40 hover:bg-emerald-700/60 p-1.5 rounded-full transition-colors cursor-pointer border border-emerald-500/20"
            >
              <X className="w-5 h-5" />
            </button>
             <h3 className="font-serif text-2xl font-bold text-center">
              {mode === "login" ? "Sign In to KalyanHub" : mode === "signup" ? "Create Matrimony Profile" : "Reset Password"}
            </h3>
            <p className="text-xs text-center text-emerald-100 mt-1">
              {mode === "login" 
                ? "Access verified profiles and continue your search" 
                : mode === "signup"
                  ? "Fill out your details to begin your matching journey"
                  : "Enter your registered email to reset your security password"}
            </p>
          </div>

          {/* Form Area - Scrollable */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {mode === "forgot" ? (
              <div className="space-y-6">
                {resettingEmail ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-900/10">
                      <h4 className="font-serif text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-800" />
                        Security Password Reset
                      </h4>
                      <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                        A secure 4-digit verification code has been sent to your registered email address <span className="font-bold text-emerald-900">{resettingEmail}</span>.
                      </p>
                    </div>

                    {resetError && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                        {resetError}
                      </div>
                    )}

                    {resetSuccessMessage && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 font-medium">
                        {resetSuccessMessage}
                      </div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Enter 4-Digit Verification OTP
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          placeholder="e.g. 2026"
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-center font-mono font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Set New Access Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Min 6 characters"
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {resetDevCode && (
                        <div className="p-3 bg-amber-50 text-amber-900 text-[11px] rounded-lg border border-amber-200 space-y-1">
                          <div className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                            Evaluation Sandbox Helper
                          </div>
                          <div>
                            Since no SMTP settings are configured in `.env` yet, your generated OTP code is: <span className="font-mono font-bold text-sm bg-amber-100 px-1.5 py-0.5 rounded text-amber-950">{resetDevCode}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setResettingEmail(null)}
                          className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-2xs uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={resetLoading}
                          className="w-2/3 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-2xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {resetLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Verify & Reset"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {forgotError && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                        {forgotError}
                      </div>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            required
                            placeholder="e.g. user@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotSearching}
                        className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-medium transition-colors shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
                      >
                        {forgotSearching ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Send Reset Code"
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : registerOtpPending ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-800 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Verify Your Email</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    We sent a secure 4-digit verification OTP to <strong className="text-gray-700">{email}</strong>. Please enter the code below to complete your registration.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 text-center">
                    Enter 4-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="e.g. 1234"
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-40 mx-auto block text-center text-2xl font-bold tracking-[8px] py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                  />
                </div>

                {registerDevCode && (
                  <div className="p-3.5 bg-amber-50 text-amber-900 text-[11px] rounded-lg border border-amber-200 space-y-1">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                      Evaluation Sandbox Helper
                    </div>
                    <div>
                      Since no SMTP settings are configured in `.env` yet, your generated OTP code is: <span className="font-mono font-bold text-sm bg-amber-100 px-1.5 py-0.5 rounded text-amber-950">{registerDevCode}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-medium transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Confirm & Create Profile"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegisterOtpPending(false);
                      setRegisterOtp("");
                      setRegisterDevCode(null);
                      setError(null);
                    }}
                    className="w-full text-center text-xs text-gray-500 hover:text-emerald-900 font-medium py-1 cursor-pointer"
                  >
                    ← Go Back / Edit Registration Details
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ALWAYS SHOW EMAIL */}
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                    />
                  </div>
                  {mode === "login" && (
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setError(null);
                        }}
                        className="text-[10px] text-emerald-900 font-bold hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                </div>

                {/* ALWAYS SHOW PASSWORD */}
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Security Password {mode === "signup" && <span className="text-[10px] text-gray-400 font-normal">(Min 6 chars)</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder={mode === "signup" ? "Create a login password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* REGISTER ONLY FIELDS */}
                {mode === "signup" && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {/* Full name */}
                    <div>
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required={mode === "signup"}
                          placeholder="e.g. Mohammed Anas"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                        Mobile Number (For verification & recovery)
                      </label>
                      <div className="relative font-mono">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold shrink-0">📱</span>
                        <input
                          type="tel"
                          required={mode === "signup"}
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Gender selection */}
                    <div>
                      <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                        Profile Gender
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGender("Female")}
                          className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            gender === "Female"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-900"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          Female (Bride)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("Male")}
                          className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            gender === "Male"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-900"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          Male (Groom)
                        </button>
                      </div>
                    </div>

                    {/* Profile For & Marital Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Profile For
                        </label>
                        <select
                          value={profileFor}
                          onChange={(e: any) => setProfileFor(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
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
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Marital Status
                        </label>
                        <select
                          value={maritalStatus}
                          onChange={(e: any) => setMaritalStatus(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                        >
                          <option value="Never Married">Never Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Awaiting Divorce">Awaiting Divorce</option>
                          <option value="Separated">Separated</option>
                        </select>
                      </div>
                    </div>

                    {/* Age & Height */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Age (Years)
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            required={mode === "signup"}
                            min="18"
                            max="70"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Height (cm)
                        </label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            required={mode === "signup"}
                            min="100"
                            max="250"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* District & Sect */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          District (Kerala / NRI)
                        </label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value as District)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                        >
                          {Object.values(District).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Sect / Denomination
                        </label>
                        <select
                          value={sect}
                          onChange={(e) => setSect(e.target.value as Sect)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                        >
                          {Object.values(Sect).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Education & Occupation */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Education Category
                        </label>
                        <select
                          value={education}
                          onChange={(e) => setEducation(e.target.value as EducationType)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                        >
                          {Object.values(EducationType).map((edu) => (
                            <option key={edu} value={edu}>
                              {edu}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                          Occupation / Job
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            required={mode === "signup"}
                            placeholder="e.g. Software Engineer"
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Family & Self Details Header */}
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-2xs font-bold uppercase tracking-wider text-emerald-950 mb-3 flex items-center gap-1">
                        👨‍👩‍👧‍👦 Family & Self Details (Optional)
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Father details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Father's Status</label>
                            <select
                              value={fatherStatus}
                              onChange={(e) => setFatherStatus(e.target.value as "Alive" | "Passed Away")}
                              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                            >
                              <option value="Alive">Alive</option>
                              <option value="Passed Away">Passed Away</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Father's Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Ibrahim Haji"
                              value={fatherName}
                              onChange={(e) => setFatherName(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                            />
                          </div>
                          {fatherStatus === "Alive" && (
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Father's Occupation</label>
                              <input
                                type="text"
                                placeholder="e.g. Business Owner"
                                value={fatherOccupation}
                                onChange={(e) => setFatherOccupation(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                              />
                            </div>
                          )}
                        </div>

                        {/* Mother details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Mother's Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Amina"
                              value={motherName}
                              onChange={(e) => setMotherName(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Mother's Occupation</label>
                            <input
                              type="text"
                              placeholder="e.g. Homemaker"
                              value={motherOccupation}
                              onChange={(e) => setMotherOccupation(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                            />
                          </div>
                        </div>

                        {/* Siblings & About me */}
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Siblings Details</label>
                          <input
                            type="text"
                            placeholder="e.g. One elder brother (married), one younger sister"
                            value={siblingsDetails}
                            onChange={(e) => setSiblingsDetails(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">Introduce Yourself (About Me)</label>
                          <textarea
                            placeholder="Tell potential matches about your character, religious values, and partner expectations..."
                            value={aboutMe}
                            onChange={(e) => setAboutMe(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">
                            Confidential Contact Address <span className="text-amber-600 font-normal">(Hidden from non-premium/non-promo users)</span>
                          </label>
                          <textarea
                            placeholder="e.g. Baitul Noor, Hill Palace Road, Ernakulam"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-medium transition-colors shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : mode === "login" ? (
                    "Log In Privately"
                  ) : (
                    "Create & Submit Profile"
                  )}
                </button>
              </form>
            )}

            {/* Verification Badge Quote */}
            {mode === "signup" && (
              <div className="flex gap-2.5 items-start p-3 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg text-[11px]">
                <Shield className="w-4 h-4 text-gold-600 shrink-0 mt-0.5 animate-pulse" />
                <span>
                  <strong>Standard Verification:</strong> Every profile on KalyanHub is vetted by our administrators within 24 hours. A gold verification badge will be displayed on your profile.
                </span>
              </div>
            )}

            {/* Mode switch */}
            <div className="text-center text-xs text-gray-500 pt-2">
              {mode === "login" ? (
                <>
                  Don&apos;t have a matrimony profile?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="text-emerald-900 font-semibold hover:underline cursor-pointer"
                  >
                    Register free profile
                  </button>
                </>
              ) : mode === "signup" ? (
                <>
                  Already registered with us?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-emerald-900 font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Want to try signing in instead?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-emerald-900 font-semibold hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
