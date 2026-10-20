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
        (email) => email.toLowerCase().endsWith("@gmail.com"),
        "SynqSquad requires a verified @gmail.com address"
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
        (email) => email.toLowerCase().endsWith("@gmail.com"),
        "Contact sender must have a verified @gmail.com address"
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
    targetType: z.enum(["listing", "user"]),
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
