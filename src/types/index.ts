export type ListingType = "hackathon" | "research" | "solo_hacker";

export type ProjectDomain =
  | "AI & Machine Learning"
  | "Web3 & Blockchain"
  | "Full-Stack Web/Mobile"
  | "Healthcare & BioTech"
  | "Cybersecurity"
  | "Robotics & IoT"
  | "Climate & CleanTech"
  | "Fintech & Quant";

export type TeamStatus = "open" | "filled" | "closing_soon";

export interface ContactInfo {
  telegram?: string;
  discord?: string;
  whatsapp?: string;
  github?: string;
  linkedin?: string;
  email?: string;
}

export interface Listing {
  id: string;
  title: string;
  targetName: string; // e.g. "Smart India Hackathon 2026" or "NeurIPS 2026 Paper"
  type: ListingType;
  domain: ProjectDomain;
  creatorName: string;
  creatorRole: string;
  creatorAvatar?: string;
  location: string; // e.g. "Remote / Worldwide", "India / Hybrid", "San Francisco"
  description: string;
  rolesNeeded: string[]; // e.g. ["PyTorch Dev", "Next.js Frontend", "UI/UX Designer"]
  currentMembersCount: number;
  maxMembersCount: number;
  skills: string[];
  contact: ContactInfo;
  isBoosted: boolean;
  boostExpiresAt?: string;
  isVerifiedWinner?: boolean;
  prizeOrGrantPool?: string; // e.g. "$50,000" or "Published Co-Authorship"
  status: TeamStatus;
  views: number;
  managePin: string; // 6-digit secret PIN for zero-support editing
  createdAt: string;
  updatedAt: string;
}

export interface HackathonEvent {
  id: string;
  name: string;
  organizer: string;
  type: "hackathon" | "grant";
  mode: "Virtual" | "In-Person" | "Hybrid";
  prizePool: string;
  deadline: string;
  link: string;
  tags: string[];
}
