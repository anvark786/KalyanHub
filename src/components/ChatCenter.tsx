/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Profile, Message, ChatThread } from "../types";
import { Send, RefreshCw, ShieldAlert, ArrowLeft, Check, CheckCheck, HelpCircle, Sparkles } from "lucide-react";
import { getAvatarPlaceholder } from "../utils/avatar";
import { motion } from "motion/react";

interface ChatCenterProps {
  currentUserProfile: Profile | null;
  activeChatPartner: Profile | null;
  onBackToDashboard: () => void;
  onSelectPartner: (partner: Profile) => void;
  onTriggerPaymentPortal?: () => void;
}

export default function ChatCenter({
  currentUserProfile,
  activeChatPartner,
  onBackToDashboard,
  onSelectPartner,
  onTriggerPaymentPortal
}: ChatCenterProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Clear chat error on partner switch
  useEffect(() => {
    setChatError(null);
  }, [activeChatPartner]);

  // 1. Fetch Chat Threads
  const fetchThreads = async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (e) {
      console.error("Error fetching threads", e);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  // 2. Fetch Messages for Active Partner
  const fetchMessages = async (partnerId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Error fetching messages", e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial Thread load
  useEffect(() => {
    fetchThreads();
  }, [activeChatPartner]);

  // Load messages whenever active partner changes or periodically
  useEffect(() => {
    if (activeChatPartner) {
      fetchMessages(activeChatPartner.id);
    }
  }, [activeChatPartner]);

  // Polling loop to simulate real-time updates over HTTP (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads(true);
      if (activeChatPartner) {
        fetchMessages(activeChatPartner.id, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChatPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatPartner) return;

    setSending(true);
    const contentToSend = typedMessage;
    setTypedMessage("");

    try {
      setChatError(null);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeChatPartner.id,
          content: contentToSend
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        // Append sent message locally
        setMessages((prev) => [...prev, newMsg]);
        // Re-poll threads
        fetchThreads(true);
      } else if (response.status === 402) {
        const errData = await response.json();
        setChatError(errData.message || "Starting new conversations requires a premium upgrade.");
        if (onTriggerPaymentPortal) {
          onTriggerPaymentPortal();
        }
      } else {
        const errData = await response.json();
        setChatError(errData.error || "Failed to send message.");
      }
    } catch (e) {
      console.error("Error sending message", e);
      setChatError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSelectThread = (partner: Profile) => {
    onSelectPartner(partner);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="chat_workspace_container">
      <div className="bg-white rounded-3xl border border-gray-150 shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[75vh] min-h-[500px]">
        
        {/* Left Side: Conversation Threads */}
        <div className={`md:col-span-4 border-r border-gray-100 flex flex-col h-full bg-[#ecebe6]/50 ${activeChatPartner ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-serif text-lg font-bold text-emerald-950">In-App Letters</h3>
            <button
              onClick={() => fetchThreads()}
              disabled={loadingThreads}
              className="p-2 rounded-lg text-gray-500 hover:text-emerald-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Refresh inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loadingThreads ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
            {threads.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 text-gray-400">
                <p className="text-xs font-semibold uppercase tracking-wider">No Active Chats</p>
                <p className="text-[10px] leading-relaxed max-w-2xs mx-auto">
                  Browse matching profiles and click "Send Secure Message" to initiate respectful introductions.
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = activeChatPartner?.id === thread.otherUser.id;
                const formattedTime = thread.lastMessage 
                  ? new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "";

                return (
                  <button
                    key={thread.otherUser.id}
                    onClick={() => handleSelectThread(thread.otherUser)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                      isActive 
                        ? "bg-emerald-900 text-white border-emerald-950 shadow-sm" 
                        : "bg-white text-gray-800 border-transparent hover:bg-emerald-50/40 hover:border-gray-100"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-gray-200 border border-emerald-950/5 relative">
                      <img src={thread.otherUser.photos[0] || getAvatarPlaceholder(thread.otherUser.gender, thread.otherUser.id)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {thread.unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className={`font-serif text-xs font-bold truncate ${isActive ? "text-white" : "text-emerald-950"}`}>
                          {thread.otherUser.fullName}
                        </h4>
                        <span className={`text-[9px] shrink-0 ${isActive ? "text-emerald-200" : "text-gray-400"}`}>
                          {formattedTime}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-emerald-100" : "text-gray-500"}`}>
                        {thread.lastMessage?.content || "Tap to chat"}
                      </p>
                      <div className="flex gap-1 items-center mt-1">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-semibold uppercase tracking-wide border ${
                          isActive 
                            ? "bg-emerald-950/40 text-emerald-200 border-emerald-950/20" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-100"
                        }`}>
                          {thread.otherUser.sect}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-semibold uppercase tracking-wide border ${
                          isActive 
                            ? "bg-gold-500/20 text-gold-200 border-gold-500/10" 
                            : "bg-gold-50 text-gold-700 border-gold-100"
                        }`}>
                          {thread.otherUser.district}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Conversation View */}
        <div className={`md:col-span-8 flex flex-col h-full bg-white relative ${!activeChatPartner ? "hidden md:flex" : "flex"}`}>
          {activeChatPartner ? (
            <>
              {/* Active Header details */}
              <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-[#ecebe6]/40">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onBackToDashboard}
                    className="md:hidden p-1.5 rounded-lg text-emerald-950 hover:bg-gray-150 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative shrink-0">
                    <img src={activeChatPartner.photos[0] || getAvatarPlaceholder(activeChatPartner.gender, activeChatPartner.id)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-emerald-950 flex items-center gap-1">
                      {activeChatPartner.fullName}
                      {activeChatPartner.isVerified && <span className="text-[10px] bg-gold-100 text-gold-900 px-1 py-0.2 rounded-xs">Verified</span>}
                    </h4>
                    <span className="text-[10px] text-gray-500">
                      {activeChatPartner.age} Yrs • {activeChatPartner.education} from {activeChatPartner.district}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => fetchMessages(activeChatPartner.id)}
                  disabled={loadingMessages}
                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-950 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Check for replies"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Islamic/Kerala Modesty Alert Banner */}
              <div className="px-4 py-2 bg-emerald-50 text-emerald-900 border-b border-emerald-100 text-[10px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-gold-600 shrink-0" />
                <span>
                  <strong>Sunnah reminder:</strong> In the interest of modesty, please keep communications respectful. Keep family members or guardians updated as conversations progress.
                </span>
              </div>

              {/* Messages Viewport */}
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserProfile?.id;
                    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? "bg-emerald-900 text-white rounded-br-none shadow-xs"
                              : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-150"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400 font-semibold px-1">
                          <span>{time}</span>
                          {isMe && (
                            msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5 text-gray-300" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Error & Paywall Upgrades */}
              {chatError && (
                <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-3 animate-headShake">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                  {onTriggerPaymentPortal && (
                    <button
                      type="button"
                      onClick={onTriggerPaymentPortal}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                    >
                      Upgrade Now
                    </button>
                  )}
                </div>
              )}

              {/* Quick Assistant Simulation Tips */}
              {messages.length === 2 && (
                <div className="mx-4 p-2 bg-gold-50 border border-gold-200/50 rounded-lg text-[9px] text-gold-900 flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tip: If you send another message, our simulator will automatically respond to you after 4 seconds!</span>
                </div>
              )}

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-150 bg-white flex gap-3">
                <input
                  type="text"
                  required
                  placeholder="Write a respectful message..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className="flex-grow pl-4 pr-10 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent bg-gray-50/50"
                />
                <button
                  type="submit"
                  disabled={sending || !typedMessage.trim()}
                  className="p-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4 text-gold-200" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-900 border border-emerald-100">
                <HelpCircle className="w-7 h-7 text-gold-600 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-emerald-950">Your Private Messenger</h3>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Choose an active conversation from the list to continue speaking, or click "Send Secure Message" on any candidate's profile to connect.
              </p>
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Find Matching Profiles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
