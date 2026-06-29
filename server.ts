/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { Sect, District, EducationType, Profile, User, Message } from "./src/types";
import { SAMPLE_PROFILES } from "./src/data";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Sliding session expiration middleware (30 minutes)
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/session_user_id=([^;]+)/);
  let userId = match ? match[1] : null;
  if (!userId) {
    userId = req.headers["x-user-id"] as string || null;
  }
  if (userId && req.url.startsWith("/api/") && !req.url.startsWith("/api/auth/logout")) {
    res.setHeader("Set-Cookie", `session_user_id=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`);
  }
  next();
});

// Load Firebase configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: Firestore | null = null;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const appInstance = initializeApp({
      projectId: config.projectId,
    });
    db = getFirestore(appInstance, config.firestoreDatabaseId);
    console.log("Firebase Admin initialized successfully with database ID:", config.firestoreDatabaseId);
  } catch (err) {
    console.error("Firebase Admin initialization failed. Falling back to in-memory store.", err);
  }
} else {
  console.log("firebase-applet-config.json not found. Falling back to in-memory store.");
}

// In-Memory Database Fallbacks (used if DB is null)
const inMemoryProfiles: Profile[] = [];
const inMemoryUsers: User[] = [];
const inMemoryMessages: Message[] = [];

// Seed Firestore with initial data if empty (Disabled to prevent dummy/SAMPLE data from filling the real database)
async function seedDatabaseIfEmpty() {
  return;
}

// Helper to recursively remove undefined properties for Firestore compatibility
function cleanFirestoreData(data: any): any {
  if (data === undefined) {
    return null;
  }
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(cleanFirestoreData);
  }
  const result: any = {};
  for (const key of Object.keys(data)) {
    if (data[key] !== undefined) {
      result[key] = cleanFirestoreData(data[key]);
    }
  }
  return result;
}

// Self-healing helper to ensure every registered user has a valid bio profile in the system
async function ensureUserProfileExists(user: User): Promise<Profile> {
  let profile = await getProfile(user.profileId);
  if (!profile) {
    console.log(`Self-healing triggered: Profile ${user.profileId} was missing for user ${user.id} (${user.email}). Auto-creating...`);
    profile = {
      id: user.profileId,
      fullName: user.fullName,
      gender: user.gender,
      age: 25,
      height: 165,
      weight: 60,
      district: District.Malappuram,
      sect: Sect.General,
      education: EducationType.Graduate,
      educationDetails: "Graduate (Default)",
      occupation: "Not specified",
      incomeRange: "Not specified",
      aboutMe: `Hello, I am ${user.fullName}. I have recently joined KalyanHub to find my suitable life partner.`,
      religiousPractice: "Moderate",
      hobbies: [],
      photos: [],
      isVerified: user.isAdmin,
      verifiedDate: user.isAdmin ? new Date().toISOString().split('T')[0] : undefined,
      family: {
        fatherName: "Not specified",
        fatherStatus: "Alive",
        fatherOccupation: "Not specified",
        motherName: "Not specified",
        motherOccupation: "Not specified",
        familyStatus: "Middle Class",
        familyValues: "Moderate",
        siblingsDetails: "Not specified",
        nativePlace: "Malappuram",
      },
      phone: "+91 9999999999",
      photoAccessApprovedUsers: [],
      photoAccessRequestsReceived: [],
      maritalStatus: "Never Married",
      profileFor: "Self",
      address: ""
    };
    await saveProfile(profile);
  }
  return profile;
}

// Data fetching helper functions
async function getProfiles(): Promise<Profile[]> {
  if (db) {
    try {
      const snap = await db.collection("profiles").get();
      return snap.docs.map(doc => doc.data() as Profile);
    } catch (err) {
      console.error("Failed to fetch profiles from Firestore, using in-memory fallback:", err);
    }
  }
  return inMemoryProfiles;
}

async function getProfile(id: string): Promise<Profile | null> {
  if (db) {
    try {
      const doc = await db.collection("profiles").doc(id).get();
      if (doc.exists) {
        return doc.data() as Profile;
      }
    } catch (err) {
      console.error(`Failed to fetch profile ${id} from Firestore, using in-memory fallback:`, err);
    }
  }
  return inMemoryProfiles.find(p => p.id === id) || null;
}

async function saveProfile(profile: Profile): Promise<void> {
  if (db) {
    try {
      await db.collection("profiles").doc(profile.id).set(cleanFirestoreData(profile));
    } catch (err) {
      console.error(`Failed to save profile ${profile.id} to Firestore, using in-memory fallback:`, err);
    }
  }
  const idx = inMemoryProfiles.findIndex(p => p.id === profile.id);
  if (idx !== -1) {
    inMemoryProfiles[idx] = profile;
  } else {
    inMemoryProfiles.push(profile);
  }
}

async function getUsers(): Promise<User[]> {
  if (db) {
    try {
      const snap = await db.collection("users").get();
      return snap.docs.map(doc => doc.data() as User);
    } catch (err) {
      console.error("Failed to fetch users from Firestore, using in-memory fallback:", err);
    }
  }
  return inMemoryUsers;
}

async function getUser(id: string): Promise<User | null> {
  if (db) {
    try {
      const doc = await db.collection("users").doc(id).get();
      if (doc.exists) {
        return doc.data() as User;
      }
    } catch (err) {
      console.error(`Failed to fetch user ${id} from Firestore, using in-memory fallback:`, err);
    }
  }
  return inMemoryUsers.find(u => u.id === id) || null;
}

async function saveUser(user: User): Promise<void> {
  if (db) {
    try {
      await db.collection("users").doc(user.id).set(cleanFirestoreData(user));
    } catch (err) {
      console.error(`Failed to save user ${user.id} to Firestore, using in-memory fallback:`, err);
    }
  }
  const idx = inMemoryUsers.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    inMemoryUsers[idx] = user;
  } else {
    inMemoryUsers.push(user);
  }
}

async function getMessages(): Promise<Message[]> {
  if (db) {
    try {
      const snap = await db.collection("messages").get();
      return snap.docs.map(doc => doc.data() as Message);
    } catch (err) {
      console.error("Failed to fetch messages from Firestore, using in-memory fallback:", err);
    }
  }
  return inMemoryMessages;
}

async function saveMessage(msg: Message): Promise<void> {
  if (db) {
    try {
      await db.collection("messages").doc(msg.id).set(cleanFirestoreData(msg));
      return;
    } catch (err) {
      console.error(`Failed to save message ${msg.id} to Firestore, using in-memory fallback:`, err);
    }
  }
  inMemoryMessages.push(msg);
}

async function updateMessageReadStatus(senderId: string, receiverId: string): Promise<void> {
  if (db) {
    try {
      const snap = await db.collection("messages")
        .where("senderId", "==", senderId)
        .where("receiverId", "==", receiverId)
        .get();
      const batch = db.batch();
      snap.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
      return;
    } catch (err) {
      console.error("Failed to update message read status in Firestore, using in-memory fallback:", err);
    }
  }
  inMemoryMessages.forEach(msg => {
    if (msg.senderId === senderId && msg.receiverId === receiverId) {
      msg.isRead = true;
    }
  });
}

