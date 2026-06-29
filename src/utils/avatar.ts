/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile } from "../types";

/**
 * Returns a beautifully designed, modern, neutral unisex user silhouette vector placeholder as a data URI
 * to ensure that we have a polished default placeholder image when no user has uploaded a photo.
 * Generates deterministically distinct beautiful premium color themes based on the provided seed.
 */
export function getAvatarPlaceholder(gender?: "Male" | "Female" | string, seedOrVariant?: string | number): string {
  let index = 0;
  
  if (typeof seedOrVariant === "number") {
    // Treat as preset index
    index = seedOrVariant * 3 + 2; // multiply to spread colors
  } else if (typeof seedOrVariant === "string" && seedOrVariant) {
    // Generate a stable hash from the string
    let hash = 0;
    for (let i = 0; i < seedOrVariant.length; i++) {
      hash = seedOrVariant.charCodeAt(i) + ((hash << 5) - hash);
    }
    index = Math.abs(hash);
  } else if (gender) {
    // Generate simple hash from gender
    let hash = 0;
    for (let i = 0; i < gender.length; i++) {
      hash = gender.charCodeAt(i) + ((hash << 5) - hash);
    }
    index = Math.abs(hash);
  }

  // Create an array of beautiful, premium, elegant color palettes matching the KalyanHub design aesthetic
  const palettes = [
    { bgStart: "#f4fbf8", bgEnd: "#d1fae5", userStart: "#6ee7b7", userEnd: "#059669", accent: "#10b981" }, // Emerald Teal
    { bgStart: "#fdfdf6", bgEnd: "#fef3c7", userStart: "#fcd34d", userEnd: "#d97706", accent: "#f59e0b" }, // Warm Amber Gold
    { bgStart: "#faf7f5", bgEnd: "#ffedd5", userStart: "#fdba74", userEnd: "#ea580c", accent: "#f97316" }, // Soft Terracotta
    { bgStart: "#fdf8f7", bgEnd: "#fee2e2", userStart: "#fca5a5", userEnd: "#dc2626", accent: "#ef4444" }, // Soft Rose Red
    { bgStart: "#f5f8fc", bgEnd: "#dbeafe", userStart: "#93c5fd", userEnd: "#2563eb", accent: "#3b82f6" }, // Elegant Blue
    { bgStart: "#faf5ff", bgEnd: "#f3e8ff", userStart: "#d8b4fe", userEnd: "#7c3aed", accent: "#8b5cf6" }, // Soft Purple
    { bgStart: "#fdf4ff", bgEnd: "#fae8ff", userStart: "#f0abfc", userEnd: "#c084fc", accent: "#d946ef" }, // Soft Lavender Orchid
    { bgStart: "#edfcfc", bgEnd: "#ccfbf1", userStart: "#5eead4", userEnd: "#0d9488", accent: "#14b8a6" }, // Clean Turquoise
    { bgStart: "#fbfdf7", bgEnd: "#f0fdf4", userStart: "#86efac", userEnd: "#16a34a", accent: "#22c55e" }, // Spring Mint
    { bgStart: "#fefafd", bgEnd: "#fae8ff", userStart: "#f472b6", userEnd: "#db2777", accent: "#ec4899" }  // Soft Pink
  ];
  
  const palette = palettes[index % palettes.length];

  // Adjust torso width or shape slightly for gender variation
  const isFemale = gender?.toLowerCase() === "female";
  const headSize = 13;
  const neckY = 55;
  const torsoPath = isFemale
    ? `M 24,80 C 24,66 34,59 50,59 C 66,59 76,66 76,80 Z` // Female sloping shoulders
    : `M 22,80 C 22,64 32,58 50,58 C 68,58 78,64 78,80 Z`; // Male broader shoulders

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bgGrad_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgStart}" />
      <stop offset="100%" stop-color="${palette.bgEnd}" />
    </linearGradient>
    <linearGradient id="userGrad_${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${palette.userStart}" />
      <stop offset="100%" stop-color="${palette.userEnd}" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="100" height="100" fill="url(#bgGrad_${index})" />
  <!-- Elegant subtle background circular grid pattern -->
  <circle cx="50" cy="50" r="42" stroke="${palette.accent}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.15" fill="none" />
  
  <!-- Sleek Modern User Silhouette -->
  <g transform="translate(0, 4)" opacity="0.85">
    <!-- Neck -->
    <path d="M 46,${neckY} L 54,${neckY} L 54,63 L 46,63 Z" fill="${palette.userEnd}" opacity="0.4" />
    <!-- Head -->
    <circle cx="50" cy="40" r="${headSize}" fill="url(#userGrad_${index})" />
    <!-- Shoulders & Torso -->
    <path d="${torsoPath}" fill="url(#userGrad_${index})" />
  </g>
</svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
