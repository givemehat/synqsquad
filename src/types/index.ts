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
  targetType: "listing" | "user";
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