// Helper to get active user based on session cookie (each visitor gets their own device session)
async function getAuthenticatedUser(req: express.Request): Promise<User | null> {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/session_user_id=([^;]+)/);
  let userId = match ? match[1] : null;
  
  if (!userId) {
    // Fallback to custom header to support iframe environments where cookies might be blocked
    userId = req.headers["x-user-id"] as string || null;
  }
  
  if (!userId) return null;
  const user = await getUser(userId);
  if (user && user.isDeleted) return null;
  return user;
}

// Promotional Access Configuration (Persisted in Firestore or locally in memory)
let disableAllPromotionalAccess = false;
let enableRealOtp = false;

async function loadPromoConfig() {
  if (db) {
    try {
      const doc = await db.collection("settings").doc("promo_config").get();
      if (doc.exists) {
        disableAllPromotionalAccess = !!doc.data()?.disableAllPromotionalAccess;
        console.log("Loaded promotional access config. Disabled:", disableAllPromotionalAccess);
      }
    } catch (err) {
      console.error("Failed to load promo config from Firestore:", err);
    }
  }
}

async function savePromoConfig(disabled: boolean): Promise<void> {
  disableAllPromotionalAccess = disabled;
  if (db) {
    try {
      await db.collection("settings").doc("promo_config").set({ disableAllPromotionalAccess: disabled });
    } catch (err) {
      console.error("Failed to save promo config to Firestore:", err);
    }
  }
}

async function loadOtpConfig() {
  if (db) {
    try {
      const doc = await db.collection("settings").doc("otp_config").get();
      if (doc.exists) {
        enableRealOtp = !!doc.data()?.enableRealOtp;
        console.log("Loaded OTP config. enableRealOtp:", enableRealOtp);
      }
    } catch (err) {
      console.error("Failed to load OTP config from Firestore:", err);
    }
  }
}

async function saveOtpConfig(enabled: boolean): Promise<void> {
  enableRealOtp = enabled;
  if (db) {
    try {
      await db.collection("settings").doc("otp_config").set({ enableRealOtp: enabled });
    } catch (err) {
      console.error("Failed to save OTP config to Firestore:", err);
    }
  }
}

function getUserType(user: User | undefined | null): "admin" | "paid" | "promotional" | "free" {
  if (!user) return "free";
  if (user.isAdmin) return "admin";
  if (user.isPaid) return "paid";
  if (user.userType === "promotional" && !disableAllPromotionalAccess) {
    return "promotional";
  }
  return "free";
}

function isUserPremium(user: User | undefined | null): boolean {
  const ut = getUserType(user);
  return ut === "admin" || ut === "paid" || ut === "promotional";
}

function prepareUserResponse(user: User): User {
  return {
    ...user,
    isPaid: isUserPremium(user)
  };
}

interface OtpEntry {
  code: string;
  expiresAt: number;
  flow: "register" | "reset";
}

const otpStore = new Map<string, OtpEntry>();

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }
  return null;
};

async function sendVerificationOtp(email: string, flow: "register" | "reset"): Promise<{ success: boolean; emailSent: boolean; devCode?: string; error?: string }> {
  const code = enableRealOtp 
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : "2026";

  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    flow
  });

  if (!enableRealOtp) {
    console.log(`[SMTP Disabled / Real OTP Off] Verification OTP for ${email}: ${code}`);
    return { success: true, emailSent: false, devCode: code };
  }

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || `"KalyanHub" <noreply@kalyanhub.com>`;
  const subject = flow === "register" ? "Verify Your KalyanHub Registration" : "Reset Your KalyanHub Password";
  
  const htmlContent = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background-color: #064e3b; padding: 32px 24px; border-radius: 12px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">KalyanHub</h1>
        <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px;">Verified Matrimony Network</p>
      </div>
      <div style="padding: 24px 8px; color: #1e293b;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Assalamu Alaikum,</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
          ${flow === "register" 
            ? "Thank you for registering a profile on KalyanHub Matrimony. To complete your registration and verify this email belongs to you, please use the 4-digit OTP code below:" 
            : "A password reset request was initiated for your KalyanHub account. To proceed with setting up a new security password, please use the 4-digit verification code below:"}
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <span style="display: inline-block; padding: 14px 40px; background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #065f46; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
          This OTP code is highly secure and valid for exactly <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this message.
        </p>
      </div>
      <div style="padding: 16px 24px; background-color: #f8fafc; border-radius: 12px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0; font-weight: 500;">
          © 2026 KalyanHub Muslim Matrimony. All rights reserved.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        html: htmlContent,
        text: `Assalamu Alaikum. Your verification code is: ${code}. Valid for 10 minutes.`
      });
      console.log(`[SMTP] Successfully sent OTP to ${email}`);
      return { success: true, emailSent: true };
    } catch (err: any) {
      console.error("[SMTP Error] Failed to send email via SMTP, falling back to developer sandbox mode:", err);
      return { success: true, emailSent: false, devCode: code, error: err.message || String(err) };
    }
  } else {
    console.log(`[SMTP Not Configured] Verification OTP for ${email}: ${code}`);
    return { success: true, emailSent: false, devCode: code, error: "SMTP configuration not found in environment variables." };
  }
}

// --- API ROUTES ---

