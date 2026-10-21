import { z } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const BANNED_SPAM_PATTERNS = [
  /t\.me\//i,
  /telegram/i,
  /discord\.gg/i,
  /chat\.whatsapp\.com/i,
  /wa\.me\//i,
  /whatsapp/i,
  /bit\.ly/i,
  /tinyurl\.com/i,
  /casino/i,
  /crypto\s*airdrop/i,
  /airdrop/i,
  /free\s*tokens/i,
];

/**
 * Enterprise XSS and injection sanitizer.
 * Neutralizes tags, event handlers, protocols, and control characters.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/\0/g, "") // Null bytes
    .replace(/[<>]/g, "") // Angle brackets
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/on\w+\s*=/gi, "") // Event handlers: onload=, onerror=, etc.
    .trim();
}

export function detectSpam(text: string): boolean {
  if (!text) return false;
  return BANNED_SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

// Zod schemas with .strict() to reject unknown fields & prevent mass assignment
export const listingInputSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(120, "Title must not exceed 120 characters")
      .transform(sanitizeText),
    event: z
      .string()
      .min(2, "Event must be at least 2 characters")
      .max(80, "Event must not exceed 80 characters")
      .transform(sanitizeText),
    type: z.enum(["hackathon", "research", "solo"]).default("hackathon"),
    deadline: z.string().max(40).optional().default("Upcoming"),
    skillsNeeded: z
      .array(z.string().min(1).max(40))
      .min(1, "At least one skill is required")
      .max(12, "Maximum 12 skills allowed"),
    slots: z.coerce.number().int().min(1).max(10).default(1),
    totalSlots: z.coerce.number().int().min(1).max(12).default(4),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(2000, "Description must not exceed 2000 characters")
      .transform(sanitizeText),
    ownerId: z.string().min(1),
    ownerName: z.string().min(2).max(80).transform(sanitizeText),
    ownerEmail: z
      .string()
      .email("A valid email address is required")
      .refine(
        (email) => {
          const lower = email.toLowerCase();
          return (
            lower.endsWith("@gmail.com") ||
            lower.endsWith(".ac.in") ||
            lower.endsWith(".edu") ||
            lower.endsWith(".edu.in") ||
            (process.env.NODE_ENV !== "production" && lower.endsWith("@example.com"))
          );
        },
        "SynqSquad requires a verified @gmail.com or university email address"
      )
      .transform((e) => e.toLowerCase().trim()),
    ownerCollege: z.string().max(100).optional().default("Independent").transform(sanitizeText),
    ownerRole: z.string().max(80).optional().default("Developer").transform(sanitizeText),
    ownerPhoto: z.string().url().optional().or(z.literal("")),
  })
  .strict();

export type ListingInput = z.infer<typeof listingInputSchema>;

export function validateListingInput(raw: unknown): ValidationResult<ListingInput> {
  const result = listingInputSchema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Invalid listing data";
    return { success: false, error: firstError };
  }

  // Spam content check (Telegram/Discord/WhatsApp/airdrop links)
  const combined = `${result.data.title} ${result.data.description}`;
  if (detectSpam(combined)) {
    return {
      success: false,
      error:
        "External chat invitations (Telegram/Discord/WhatsApp) or promotional links are prohibited. All collaboration occurs on verified Gmail.",
    };
  }

  return { success: true, data: result.data };
}

export const contactInputSchema = z
  .object({
    fromUserEmail: z
      .string()
      .email("Valid email required")
      .refine(
        (email) => {
          const lower = email.toLowerCase();
          return (
            lower.endsWith("@gmail.com") ||
            lower.endsWith(".ac.in") ||
            lower.endsWith(".edu") ||
            lower.endsWith(".edu.in") ||
            (process.env.NODE_ENV !== "production" && lower.endsWith("@example.com"))
          );
        },
        "Contact sender must have a verified @gmail.com or university email address"
      )
      .transform((e) => e.toLowerCase().trim()),
    listingId: z.string().min(1, "Listing ID is required"),
  })
  .strict();

export type ContactInput = z.infer<typeof contactInputSchema>;

export const reportInputSchema = z
  .object({
    reporterEmail: z
      .string()
      .email("Valid email required")
      .transform((e) => e.toLowerCase().trim()),
    targetType: z.enum(["listing", "user", "profile"]),
    targetId: z.string().min(1, "Target ID is required"),
    reason: z.string().min(3).max(100).transform(sanitizeText),
    details: z.string().max(1000).optional().default("").transform(sanitizeText),
  })
  .strict();

export type ReportInput = z.infer<typeof reportInputSchema>;

export const improveMessageSchema = z
  .object({
    userEmail: z
      .string()
      .email("Valid email required")
      .transform((e) => e.toLowerCase().trim()),
    message: z
      .string()
      .min(5, "Message must be at least 5 characters")
      .max(1000, "Input message must not exceed 1000 characters")
      .transform(sanitizeText),
    templateType: z.enum(["hackathon", "research", "skills", "casual"]).default("hackathon"),
    recipientName: z.string().max(80).transform(sanitizeText),
    event: z.string().max(80).transform(sanitizeText),
    userRole: z.string().max(80).optional().default("Developer").transform(sanitizeText),
    userSkills: z.array(z.string().max(40)).max(10).optional().default([]),
  })
  .strict();

export type ImproveMessageInput = z.infer<typeof improveMessageSchema>;

// Link format allow-list helpers
function isValidGithubLink(val?: string | null): boolean {
  if (!val || val.trim() === "") return true;
  const clean = val.trim();
  return /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/?$/i.test(clean) || /^[A-Za-z0-9_.-]+$/.test(clean);
}

function isValidLinkedinLink(val?: string | null): boolean {
  if (!val || val.trim() === "") return true;
  const clean = val.trim();
  return /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_.-]+\/?$/i.test(clean);
}

function isValidPortfolioLink(val?: string | null): boolean {
  if (!val || val.trim() === "") return true;
  const clean = val.trim();
  try {
    const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Talent Profile ("Availability Card") Zod schema
export const talentProfileInputSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(60, "Display name must not exceed 60 characters")
      .transform(sanitizeText),
    headline: z
      .string()
      .min(5, "Headline must be at least 5 characters")
      .max(120, "Headline must not exceed 120 characters")
      .transform(sanitizeText),
    skills: z
      .array(z.string().min(1).max(40))
      .min(1, "At least one skill is required")
      .max(15, "Maximum 15 skills allowed"),
    lookingFor: z
      .array(z.enum(["hackathon", "research", "startup", "project", "mentor", "open"]))
      .min(1, "Select at least one looking-for category")
      .max(6, "Maximum 6 looking-for categories"),
    experienceLevel: z.enum(["student", "early-career", "experienced"]).default("student"),
    bio: z
      .string()
      .max(500, "Bio must not exceed 500 characters")
      .default("")
      .transform(sanitizeText),
    github: z
      .string()
      .max(120)
      .optional()
      .nullable()
      .refine(isValidGithubLink, "GitHub link must be a valid GitHub profile URL or username")
      .transform((v) => (v ? sanitizeText(v) : undefined)),
    portfolio: z
      .string()
      .max(200)
      .optional()
      .nullable()
      .refine(isValidPortfolioLink, "Portfolio link must be a valid https URL")
      .transform((v) => (v ? sanitizeText(v) : undefined)),
    linkedin: z
      .string()
      .max(120)
      .optional()
      .nullable()
      .refine(isValidLinkedinLink, "LinkedIn link must be a valid LinkedIn profile URL")
      .transform((v) => (v ? sanitizeText(v) : undefined)),
    availability: z.enum(["open", "busy", "hidden"]).default("open"),
    visible: z.boolean().default(true),
  })
  .strict();

export type TalentProfileInput = z.infer<typeof talentProfileInputSchema>;

export function validateTalentProfileInput(raw: unknown): ValidationResult<TalentProfileInput> {
  const result = talentProfileInputSchema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Invalid profile data";
    return { success: false, error: firstError };
  }

  // Anti-spam check on headline and bio
  const combined = `${result.data.headline} ${result.data.bio}`;
  if (detectSpam(combined)) {
    return {
      success: false,
      error:
        "External chat invitations (Telegram/Discord/WhatsApp) or promotional links are prohibited. All collaboration occurs on verified Gmail.",
    };
  }

  return { success: true, data: result.data };
}

// Outreach (Team -> Person) Zod schema
export const outreachInputSchema = z
  .object({
    recipientId: z.string().min(1, "Recipient ID is required"),
    profileId: z.string().min(1, "Profile ID is required"),
    listingId: z.string().max(80).optional().nullable(),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(600, "Message must not exceed 600 characters")
      .transform(sanitizeText),
  })
  .strict();

export type OutreachInput = z.infer<typeof outreachInputSchema>;

export function validateOutreachInput(raw: unknown): ValidationResult<OutreachInput> {
  const result = outreachInputSchema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Invalid outreach data";
    return { success: false, error: firstError };
  }

  if (detectSpam(result.data.message)) {
    return {
      success: false,
      error:
        "External chat invitations (Telegram/Discord/WhatsApp) or promotional links are prohibited. All collaboration occurs on verified Gmail.",
    };
  }

  return { success: true, data: result.data };
}

export const outreachResponseSchema = z
  .object({
    action: z.enum(["accept", "decline"]),
  })
  .strict();

export type OutreachResponseInput = z.infer<typeof outreachResponseSchema>;
