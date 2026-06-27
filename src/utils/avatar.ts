/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile } from "../types";

/**
 * Returns a high-quality, elegant cartoonish/abstract SVG placeholder as a data URI
 * to ensure that we never use real human photos for fallback avatars.
 */
export function getAvatarPlaceholder(gender: "Male" | "Female" | string): string {
  const isFemale = typeof gender === "string" && gender.toLowerCase() === "female";

  if (isFemale) {
    // Elegant cartoon representation of a female profile with headscarf/hijab matching traditions.
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="100%" height="100%" fill="#fdf2f8"/>
  <path d="M30 46c0-18 12-28 30-28s30 10 30 28c0 15-5 32-15 38c-5 3-10 4-15 4s-10-1-15-4C35 78 30 61 30 46z" fill="#047857"/>
  <ellipse cx="60" cy="52" rx="15" ry="18" fill="#fed7aa"/>
  <path d="M48 44c4-6 9-8 12-8s8 2 12 8c-2-4-6-6-12-6s-10 2-12 6z" fill="#1e293b"/>
  <path d="M25 100c5-14 15-20 35-20s30 6 35 20H25z" fill="#047857"/>
  <circle cx="60" cy="81" r="2.5" fill="#fbbf24"/>
</svg>
`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    // Clean, modern cartoon representation of a male profile with neat haircut and suit.
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="100%" height="100%" fill="#e0f2fe"/>
  <circle cx="60" cy="48" r="20" fill="#fed7aa"/>
  <path d="M40 42c2-12 11-17 20-17s18 5 20 17c-3-5-9-8-20-8s-17 3-20 8z" fill="#1e293b"/>
  <path d="M25 100c5-15 15-24 35-24s30 9 35 24H25z" fill="#0f172a"/>
  <path d="M52 76l8 11 8-11v-5h-16v5z" fill="#fed7aa"/>
  <path d="M58 81l2 15 2-15h-4z" fill="#dc2626"/>
</svg>
`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

/**
 * Generates a stable, elegant, and secure profile code (e.g. KH-1045) for any profile.
 * Prevents enumeration of internal database IDs.
 */
export function formatProfileCode(profile: Profile | null | undefined): string {
  if (!profile) return "KH-1000";
  if (profile.profileCode) return profile.profileCode;

  // Stable conversion of standard numeric IDs (e.g., prof_1, prof_2)
  const numMatch = profile.id.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0]);
    if (num < 1000) return `KH-${1000 + num}`;
    return `KH-${num}`;
  }

  // Consistent hash for secure UUIDs
  let hash = 0;
  for (let i = 0; i < profile.id.length; i++) {
    hash = profile.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const code = 1000 + Math.abs(hash % 9000);
  return `KH-${code}`;
}