// Auth Routes
app.post("/api/auth/send-register-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const allUsers = await getUsers();
    const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const result = await sendVerificationOtp(email, "register");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to send verification code." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { 
    email, 
    password, 
    fullName, 
    gender, 
    age, 
    height, 
    district, 
    sect, 
    education, 
    occupation, 
    phone,
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
    otpCode
  } = req.body;
  
  if (!email || !fullName || !gender) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!otpCode) {
    return res.status(400).json({ error: "Verification code (OTP) is required." });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  // Validate OTP code
  const otpRecord = otpStore.get(email.toLowerCase());
  if (!otpRecord || otpRecord.flow !== "register") {
    return res.status(400).json({ error: "No active verification session found. Please request a verification OTP." });
  }
  if (otpRecord.expiresAt < Date.now()) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: "Verification OTP code has expired. Please send a new code." });
  }
  if (otpRecord.code !== otpCode) {
    return res.status(400).json({ error: "Incorrect verification OTP. Please enter the code sent to your email." });
  }

  // Verification successful! Clean up OTP
  otpStore.delete(email.toLowerCase());

  const allUsers = await getUsers();
  const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const profileId = `prof_user_${Date.now()}`;
  const userId = `user_${Date.now()}`;

  const isAdmin = email.toLowerCase().includes("admin");
  const newProfile: Profile = {
    id: profileId,
    fullName,
    gender,
    age: Number(age) || 25,
    height: Number(height) || 165,
    weight: 60,
    district: district as District || District.Malappuram,
    sect: sect as Sect || Sect.General,
    education: education as EducationType || EducationType.Graduate,
    educationDetails: "Not specified",
    occupation: occupation || "Not specified",
    incomeRange: "Not specified",
    aboutMe: aboutMe || `Hello, I am ${fullName}. I have recently joined KalyanHub to find my suitable life partner.`,
    religiousPractice: "Moderate",
    hobbies: [],
    photos: [], // Use cartoon SVG placeholders
    isVerified: isAdmin,
    verifiedDate: isAdmin ? new Date().toISOString().split('T')[0] : undefined,
    family: {
      fatherName: fatherName || "Not specified",
      fatherStatus: fatherStatus || "Alive",
      fatherOccupation: fatherStatus === "Passed Away" ? "" : (fatherOccupation || "Not specified"),
      motherName: motherName || "Not specified",
      motherOccupation: motherOccupation || "Not specified",
      familyStatus: "Middle Class",
      familyValues: "Moderate",
      siblingsDetails: siblingsDetails || "Not specified",
      nativePlace: district as string || "Malappuram",
    },
    phone: phone || "+91 9999999999",
    photoAccessApprovedUsers: [],
    photoAccessRequestsReceived: [],
    maritalStatus: maritalStatus || "Never Married",
    profileFor: profileFor || "Self",
    address: address || "",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    status: "Active",
    isDeactivated: false,
    isDeleted: false
  };

  const newUser: User = {
    id: userId,
    email,
    password: password || "123456",
    fullName,
    gender,
    profileId,
    favorites: [],
    isPaid: false,
    paymentProof: "",
    paymentProofStatus: "none",
    revealedProfileIds: [],
    isAdmin,
    userType: "promotional",
    createdAt: new Date().toISOString(),
    isDeactivated: false,
    isDeleted: false
  };

  await saveProfile(newProfile);
  await saveUser(newUser);
  res.setHeader("Set-Cookie", `session_user_id=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`);

  res.json({ user: prepareUserResponse(newUser), profile: newProfile });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const allUsers = await getUsers();
  let user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    if (user.isDeleted) {
      return res.status(403).json({ error: "This account has been permanently deleted and cannot be logged into." });
    }
    const correctPassword = user.password || (email.toLowerCase().includes("admin") ? "admin123" : "123456");
    if (password !== correctPassword) {
      return res.status(401).json({ 
        error: "Incorrect password. If you are an existing user, your default password is '123456'." 
      });
    }
    
    if (email.toLowerCase().includes("admin") && !user.isAdmin) {
      user.isAdmin = true;
      await saveUser(user);
    }
  } else {
    // Auto-create seeded admin if they try to use the preset admin email and it doesn't exist
    if (email.toLowerCase() === "admin@kalyanhub.com") {
      const userId = "user_admin_seeded";
      const profileId = "prof_admin_seeded";
      
      const adminUser: User = {
        id: userId,
        email: "admin@kalyanhub.com",
        password: "admin123",
        fullName: "System Administrator",
        gender: "Male",
        profileId,
        favorites: [],
        isPaid: true,
        paymentProof: "",
        paymentProofStatus: "approved",
        revealedProfileIds: [],
        isAdmin: true
      };

      const adminProfile: Profile = {
        id: profileId,
        fullName: "System Administrator",
        gender: "Male",
        age: 35,
        height: 175,
        weight: 75,
        district: District.Malappuram,
        sect: Sect.General,
        education: EducationType.Engineer,
        educationDetails: "Post Graduate",
        occupation: "KalyanHub Administrator",
        incomeRange: "₹24L+ per annum",
        aboutMe: "I am the system administrator for KalyanHub Matrimony Portal.",
        religiousPractice: "Moderate",
        hobbies: [],
        photos: ["https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"],
        isVerified: true,
        verifiedDate: new Date().toISOString().split('T')[0],
        family: {
          fatherName: "Seeded Admin",
          fatherOccupation: "Retired",
          motherName: "Seeded Admin",
          motherOccupation: "Homemaker",
          familyStatus: "Affluent",
          familyValues: "Moderate",
          siblingsDetails: "None",
          nativePlace: "Malappuram"
        },
        phone: "+91 9999999999",
        photoAccessApprovedUsers: [],
        photoAccessRequestsReceived: []
      };

      await saveProfile(adminProfile);
      await saveUser(adminUser);
      user = adminUser;
    } else {
      return res.status(404).json({ error: "No account found with this email. Please click 'Register free profile' to sign up." });
    }
  }

  res.setHeader("Set-Cookie", `session_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`);
  
  // Reactivate user and update lastLoginAt upon login
  user.isDeactivated = false;
  user.lastLoginAt = new Date().toISOString();
  await saveUser(user);

  const profile = await ensureUserProfileExists(user);
  profile.lastLoginAt = new Date().toISOString();
  profile.isDeactivated = false;
  profile.status = "Active";
  await saveProfile(profile);

  res.json({ user: prepareUserResponse(user), profile });
});

app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", "session_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  res.json({ success: true });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const allUsers = await getUsers();
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    // Send reset password OTP
    const result = await sendVerificationOtp(user.email, "reset");
    res.json({ email: user.email, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to initiate password reset." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ error: "Email, OTP verification code, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // Verify OTP code
    const otpRecord = otpStore.get(email.toLowerCase());
    if (!otpRecord || otpRecord.flow !== "reset") {
      return res.status(400).json({ error: "No active password reset session found. Please request a verification OTP." });
    }
    if (otpRecord.expiresAt < Date.now()) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: "Verification OTP code has expired. Please try again." });
    }
    if (otpRecord.code !== otpCode) {
      return res.status(400).json({ error: "Incorrect verification OTP. Please enter the code sent to your email." });
    }

    const allUsers = await getUsers();
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    // Success! Update password and clean up OTP
    otpStore.delete(email.toLowerCase());
    user.password = newPassword;
    await saveUser(user);

    res.json({ success: true, message: "Password has been reset successfully! You can now log in." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to reset password." });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const profile = await ensureUserProfileExists(user);
  res.json({ user: prepareUserResponse(user), profile });
});

function formatProfileCode(profile: any): string {
  if (!profile) return "KH-1000";
  if (profile.profileCode) return profile.profileCode;

  const numMatch = String(profile.id).match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0]);
    if (num < 1000) return `KH-${1000 + num}`;
    return `KH-${num}`;
  }

  let hash = 0;
  const idStr = String(profile.id);
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const code = 1000 + Math.abs(hash % 9000);
  return `KH-${code}`;
}

