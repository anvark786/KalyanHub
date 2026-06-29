/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Sect {
  Sunni_EK = "Sunni (E.K. faction)",
  Sunni_AP = "Sunni (A.P. faction)",
  Mujahid_KNM = "Mujahid (K.N.M.)",
  Mujahid_Wisdom = "Mujahid (Wisdom)",
  Jamaat = "Jama'at-e-Islami",
  General = "General Muslim",
}

export enum District {
  Malappuram = "Malappuram",
  Kozhikode = "Kozhikode",
  Kannur = "Kannur",
  Kasaragod = "Kasaragod",
  Wayanad = "Wayanad",
  Palakkad = "Palakkad",
  Thrissur = "Thrissur",
  Ernakulam = "Ernakulam",
  Alappuzha = "Alappuzha",
  Kottayam = "Kottayam",
  Idukki = "Idukki",
  Pathanamthitta = "Pathanamthitta",
  Kollam = "Kollam",
  Thiruvananthapuram = "Thiruvananthapuram",
  NRI_GCC = "NRI (GCC / Gulf)",
  NRI_Other = "NRI (US / UK / Europe)",
}

export enum EducationType {
  Doctor = "Doctor (MBBS/MD/BDS)",
  Engineer = "Engineer (B.Tech/M.Tech)",
  PostGraduate = "Post Graduate (MA/MSc/MCom/MBA/MCA)",
  Graduate = "Graduate (BA/BSc/BCom/BBA/BCA)",
  CharteredAccountant = "Chartered Accountant (CA/CMA)",
  PlusTwo = "Plus Two / Higher Secondary",
  SSLC = "SSLC / Tenth",
  Other = "Other Professional Degree",
}

export interface FamilyDetails {
  fatherName: string;
  fatherStatus?: "Alive" | "Passed Away";
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  familyStatus: "Middle Class" | "Upper Middle Class" | "Affluent";
  familyValues: "Orthodox" | "Traditional" | "Moderate" | "Liberal";
  siblingsDetails: string;
  nativePlace: string;
}

export interface PartnerPreference {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  districts?: District[];
  sects?: Sect[];
  educations?: EducationType[];
}

export interface Profile {
  id: string;
  profileCode?: string;
  fullName: string;
  gender: "Male" | "Female";
  age: number;
  height: number; // in cm
  weight: number; // in kg
  district: District;
  sect: Sect;
  education: EducationType;
  educationDetails: string;
  occupation: string;
  company?: string;
  incomeRange: string;
  aboutMe: string;
  religiousPractice: "Very practicing" | "Practicing" | "Moderate" | "Liberal";
  hobbies: string[];
  photos: string[]; // urls or gradient/base64 representations
  isVerified: boolean;
  verifiedDate?: string;
  family: FamilyDetails;
  phone: string;
  email?: string;
  maritalStatus?: "Never Married" | "Divorced" | "Widowed" | "Awaiting Divorce" | "Separated";
  address?: string;
  profileFor?: "Self" | "Son" | "Daughter" | "Brother" | "Sister" | "Parent" | "Relative" | "Friend";
  isPhotoBlurred?: boolean;
  photoAccessApprovedUsers?: string[]; // list of profile IDs approved to view photos
  photoAccessRequestsReceived?: string[]; // list of profile IDs who requested photo access
  photoAccessRejectedUsers?: string[]; // list of profile IDs rejected
  isBlurred?: boolean;
  photoAccessRequested?: boolean;
  photoAccessApproved?: boolean;
  photoAccessRejected?: boolean;
  lastLoginAt?: string;
  status?: "Active" | "Inactive";
  inactiveReason?: string;
  partnerPreference?: PartnerPreference;
  createdAt?: string;
  isDeactivated?: boolean;
  isDeleted?: boolean;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  gender: "Male" | "Female";
  profileId?: string; // Links to their matrimony profile if created
  favorites: string[]; // List of profile IDs
  isPaid?: boolean;
  paymentProof?: string; // Base64 or filename
  paymentProofStatus?: "none" | "pending" | "approved" | "rejected";
  paymentProofSubmittedAt?: string;
  revealedProfileIds?: string[]; // list of profile IDs revealed
  isAdmin?: boolean;
  userType?: "standard" | "promotional";
  createdAt?: string;
  lastLoginAt?: string;
  isDeactivated?: boolean;
  isDeleted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatThread {
  otherUser: Profile;
  lastMessage?: Message;
  unreadCount: number;
}

export interface SearchFilters {
  gender?: "Male" | "Female";
  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;
  districts: District[];
  sects: Sect[];
  educations: EducationType[];
  isVerifiedOnly: boolean;
  searchQuery: string;
}
