export type ListingType = "hackathon" | "research" | "solo";

export type ListingStatus = "open" | "filled" | "expired";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: string; // e.g. "Frontend Engineer", "ML Researcher"
  college: string; // e.g. "IIT Delhi", "BITS Pilani"
  skills: string[];
  lookingFor: "hackathon" | "research" | "both";
  bio: string;
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
  event: string; // e.g. "Smart India Hackathon 2026", "NeurIPS Workshop"
  deadline?: string; // e.g. "Nov 30, 2026"
  skillsNeeded: string[];
  slots: number; // Open slots available
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