function getAvatarPlaceholder(gender: string): string {
  const isFemale = String(gender).toLowerCase() === "female";
  if (isFemale) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="#fdf2f8"/><path d="M30 46c0-18 12-28 30-28s30 10 30 28c0 15-5 32-15 38c-5 3-10 4-15 4s-10-1-15-4C35 78 30 61 30 46z" fill="#047857"/><ellipse cx="60" cy="52" rx="15" ry="18" fill="#fed7aa"/><path d="M48 44c4-6 9-8 12-8s8 2 12 8c-2-4-6-6-12-6s-10 2-12 6z" fill="#1e293b"/><path d="M25 100c5-14 15-20 35-20s30 6 35 20H25z" fill="#047857"/><circle cx="60" cy="81" r="2.5" fill="#fbbf24"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="#e0f2fe"/><circle cx="60" cy="48" r="20" fill="#fed7aa"/><path d="M40 42c2-12 11-17 20-17s18 5 20 17c-3-5-9-8-20-8s-17 3-20 8z" fill="#1e293b"/><path d="M25 100c5-15 15-24 35-24s30 9 35 24H25z" fill="#0f172a"/><path d="M52 76l8 11 8-11v-5h-16v5z" fill="#fed7aa"/><path d="M58 81l2 15 2-15h-4z" fill="#dc2626"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

function sanitizeProfileForUser(profile: Profile, requestingUser?: User): any {
  const profileCode = formatProfileCode(profile);
  const photos = Array.isArray(profile.photos) && profile.photos.length > 0 
    ? profile.photos 
    : [getAvatarPlaceholder(profile.gender)];

  if (requestingUser?.isAdmin) {
    const candidateUser = inMemoryUsers.find(u => u.profileId === profile.id);
    const email = candidateUser ? candidateUser.email : `${profile.fullName.toLowerCase().replace(/\s+/g, "")}@kalyanhub.com`;
    return {
      ...profile,
      profileCode,
      photos,
      phone: profile.phone,
      email,
      isBlurred: false,
      photoAccessRequested: false,
      photoAccessApproved: true,
      photoAccessApprovedUsers: profile.photoAccessApprovedUsers || [],
      photoAccessRequestsReceived: profile.photoAccessRequestsReceived || []
    };
  }

  if (!requestingUser) {
    return {
      ...profile,
      profileCode,
      photos,
      phone: "+91 ••••••••••",
      address: "••••••••••••••••••••••••",
      isBlurred: profile.isPhotoBlurred === true
    };
  }

  const isOwner = profile.id === requestingUser.profileId;
  const isPaid = requestingUser.isPaid === true;
  const hasRevealed = requestingUser.revealedProfileIds?.includes(profile.id);

  // Mask Phone number
  let phone = profile.phone;
  if (!isOwner && !isPaid && !hasRevealed) {
    const orig = profile.phone || "";
    phone = orig.substring(0, Math.max(0, orig.length - 6)) + "••••••";
  }

  // Mask Address
  let address = profile.address || "";
  if (address) {
    if (!isOwner && !isPaid && !hasRevealed) {
      address = "••••••••••••••••••••••••";
    }
  }

  // Blur photos logic
  let isBlurred = false;
  let photoAccessRequested = false;
  let photoAccessApproved = false;
  let photoAccessRejected = false;

  const userProfileId = requestingUser.profileId || "";
  
  if (profile.photoAccessRejectedUsers?.includes(userProfileId)) {
    photoAccessRejected = true;
  }

  if (profile.isPhotoBlurred) {
    if (isOwner || profile.photoAccessApprovedUsers?.includes(userProfileId)) {
      isBlurred = false;
      photoAccessApproved = true;
    } else if (profile.photoAccessRequestsReceived?.includes(userProfileId)) {
      isBlurred = true;
      photoAccessRequested = true;
    } else {
      isBlurred = true;
      photoAccessRequested = false;
    }
  }

  return {
    ...profile,
    profileCode,
    photos,
    phone,
    address,
    isBlurred,
    photoAccessRequested,
    photoAccessApproved,
    photoAccessRejected,
    // Ensure arrays are present for client-side
    photoAccessApprovedUsers: profile.photoAccessApprovedUsers || [],
    photoAccessRequestsReceived: profile.photoAccessRequestsReceived || [],
    photoAccessRejectedUsers: profile.photoAccessRejectedUsers || []
  };
}

// --- Premium, Blur and Photo Access Routes ---

// 1. Upload payment proof
app.post("/api/user/upload-payment-proof", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { paymentProof } = req.body;
  if (!paymentProof) {
    return res.status(400).json({ error: "Payment proof is required" });
  }

  user.paymentProof = paymentProof;
  user.paymentProofStatus = "pending";
  user.paymentProofSubmittedAt = new Date().toISOString();

  await saveUser(user);
  res.json({ user });
});

// 2. Simulate payment approval (Demo bypass tool)
app.post("/api/user/simulate-payment-approval", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  user.isPaid = true;
  user.paymentProofStatus = "approved";

  await saveUser(user);
  res.json({ user });
});

// 3. Reveal Contact Phone
app.post("/api/profiles/:id/reveal-contact", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const targetId = req.params.id;
  const profile = await getProfile(targetId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (profile.id === user.profileId) {
    return res.json({ success: true, phone: profile.phone });
  }

  if (!user.revealedProfileIds) {
    user.revealedProfileIds = [];
  }

  const alreadyRevealed = user.revealedProfileIds.includes(targetId);

  const ut = getUserType(user);

  if (ut === "admin" || ut === "paid") {
    if (!alreadyRevealed) {
      user.revealedProfileIds.push(targetId);
      await saveUser(user);
    }
    return res.json({ success: true, phone: profile.phone });
  }

  if (ut === "promotional") {
    if (alreadyRevealed) {
      return res.json({ success: true, phone: profile.phone });
    }
    if (user.revealedProfileIds.length >= 10) {
      return res.status(403).json({
        error: "promo_limit_reached",
        message: "Promotional limit reached. Under your promotional plan, you can only reveal up to 10 contact details. Please upgrade to lifetime Premium to unlock unlimited contacts!"
      });
    }
    user.revealedProfileIds.push(targetId);
    await saveUser(user);
    return res.json({ success: true, phone: profile.phone });
  }

  // Free Tier constraints: max 1 reveal
  if (alreadyRevealed) {
    return res.json({ success: true, phone: profile.phone });
  }

  if (user.revealedProfileIds.length >= 1) {
    return res.status(402).json({
      error: "payment_required",
      message: "Free limit reached. Only 1 free contact reveal is allowed. Please upgrade to Premium!"
    });
  }

  // Within free limit, grant access
  user.revealedProfileIds.push(targetId);
  await saveUser(user);
  res.json({ success: true, phone: profile.phone });
});

// 4. Request photo access
app.post("/api/profiles/:id/request-photo-access", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const targetId = req.params.id;
  const profile = await getProfile(targetId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const userProfileId = user.profileId || "";
  if (!profile.photoAccessRequestsReceived) {
    profile.photoAccessRequestsReceived = [];
  }

  if (!profile.photoAccessRequestsReceived.includes(userProfileId)) {
    profile.photoAccessRequestsReceived.push(userProfileId);
    await saveProfile(profile);
  }

  res.json({ success: true, profile: sanitizeProfileForUser(profile, user) });
});

