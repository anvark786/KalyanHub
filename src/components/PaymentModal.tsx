import React, { useState } from "react";
import { X, CheckCircle, Upload, Shield, QrCode, Copy, Send, HelpCircle, Sparkles, Check } from "lucide-react";
import { motion } from "motion/react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onPaymentSuccess: (updatedUser: any) => void;
}

export default function PaymentModal({ isOpen, onClose, user, onPaymentSuccess }: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(user?.paymentProofStatus === "pending");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const upiId = "malabarnikah@ybl";
  const upiNumber = "+91 9000000000";

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      // Simulate file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await fetch("/api/user/upload-payment-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentProof: base64String })
        });

        if (response.ok) {
          const data = await response.json();
          onPaymentSuccess(data.user);
          setProofSubmitted(true);
        }
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      console.error(e);
      setUploading(false);
    }
  };

  const handleSimulateApproval = async () => {
    try {
      const response = await fetch("/api/user/simulate-payment-approval", {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        onPaymentSuccess(data.user);
        setProofSubmitted(false);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // WhatsApp notification link
  const waMessage = encodeURIComponent("Assalamu Alaikum. I have just completed the payment of ₹999 for KalyanHub Premium Club. My registered email is: " + user?.email + ". Please approve my membership.");
  const waLink = `https://wa.me/919496538664?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="payment_modal_overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-150 grid grid-cols-1 md:grid-cols-12 max-h-[90vh]"
        id="payment_modal_content"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-emerald-950 transition-colors border border-gray-200 shadow-sm cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Half: Aesthetic Promo Sidebar */}
        <div className="md:col-span-5 bg-[#034435] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient SVG pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-white">
              <path d="M50 0 L100 50 L50 100 L0 50 Z" />
            </svg>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-300/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Premium Club</span>
            </div>
            
            <h3 className="font-serif text-2xl font-bold leading-tight">Unlock Infinite Matrimonial Connections</h3>
            <p className="text-xs text-gray-200/90 leading-relaxed">
              Become a verified premium member to reach out to potential lifepartners directly.
            </p>

            <ul className="space-y-3.5 pt-4 text-xs">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Unlimited contact phone number reveals</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Initiate chat threads with any matched partner</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Send direct photo access request options</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Dedicated support with family verification</span>
              </li>
            </ul>
          </div>

          <div className="pt-8 border-t border-white/10 relative z-10">
            <div className="text-xs text-emerald-100">Premium Lifetime Plan</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">₹999 <span className="text-xs text-emerald-200 font-normal">/ lifetime</span></div>
            <div className="text-[10px] text-emerald-200 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" /> Secure SSL Matrimonial Network
            </div>
          </div>
        </div>

        {/* Right Half: Interactive Payment Actions */}
        <div className="md:col-span-7 p-6 sm:p-8 overflow-y-auto max-h-[90vh] space-y-6">
          <h4 className="font-serif text-xl font-bold text-emerald-950">Complete Your Payment</h4>

          {proofSubmitted || user?.paymentProofStatus === "pending" ? (
            /* STATE: Proof Pending approval */
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200 text-amber-500 animate-pulse">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-emerald-950 text-base">Payment Verification Pending</h5>
                <p className="text-xs text-gray-500 leading-relaxed px-2">
                  Thank you! Your payment proof has been submitted successfully. Our team will verify and activate your premium membership within 1-2 hours.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-900/5 text-left space-y-3.5">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block">Want faster approval?</span>
                <p className="text-xs text-gray-600">Send us a message directly via WhatsApp with your email ID for instant setup!</p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Send className="w-3.5 h-3.5 fill-current" /> Contact on WhatsApp
                </a>
              </div>


            </div>
          ) : (
            /* STATE: QR and payment details */
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#faf8f5] p-4 rounded-2xl border border-gray-150">
                <div className="sm:col-span-5 flex justify-center">
                  {/* Clean SVG Mock UPI QR Code */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-3xs text-center space-y-1.5">
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-emerald-950 mx-auto">
                      {/* Corners */}
                      <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                      <rect x="7" y="7" width="16" height="16" fill="white" />
                      <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                      
                      <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                      <rect x="77" y="7" width="16" height="16" fill="white" />
                      <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                      <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                      <rect x="7" y="77" width="16" height="16" fill="white" />
                      <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                      {/* Random pixel noise */}
                      <rect x="35" y="10" width="10" height="10" fill="currentColor" />
                      <rect x="50" y="15" width="10" height="5" fill="currentColor" />
                      <rect x="60" y="5" width="5" height="15" fill="currentColor" />
                      
                      <rect x="30" y="35" width="15" height="15" fill="currentColor" />
                      <rect x="50" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="15" y="45" width="10" height="10" fill="currentColor" />

                      <rect x="45" y="70" width="20" height="15" fill="currentColor" />
                      <rect x="70" y="45" width="10" height="20" fill="currentColor" />
                      <rect x="80" y="75" width="10" height="10" fill="currentColor" />
                    </svg>
                    <span className="text-[8px] font-extrabold tracking-wider uppercase text-emerald-900 block">Scan to Pay</span>
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">UPI Credentials</div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400">UPI Address ID</span>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-250 font-mono font-bold text-emerald-950">
                      <span>{upiId}</span>
                      <button onClick={handleCopy} className="text-emerald-800 hover:text-emerald-950 transition-colors p-0.5">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400">Google Pay / PhonePe</span>
                    <div className="font-semibold text-emerald-950">{upiNumber}</div>
                  </div>
                </div>
              </div>

              {/* Step 2: Inform or upload */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Step 2: Submit Verification</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-all shadow-3xs"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" /> Inform via WhatsApp
                  </a>

                  <button
                    onClick={() => {
                      // Trigger click on file input
                      document.getElementById("payment_file_input")?.click();
                    }}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-gray-500" /> Direct Proof Upload
                  </button>
                </div>

                <input
                  id="payment_file_input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-amber-600" />
                      <div className="text-xs">
                        <div className="font-bold text-gray-800 truncate max-w-[180px]">{selectedFile.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>

                    <button
                      onClick={handleUploadProof}
                      disabled={uploading}
                      className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Submit File"}
                    </button>
                  </div>
                )}
              </div>


            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
