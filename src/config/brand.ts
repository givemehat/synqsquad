/**
 * Centralized Brand & Application Configuration for RIVQ / SynqSquad.
 * 
 * Changing brand name, domain, package id, or contact emails here
 * propagates across the web application and metadata.
 * 
 * NOTE: For Android TWA, android/app/build.gradle and strings.xml
 * must also be updated in lockstep prior to the first Google Play upload.
 */
export const BRAND_CONFIG = {
  name: "RIVQ",
  legalName: "RIVQ Technologies",
  shortName: "RIVQ",
  tagline: "Match & Connect on Gmail",
  description:
    "Find complementary hackathon teammates and research paper collaborators. Verified Google accounts only, direct peer-to-peer contact on Gmail.",
  productionDomain: "synqsquad.vercel.app",
  productionUrl: "https://synqsquad.vercel.app",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://synqsquad.vercel.app",
  androidPackageName: "com.rivq.app",
  supportEmail: "rajnishsingh.work@gmail.com",
  grievanceEmail: "rajnishsingh.work@gmail.com",
  themeColor: "#0c0e12",
  storagePrefix: "rivq",
  authEventName: "rivq_auth_change",
  legacyStoragePrefix: "synqsquad",
  legacyAuthEventName: "synqsquad_auth_change",
} as const;

export default BRAND_CONFIG;