// 5. Approve photo access
app.post("/api/profiles/photo-access-requests/:requesterProfileId/approve", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const myProfile = await getProfile(user.profileId);
  if (!myProfile) {
    return res.status(404).json({ error: "Your profile not found" });
  }

  const requesterId = req.params.requesterProfileId;
  
  if (!myProfile.photoAccessApprovedUsers) {
    myProfile.photoAccessApprovedUsers = [];
  }
  if (!myProfile.photoAccessApprovedUsers.includes(requesterId)) {
    myProfile.photoAccessApprovedUsers.push(requesterId);
  }

  // Remove from requests received
  if (myProfile.photoAccessRequestsReceived) {
    myProfile.photoAccessRequestsReceived = myProfile.photoAccessRequestsReceived.filter(id => id !== requesterId);
  }

  await saveProfile(myProfile);
  res.json({ success: true, profile: sanitizeProfileForUser(myProfile, user) });
});

// 6. Reject photo access
app.post("/api/profiles/photo-access-requests/:requesterProfileId/reject", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const myProfile = await getProfile(user.profileId);
  if (!myProfile) {
    return res.status(404).json({ error: "Your profile not found" });
  }

  const requesterId = req.params.requesterProfileId;

  // Remove from requests received
  if (myProfile.photoAccessRequestsReceived) {
    myProfile.photoAccessRequestsReceived = myProfile.photoAccessRequestsReceived.filter(id => id !== requesterId);
  }

  await saveProfile(myProfile);
  res.json({ success: true, profile: sanitizeProfileForUser(myProfile, user) });
});

// 7. Toggle photo blur option for owner
app.post("/api/profiles/toggle-photo-blur", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const myProfile = await getProfile(user.profileId);
  if (!myProfile) {
    return res.status(404).json({ error: "Your profile not found" });
  }

  myProfile.isPhotoBlurred = !myProfile.isPhotoBlurred;
  await saveProfile(myProfile);

  res.json({ success: true, profile: sanitizeProfileForUser(myProfile, user) });
});

// 8. Get pending requests for current user
app.get("/api/profiles/my-photo-requests", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const myProfile = await getProfile(user.profileId);
  if (!myProfile) {
    return res.status(404).json({ error: "Your profile not found" });
  }

  const allProfiles = await getProfiles();

  const pendingRequestsList = (myProfile.photoAccessRequestsReceived || []).map(id => {
    return allProfiles.find(p => p.id === id);
  }).filter(p => p !== undefined).map(p => sanitizeProfileForUser(p!, user));

  const approvedRequestsList = (myProfile.photoAccessApprovedUsers || []).map(id => {
    return allProfiles.find(p => p.id === id);
  }).filter(p => p !== undefined).map(p => sanitizeProfileForUser(p!, user));

  res.json({ pending: pendingRequestsList, approved: approvedRequestsList });
});

// Update Profile API
app.post("/api/profiles/update", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const profile = await getProfile(user.profileId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const updatedProfile: Profile = {
    ...profile,
    ...req.body,
    id: profile.id,
    gender: profile.gender,
  };

  await saveProfile(updatedProfile);
  res.json({ profile: sanitizeProfileForUser(updatedProfile, user) });
});

// Profiles API with Filtering
app.get("/api/profiles", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const requesterProfile = await getProfile(user.profileId);
  const isRequesterVerified = requesterProfile?.isVerified ?? false;

  // If requesting user is NOT verified and NOT admin, they cannot search or view other profiles
  if (!isRequesterVerified && !user.isAdmin) {
    return res.json({
      profiles: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      userNotVerified: true
    });
  }

  const userGender = user?.gender || "Male";
  const partnerGender = userGender === "Male" ? "Female" : "Male";

  const allProfiles = await getProfiles();
  const allUsers = await getUsers();
  const adminProfileIds = allUsers.filter(u => u.isAdmin).map(u => u.profileId).filter(Boolean);
  
  let filtered = allProfiles.filter(p => {
    // Exclude own profile
    if (p.id === user?.profileId) return false;

    // Exclude system admins
    if (adminProfileIds.includes(p.id)) return false;

    // Exclude inactive profiles (unless requester is admin)
    if (p.status === "Inactive" && !user?.isAdmin) return false;

    // Exclude deactivated or deleted profiles (unless requester is admin)
    if ((p.isDeactivated || p.isDeleted) && !user?.isAdmin) return false;

    // Filter by gender
    if (p.gender !== partnerGender) return false;

    // Verify verification (unless requester is admin)
    if (!p.isVerified && !user?.isAdmin) return false;

    // Filter out users who have not logged in for last 14 days
    if (p.lastLoginAt) {
      const lastLoginTime = new Date(p.lastLoginAt).getTime();
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      if (lastLoginTime < fourteenDaysAgo && !user?.isAdmin) {
        return false;
      }
    }

    return true;
  });

  const {
    sects,
    districts,
    educations,
    maritalStatuses,
    minAge,
    maxAge,
    minHeight,
    maxHeight,
    isVerifiedOnly,
    searchQuery
  } = req.query;

  if (sects) {
    const sectList = (sects as string).split(",");
    filtered = filtered.filter(p => sectList.includes(p.sect));
  }

  if (districts) {
    const districtList = (districts as string).split(",");
    filtered = filtered.filter(p => districtList.includes(p.district));
  }

  if (educations) {
    const eduList = (educations as string).split(",");
    filtered = filtered.filter(p => eduList.includes(p.education));
  }

  if (maritalStatuses) {
    const statusList = (maritalStatuses as string).split(",");
    filtered = filtered.filter(p => statusList.includes(p.maritalStatus || "Never Married"));
  }

  if (minAge) {
    filtered = filtered.filter(p => p.age >= Number(minAge));
  }
  if (maxAge) {
    filtered = filtered.filter(p => p.age <= Number(maxAge));
  }

  if (minHeight) {
    filtered = filtered.filter(p => p.height >= Number(minHeight));
  }
  if (maxHeight) {
    filtered = filtered.filter(p => p.height <= Number(maxHeight));
  }

  if (isVerifiedOnly === "true") {
    filtered = filtered.filter(p => p.isVerified);
  }

  if (searchQuery) {
    const query = (searchQuery as string).toLowerCase();
    filtered = filtered.filter(
      p =>
        p.fullName.toLowerCase().includes(query) ||
        p.occupation.toLowerCase().includes(query) ||
        p.district.toLowerCase().includes(query) ||
        p.educationDetails.toLowerCase().includes(query)
    );
  }

  const sortBy = req.query.sortBy as string || "newest";
  if (sortBy === "newest") {
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  // Return sanitized profiles with pagination support
  const sanitizedList = filtered.map(p => sanitizeProfileForUser(p, user || undefined));
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedList = sanitizedList.slice(startIndex, endIndex);

  res.json({
    profiles: paginatedList,
    total: sanitizedList.length,
    page,
    limit,
    hasMore: endIndex < sanitizedList.length,
    totalPages: Math.ceil(sanitizedList.length / limit)
  });
});

