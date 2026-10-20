export type ListingType = "hackathon" | "research" | "solo";

export type ListingStatus = "open" | "filled" | "expired" | "hidden";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
  college: string;
  skills: string[];
  lookingFor: "hackathon" | "research" | "both";
  bio: string;
  consentAt: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerCollege: string;
  ownerRole: string;
  ownerPhoto?: string;
  type: ListingType;
  title: string;
  event: string;
  deadline?: string;
  skillsNeeded: string[];
  slots: number;
  totalSlots: number;
  description: string;
  status: ListingStatus;
  expiresAt: string;
  createdAt: string;
}

export interface ContactRecord {
  id: string;
  fromUserEmail: string;
  listingId: string;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterEmail: string;
  targetType: "listing" | "user" | "profile";
  targetId: string;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

export type ScreenState =
  | "idle"
  | "loading"
  | "empty"
  | "no_results"
  | "error"
  | "offline"
  | "session_expired"
  | "rate_limited"
  | "permission_denied";

export type ExperienceLevel = "student" | "early-career" | "experienced";

export type LookingForType =
  | "hackathon"
  | "research"
  | "startup"
  | "project"
  | "mentor"
  | "open";

export type AvailabilityStatus = "open" | "busy" | "hidden";

export interface TalentProfile {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  headline: string;
  skills: string[];
  lookingFor: LookingForType[];
  experienceLevel: ExperienceLevel;
  bio: string;
  github?: string;
  portfolio?: string;
  linkedin?: string;
  availability: AvailabilityStatus;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OutreachStatus = "pending" | "accepted" | "declined";

export interface OutreachRecord {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  recipientId: string;
  recipientEmail: string;
  profileId: string;
  listingId?: string;
  listingTitle?: string;
  listingEvent?: string;
  message: string;
  status: OutreachStatus;
  createdAt: string;
  updatedAt: string;
}