// Get Single Profile
app.get("/api/profiles/:id", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const requesterProfile = await getProfile(user.profileId);
  const isRequesterVerified = requesterProfile?.isVerified ?? false;

  // Block unverified users from viewing other profiles
  if (!isRequesterVerified && !user.isAdmin && req.params.id !== user.profileId) {
    return res.status(403).json({ error: "Access denied. Your profile must be verified to view other profiles." });
  }

  const profile = await getProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  // Block viewing unverified profiles unless admin or own profile
  if (!profile.isVerified && !user.isAdmin && profile.id !== user.profileId) {
    return res.status(403).json({ error: "Access denied. This profile is pending verification." });
  }

  res.json(sanitizeProfileForUser(profile, user || undefined));
});

// Favorites Toggle
app.post("/api/profiles/:id/favorite", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const profileId = req.params.id;
  if (!user.favorites) {
    user.favorites = [];
  }
  const isFavorite = user.favorites.includes(profileId);

  if (isFavorite) {
    user.favorites = user.favorites.filter(id => id !== profileId);
  } else {
    user.favorites.push(profileId);
  }

  await saveUser(user);
  res.json({ favorites: user.favorites, isFavorite: !isFavorite });
});

// Messages API
// Get active chat threads with details
app.get("/api/messages", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userProfileId = user.profileId || "";

  const allMessages = await getMessages();
  const allProfiles = await getProfiles();

  // Find all profiles that the user has chatted with
  const chattedWithIds = new Set<string>();
  allMessages.forEach(msg => {
    if (msg.senderId === userProfileId) {
      chattedWithIds.add(msg.receiverId);
    } else if (msg.receiverId === userProfileId) {
      chattedWithIds.add(msg.senderId);
    }
  });

  // Also include profiles that favorited or have initial chat triggers
  const threads = Array.from(chattedWithIds).map(otherId => {
    const otherProfile = allProfiles.find(p => p.id === otherId);
    
    // Last message in thread
    const threadMsgs = allMessages.filter(
      msg =>
        (msg.senderId === userProfileId && msg.receiverId === otherId) ||
        (msg.senderId === otherId && msg.receiverId === userProfileId)
    );
    
    threadMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastMessage = threadMsgs[threadMsgs.length - 1];

    const unreadCount = threadMsgs.filter(msg => msg.receiverId === userProfileId && !msg.isRead).length;

    return {
      otherUser: otherProfile,
      lastMessage,
      unreadCount
    };
  }).filter(t => t.otherUser !== undefined); // filter out deleted or missing profiles

  res.json(threads);
});

// Get individual chat thread messages
app.get("/api/messages/:otherProfileId", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userProfileId = user.profileId || "";
  const otherProfileId = req.params.otherProfileId;

  // Mark all incoming messages from this user as read
  await updateMessageReadStatus(otherProfileId, userProfileId);

  const allMessages = await getMessages();
  const threadMsgs = allMessages.filter(
    msg =>
      (msg.senderId === userProfileId && msg.receiverId === otherProfileId) ||
      (msg.senderId === otherProfileId && msg.receiverId === userProfileId)
  );

  threadMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  res.json(threadMsgs);
});

// Send Message
app.post("/api/messages", async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { receiverId, content } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ error: "Receiver ID and message content are required" });
  }

  const userProfileId = user.profileId || "";

  const allMessages = await getMessages();

  // Check if they already have an existing conversation with this user
  const alreadyHasConversation = allMessages.some(
    msg => (msg.senderId === userProfileId && msg.receiverId === receiverId) ||
           (msg.senderId === receiverId && msg.receiverId === userProfileId)
  );

  const ut = getUserType(user);

  if (ut === "promotional") {
    const sentCount = allMessages.filter(msg => msg.senderId === userProfileId).length;
    if (sentCount >= 10) {
      return res.status(403).json({
        error: "promo_message_limit_reached",
        message: "Promotional limit reached. You have sent 10 messages under the promotional plan. Please upgrade to permanent Premium to continue chatting!"
      });
    }
  } else if (ut === "free" && !alreadyHasConversation) {
    return res.status(402).json({
      error: "payment_required",
      message: "Starting new chat conversations is limited on the Free tier. Please upgrade to Premium!"
    });
  }

  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    senderId: userProfileId,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    isRead: false
  };

  await saveMessage(newMessage);

  // Return the sent message
  res.json(newMessage);


});


// --- ADMIN PANEL API ENDPOINTS ---

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await getUsers();
    // Auto-heal profiles for any users fetched in admin panel to prevent unlinked states
    for (const u of users) {
      await ensureUserProfileExists(u);
    }
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
});

app.post("/api/admin/users/:id/update-payment", async (req, res) => {
  try {
    const userId = req.params.id;
    const { isPaid, paymentProofStatus, userType } = req.body;
    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isPaid = !!isPaid;
    user.paymentProofStatus = paymentProofStatus || "none";
    if (userType) {
      user.userType = userType;
    }
    await saveUser(user);
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update user payment status" });
  }
});

// Promotional Access Control
app.get("/api/admin/promo-toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    res.json({ disableAllPromotionalAccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch promo toggle" });
  }
});

app.post("/api/admin/promo-toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { disabled } = req.body;
    await savePromoConfig(!!disabled);
    res.json({ success: true, disableAllPromotionalAccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update promo toggle" });
  }
});

// Real OTP Toggle Control
app.get("/api/admin/otp-toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    res.json({ enableRealOtp });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch OTP toggle" });
  }
});

app.post("/api/admin/otp-toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { enabled } = req.body;
    await saveOtpConfig(!!enabled);
    res.json({ success: true, enableRealOtp });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update OTP toggle" });
  }
});

app.get("/api/admin/profiles", async (req, res) => {
  try {
    const profiles = await getProfiles();
    res.json({ profiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch profiles" });
  }
});

app.post("/api/admin/profiles/:id/update-verification", async (req, res) => {
  try {
    const profileId = req.params.id;
    const { isVerified } = req.body;
    const profile = await getProfile(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    profile.isVerified = !!isVerified;
    profile.verifiedDate = isVerified ? new Date().toISOString().split("T")[0] : undefined;
    await saveProfile(profile);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update profile verification" });
  }
});

app.post("/api/admin/profiles/:id/update", async (req, res) => {
  try {
    const profileId = req.params.id;
    const updatedData = req.body;
    
    let profile = inMemoryProfiles.find(p => p.id === profileId);
    if (!profile) {
      if (db) {
        const doc = await db.collection("profiles").doc(profileId).get();
        if (doc.exists) {
          profile = doc.data() as Profile;
        }
      }
    }
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const mergedProfile = {
      ...profile,
      ...updatedData,
      family: {
        ...profile.family,
        ...(updatedData.family || {})
      }
    };

    if (db) {
      await db.collection("profiles").doc(profileId).set(cleanFirestoreData(mergedProfile), { merge: true });
    }

    const idx = inMemoryProfiles.findIndex(p => p.id === profileId);
    if (idx !== -1) {
      inMemoryProfiles[idx] = mergedProfile;
    } else {
      inMemoryProfiles.push(mergedProfile);
    }

    res.json({ success: true, profile: mergedProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

app.post("/api/admin/profiles/:id/delete", async (req, res) => {
  try {
    const profileId = req.params.id;
    if (db) {
      await db.collection("profiles").doc(profileId).delete();
    }
    const idx = inMemoryProfiles.findIndex(p => p.id === profileId);
    if (idx !== -1) {
      inMemoryProfiles.splice(idx, 1);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete profile" });
  }
});

function generateStrongPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

app.post("/api/admin/profiles/create", async (req, res) => {
  try {
    const profileData = req.body;
    const profileId = `prof_gen_${Math.random().toString(36).substring(2, 15)}`;
    
    const newProfile: Profile = {
      id: profileId,
      fullName: profileData.fullName || "Unnamed Profile",
      gender: profileData.gender || "Female",
      age: Number(profileData.age) || 24,
      height: Number(profileData.height) || 162,
      weight: Number(profileData.weight) || 55,
      district: profileData.district || District.Malappuram,
      sect: profileData.sect || Sect.General,
      education: profileData.education || EducationType.Graduate,
      educationDetails: profileData.educationDetails || "Degree Holder",
      occupation: profileData.occupation || "Professional",
      incomeRange: profileData.incomeRange || "", // Optional annual income
      aboutMe: profileData.aboutMe || "Looking for an understanding partner.",
      religiousPractice: profileData.religiousPractice || "Moderate",
      hobbies: Array.isArray(profileData.hobbies) ? profileData.hobbies : [],
      photos: Array.isArray(profileData.photos) && profileData.photos.length > 0 
        ? profileData.photos 
        : [],
      isVerified: profileData.isVerified === undefined ? true : !!profileData.isVerified,
      verifiedDate: new Date().toISOString().split("T")[0],
      family: {
        fatherName: profileData.fatherName || "Not specified",
        fatherStatus: profileData.fatherStatus || "Alive",
        fatherOccupation: profileData.fatherStatus === "Passed Away" ? "" : (profileData.fatherOccupation || "Not specified"),
        motherName: profileData.motherName || "Not specified",
        motherOccupation: profileData.motherOccupation || "Not specified",
        familyStatus: profileData.familyStatus || "Middle Class",
        familyValues: profileData.familyValues || "Moderate",
        siblingsDetails: profileData.siblingsDetails || "None",
        nativePlace: profileData.nativePlace || "Kerala",
      },
      phone: profileData.phone || "+91 9876543210",
      photoAccessApprovedUsers: [],
      photoAccessRequestsReceived: [],
      photoAccessRejectedUsers: [],
      lastLoginAt: new Date().toISOString(),
      status: "Active",
      maritalStatus: profileData.maritalStatus || "Never Married",
      profileFor: profileData.profileFor || "Self",
      address: profileData.address || "",
      createdAt: new Date().toISOString(),
      isDeactivated: false,
      isDeleted: false
    };

    const generatedPassword = profileData.password || generateStrongPassword();
    const userId = `user_gen_${Math.random().toString(36).substring(2, 15)}`;
    const emailAddress = profileData.email || `${profileData.fullName.toLowerCase().replace(/\s+/g, "")}@kalyanhub.com`;

    const newUser: User = {
      id: userId,
      email: emailAddress,
      password: generatedPassword,
      fullName: profileData.fullName || "Unnamed Profile",
      gender: profileData.gender || "Female",
      profileId: profileId,
      favorites: [],
      isPaid: false,
      paymentProofStatus: "none",
      revealedProfileIds: [],
      userType: profileData.userType || "standard",
      createdAt: new Date().toISOString(),
      isDeactivated: false,
      isDeleted: false
    };

    await saveProfile(newProfile);
    await saveUser(newUser);

    res.json({ 
      success: true, 
      profile: sanitizeProfileForUser(newProfile, newUser), 
      user: newUser, 
      generatedPassword 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create profile" });
  }
});

app.post("/api/auth/update-password", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing current or new password" });
    }

    const correctPassword = user.password || (user.email.toLowerCase().includes("admin") ? "admin123" : "123456");
    if (currentPassword !== correctPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await saveUser(user);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update password" });
  }
});

app.post("/api/profiles/deactivate", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.profileId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { status, inactiveReason } = req.body;
    if (status !== "Active" && status !== "Inactive") {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const profile = await getProfile(user.profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const isInactive = status === "Inactive";
    profile.status = status;
    profile.inactiveReason = inactiveReason || "";
    profile.isDeactivated = isInactive;
    await saveProfile(profile);

    user.isDeactivated = isInactive;
    await saveUser(user);

    res.json({ success: true, profile: sanitizeProfileForUser(profile, user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update profile status" });
  }
});

app.post("/api/profiles/delete-account", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    user.isDeleted = true;
    user.isDeactivated = true;
    await saveUser(user);

    if (user.profileId) {
      const profile = await getProfile(user.profileId);
      if (profile) {
        profile.isDeleted = true;
        profile.isDeactivated = true;
        profile.status = "Inactive";
        await saveProfile(profile);
      }
    }

    res.setHeader("Set-Cookie", "session_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    res.json({ success: true, message: "Account has been permanently deleted." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete account" });
  }
});

app.post("/api/admin/purge-all-data", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    if (db) {
      const profileSnap = await db.collection("profiles").get();
      const profileBatch = db.batch();
      profileSnap.docs.forEach(doc => {
        if (doc.id !== "prof_admin_seeded") {
          profileBatch.delete(doc.ref);
        }
      });
      await profileBatch.commit();

      const userSnap = await db.collection("users").get();
      const userBatch = db.batch();
      userSnap.docs.forEach(doc => {
        if (doc.id !== "user_admin_seeded") {
          userBatch.delete(doc.ref);
        }
      });
      await userBatch.commit();

      const msgSnap = await db.collection("messages").get();
      const msgBatch = db.batch();
      msgSnap.docs.forEach(doc => msgBatch.delete(doc.ref));
      await msgBatch.commit();
    }

    // Clear in-memory as well
    inMemoryProfiles.length = 0;
    inMemoryUsers.length = 0;

    // Re-seed only admin
    const adminUser: User = {
      id: "user_admin_seeded",
      email: "admin@kalyanhub.com",
      password: "admin123",
      fullName: "System Administrator",
      gender: "Male",
      profileId: "prof_admin_seeded",
      favorites: [],
      isPaid: true,
      revealedProfileIds: [],
      isAdmin: true,
      paymentProofStatus: "approved"
    };

    const adminProfile: Profile = {
      id: "prof_admin_seeded",
      fullName: "System Administrator",
      gender: "Male",
      age: 35,
      height: 175,
      weight: 75,
      district: District.Malappuram,
      sect: Sect.General,
      education: EducationType.Engineer,
      educationDetails: "Post Graduate",
      occupation: "KalyanHub Administrator",
      incomeRange: "₹24L+ per annum",
      aboutMe: "I am the system administrator for KalyanHub Matrimony Portal.",
      religiousPractice: "Moderate",
      hobbies: [],
      photos: [],
      isVerified: true,
      verifiedDate: new Date().toISOString().split('T')[0],
      family: {
        fatherName: "Seeded Admin",
        fatherOccupation: "Retired",
        motherName: "Seeded Admin",
        motherOccupation: "Homemaker",
        familyStatus: "Affluent",
        familyValues: "Moderate",
        siblingsDetails: "None",
        nativePlace: "Malappuram"
      },
      phone: "+91 9999999999",
      photoAccessApprovedUsers: [],
      photoAccessRequestsReceived: [],
      photoAccessRejectedUsers: [],
      lastLoginAt: new Date().toISOString(),
      status: "Active"
    };

    inMemoryUsers.push(adminUser);
    inMemoryProfiles.push(adminProfile);

    res.json({ success: true, message: "All test profiles and users purged successfully. Only admin remains." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to purge database" });
  }
});

app.post("/api/admin/reset-database", async (req, res) => {
  try {
    const userAnvarProfile: Profile = {
      id: "prof_user_anvar",
      fullName: "Mohammed Anvar",
      gender: "Male",
      age: 28,
      height: 176,
      weight: 72,
      district: District.Malappuram,
      sect: Sect.Sunni_EK,
      education: EducationType.Engineer,
      educationDetails: "B.Tech Computer Science",
      occupation: "Software Engineer",
      incomeRange: "₹8L - ₹12L per annum",
      aboutMe: "I am a practicing Muslim, working as a Software Engineer in Ernakulam. Looking for a religious and educated partner.",
      religiousPractice: "Practicing",
      hobbies: ["Reading", "Travel"],
      photos: [],
      isVerified: true,
      family: {
        fatherName: "K. Abdul Majeed",
        fatherOccupation: "Merchant",
        motherName: "Amina",
        motherOccupation: "Homemaker",
        familyStatus: "Middle Class",
        familyValues: "Moderate",
        siblingsDetails: "1 Brother, 1 Sister",
        nativePlace: "Manjeri, Malappuram",
      },
      phone: "+91 9447000111",
      photoAccessApprovedUsers: [],
      photoAccessRequestsReceived: []
    };

    if (db) {
      console.log("Resetting Firestore collections...");
      
      // Delete profiles
      const profileSnap = await db.collection("profiles").get();
      const profileBatch = db.batch();
      profileSnap.docs.forEach(doc => profileBatch.delete(doc.ref));
      await profileBatch.commit();

      // Delete users
      const userSnap = await db.collection("users").get();
      const userBatch = db.batch();
      userSnap.docs.forEach(doc => userBatch.delete(doc.ref));
      await userBatch.commit();

      // Delete messages
      const msgSnap = await db.collection("messages").get();
      const msgBatch = db.batch();
      msgSnap.docs.forEach(doc => msgBatch.delete(doc.ref));
      await msgBatch.commit();

      console.log("Firestore collections cleared. Re-seeding...");
    } else {
      // In-memory arrays reset
      inMemoryProfiles.length = 0;
      SAMPLE_PROFILES.forEach(p => {
        inMemoryProfiles.push({
          ...p,
          isPhotoBlurred: p.id === "prof_3" || p.id === "prof_5",
          photoAccessApprovedUsers: [],
          photoAccessRequestsReceived: []
        });
      });
      // also push userAnvarProfile if missing
      if (!inMemoryProfiles.some(p => p.id === userAnvarProfile.id)) {
        inMemoryProfiles.push(userAnvarProfile);
      }

      inMemoryUsers.length = 0;
      inMemoryUsers.push({
        id: "user_anvar",
        email: "mohammedanvark@gmail.com",
        fullName: "Mohammed Anvar",
        gender: "Male",
        profileId: "prof_user_anvar",
        favorites: ["prof_1", "prof_3", "prof_5"],
        isPaid: false,
        paymentProof: "",
        paymentProofStatus: "none",
        revealedProfileIds: []
      });

      inMemoryMessages.length = 0;
      inMemoryMessages.push(
        {
          id: "msg_init_1",
          senderId: "prof_1",
          receiverId: "user_anvar",
          content: "Assalamu Alaikum. I saw your profile and found it matching. Would love to know more about your family background.",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          isRead: false
        },
        {
          id: "msg_init_2",
          senderId: "user_anvar",
          receiverId: "prof_1",
          content: "Walaikum Assalam, Fathima. Thank you for reaching out. Yes, we belong to Manjeri, Malappuram. My family values are traditional yet moderate.",
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          isRead: true
        },
        {
          id: "msg_init_3",
          senderId: "prof_1",
          receiverId: "user_anvar",
          content: "That sounds wonderful. My family is from Kondotty, so we are quite close geographically. Let's discuss further.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false
        },
        {
          id: "msg_init_4",
          senderId: "prof_3",
          receiverId: "user_anvar",
          content: "Hi Anvar, saw your profile. Do you prefer someone settled in Ernakulam, or are you open to moving?",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          isRead: true
        }
      );
    }

    // Now seed it!
    await seedDatabaseIfEmpty();

    res.json({ success: true, message: "Database reset to defaults successfully!" });
  } catch (error: any) {
    console.error("Error during database reset:", error);
    res.status(500).json({ error: error.message || "Failed to reset database" });
  }
});


// Start server function incorporating Vite middleware and Firestore seeding
async function startServer() {
  // Verify database permissions and disable if unauthorized to avoid terminal errors
  if (db) {
    try {
      console.log("Verifying Firestore permissions on startup...");
      await db.collection("profiles").limit(1).get();
      console.log("Firestore permissions verified successfully!");
    } catch (dbError: any) {
      console.warn("\n=====================================================================");
      console.warn("⚠️  FIRESTORE PERMISSION WARNING ⚠️");
      console.warn("Reason:", dbError.message);
      console.warn("Action: Active Firestore connection is suspended. The server will");
      console.warn("seamlessly use the fully-featured local in-memory store instead.");
      console.warn("=====================================================================\n");
      db = null; // Disable active Firestore to bypass failing queries and eliminate error logs
    }
  }

  // Seed database if empty
  await seedDatabaseIfEmpty();

  // Load promotional configuration
  await loadPromoConfig();

  // Load OTP configuration
  await loadOtpConfig();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
