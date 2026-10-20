import type {
  Listing,
  ContactRecord,
  UserProfile,
  ReportRecord,
  TalentProfile,
  OutreachRecord,
  AvailabilityStatus,
  LookingForType,
  ExperienceLevel,
} from "../types/index.ts";
import { SEED_LISTINGS } from "../data/seed.ts";
import { SEED_PEOPLE } from "../data/seed-people.ts";
import type { TalentProfileInput } from "./validations.ts";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "./supabase-server.ts";

export interface BlockRecord {
  id: string;
  blockerEmail: string;
  blockedEmail: string;
  createdAt: string;
}

export interface ExportedData {
  exportedAt: string;
  profile: UserProfile | null;
  talentProfile: TalentProfile | null;
  listings: Listing[];
  contactHistory: ContactRecord[];
  outreachHistory: OutreachRecord[];
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••@gmail.com";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local}•••@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}

// In-memory runtime store used ONLY when Supabase credentials are not configured (unit tests / local dev fallback)
// ZERO disk writes, ZERO JSON files, ZERO file system locks.
let inMemoryListings: Listing[] = [...SEED_LISTINGS];
let inMemoryContacts: ContactRecord[] = [];
let inMemoryUsers: UserProfile[] = [];
let inMemoryReports: ReportRecord[] = [];
let inMemoryBlocks: BlockRecord[] = [];
let inMemoryTalentProfiles: TalentProfile[] = [...SEED_PEOPLE];
let inMemoryOutreach: OutreachRecord[] = [];
const inMemoryAiUsage = new Map<string, { count: number; resetAt: number }>();

export function isDbFallbackActive(): boolean {
  return !isSupabaseServerConfigured();
}

/**
 * Reset in-memory database store (useful for clean unit testing)
 */
export function resetInMemoryStore(): void {
  inMemoryListings = [...SEED_LISTINGS];
  inMemoryContacts = [];
  inMemoryUsers = [];
  inMemoryReports = [];
  inMemoryBlocks = [];
  inMemoryTalentProfiles = [...SEED_PEOPLE];
  inMemoryOutreach = [];
  inMemoryAiUsage.clear();
}

// Helper to map Supabase snake_case rows to camelCase Listing interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToListing(row: any, authenticated: boolean = false): Listing {
  const email = authenticated ? row.owner_email : maskEmail(row.owner_email);
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerEmail: email,
    ownerCollege: row.owner_college || "Independent",
    ownerRole: row.owner_role || "Developer",
    ownerPhoto: row.owner_photo || undefined,
    type: row.type,
    title: row.title,
    event: row.event,
    deadline: row.deadline || "Upcoming",
    skillsNeeded: row.skills_needed || [],
    slots: row.slots,
    totalSlots: row.total_slots,
    description: row.description,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

interface TalentProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  headline: string;
  skills: string[];
  looking_for: LookingForType[];
  experience_level: ExperienceLevel;
  bio: string;
  github: string | null;
  portfolio: string | null;
  linkedin: string | null;
  availability: AvailabilityStatus;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to map Supabase snake_case rows to camelCase TalentProfile interface
function rowToTalentProfile(row: TalentProfileRow, authenticated: boolean = false): TalentProfile {
  const email = authenticated ? row.email : maskEmail(row.email);
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email,
    headline: row.headline,
    skills: row.skills || [],
    lookingFor: row.looking_for || [],
    experienceLevel: row.experience_level || "student",
    bio: row.bio || "",
    github: row.github || undefined,
    portfolio: row.portfolio || undefined,
    linkedin: row.linkedin || undefined,
    availability: row.availability || "open",
    visible: row.visible ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

/* ==============================================================================
   LISTINGS
   ============================================================================== */

export async function getListings(
  authenticated: boolean = false,
  viewerIdOrEmail?: string
): Promise<Listing[]> {
  const viewerEmail = viewerIdOrEmail?.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : undefined;
  const viewerId = viewerIdOrEmail && !viewerIdOrEmail.includes("@") ? viewerIdOrEmail : undefined;

  if (isSupabaseServerConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      // When unauthenticated, query safe public_listings view that masks emails in PostgreSQL
      const tableName = authenticated ? "listings" : "public_listings";
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .neq("status", "hidden")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const now = new Date();
        let rows = data || [];

        if (viewerEmail) {
          const blocked = await getBlockedUsers(viewerEmail);
          if (blocked.length > 0) {
            rows = rows.filter((r) => !blocked.includes(r.owner_email?.toLowerCase()));
          }
        }

        return rows.map((row) => {
          let status = row.status;
          if (status === "open" && new Date(row.expires_at) < now) {
            status = "expired";
          }
          const isOwner = Boolean(
            (viewerId && row.owner_id === viewerId) ||
            (viewerEmail && row.owner_email?.toLowerCase() === viewerEmail)
          );
          return rowToListing({ ...row, status }, authenticated || isOwner);
        });
      }
    } catch {
      // Graceful fallback to resilient in-memory store
    }
  }

  // In-memory fallback
  const now = new Date();
  const blockedUsers = viewerEmail
    ? inMemoryBlocks
        .filter((b) => b.blockerEmail.toLowerCase() === viewerEmail)
        .map((b) => b.blockedEmail.toLowerCase())
    : [];

  return inMemoryListings
    .filter((l) => l.status !== "hidden")
    .filter((l) => !blockedUsers.includes(l.ownerEmail.toLowerCase()))
    .map((l) => {
      let status = l.status;
      if (status === "open" && new Date(l.expiresAt) < now) {
        status = "expired";
      }
      const isOwner = Boolean(
        (viewerId && l.ownerId === viewerId) ||
        (viewerEmail && l.ownerEmail.toLowerCase() === viewerEmail)
      );
      return {
        ...l,
        status,
        ownerEmail: isOwner ? l.ownerEmail : maskEmail(l.ownerEmail),
      };
    });
}

export async function getListingById(
  id: string,
  authenticated: boolean = false,
  viewerId?: string
): Promise<Listing | null> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    const isOwner = Boolean(viewerId && data.owner_id === viewerId);
    return rowToListing(data, authenticated || isOwner);
  }

  // In-memory fallback
  const l = inMemoryListings.find((item) => item.id === id);
  if (!l) return null;
  const isOwner = viewerId && l.ownerId === viewerId;
  return {
    ...l,
    ownerEmail: isOwner || authenticated ? l.ownerEmail : maskEmail(l.ownerEmail),
  };
}

export async function createListing(
  data: Omit<Listing, "id" | "createdAt" | "status" | "expiresAt">
): Promise<Listing> {
  const id = `lst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newListing: Listing = {
    ...data,
    id,
    status: "open",
    expiresAt,
    createdAt: now.toISOString(),
  };

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data: created, error } = await supabase
      .from("listings")
      .insert({
        id: newListing.id,
        owner_id: newListing.ownerId,
        owner_name: newListing.ownerName,
        owner_email: newListing.ownerEmail,
        owner_college: newListing.ownerCollege,
        owner_role: newListing.ownerRole,
        owner_photo: newListing.ownerPhoto || null,
        type: newListing.type,
        title: newListing.title,
        event: newListing.event,
        deadline: newListing.deadline,
        skills_needed: newListing.skillsNeeded,
        slots: newListing.slots,
        total_slots: newListing.totalSlots,
        description: newListing.description,
        status: newListing.status,
        expires_at: newListing.expiresAt,
        created_at: newListing.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase createListing error:", error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return rowToListing(created, true);
  }

  inMemoryListings.unshift(newListing);
  return newListing;
}

export async function updateListingStatus(
  id: string,
  ownerIdOrEmail: string,
  status: "open" | "filled" | "renew"
): Promise<{ success: boolean; listing?: Listing; error?: string }> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data: current, error: fetchErr } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Listing not found" };
    }

    const isOwner =
      current.owner_id === ownerIdOrEmail ||
      current.owner_email.toLowerCase() === ownerIdOrEmail.toLowerCase();

    if (!isOwner) {
      return { success: false, error: "Only the verified creator can update this listing" };
    }

    const updates: Record<string, unknown> = {
      status: status === "renew" ? "open" : status,
    };
    if (status === "renew") {
      updates.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data: updated, error: updateErr } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true, listing: rowToListing(updated, true) };
  }

  // In-memory fallback
  const index = inMemoryListings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  const isOwner =
    inMemoryListings[index].ownerId === ownerIdOrEmail ||
    inMemoryListings[index].ownerEmail.toLowerCase() === ownerIdOrEmail.toLowerCase();

  if (!isOwner) {
    return { success: false, error: "Only the verified creator can update this listing" };
  }

  if (status === "renew") {
    inMemoryListings[index].status = "open";
    inMemoryListings[index].expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    inMemoryListings[index].status = status;
  }

  return { success: true, listing: inMemoryListings[index] };
}

export async function deleteListing(
  id: string,
  ownerIdOrEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data: current, error: fetchErr } = await supabase
      .from("listings")
      .select("owner_id, owner_email")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Listing not found" };
    }

    const isOwner =
      current.owner_id === ownerIdOrEmail ||
      current.owner_email.toLowerCase() === ownerIdOrEmail.toLowerCase();

    if (!isOwner) {
      return { success: false, error: "Only the verified creator can delete this listing" };
    }

    const { error: delErr } = await supabase.from("listings").delete().eq("id", id);
    if (delErr) {
      return { success: false, error: delErr.message };
    }

    return { success: true };
  }

  // In-memory fallback
  const index = inMemoryListings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  const isOwner =
    inMemoryListings[index].ownerId === ownerIdOrEmail ||
    inMemoryListings[index].ownerEmail.toLowerCase() === ownerIdOrEmail.toLowerCase();

  if (!isOwner) {
    return { success: false, error: "Only the verified creator can delete this listing" };
  }

  inMemoryListings.splice(index, 1);
  return { success: true };
}

/* ==============================================================================
   CONTACTS & RATE-LIMITING
   ============================================================================== */

export async function recordContact(
  fromUserEmail: string,
  listingId: string
): Promise<{
  success: boolean;
  error?: string;
  remainingToday?: number;
  contactId?: string;
  recipientEmail?: string;
  recipientName?: string;
  event?: string;
  title?: string;
}> {
  const email = fromUserEmail.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    // Execute PostgreSQL atomic stored procedure with row-level transaction lock
    const { data, error } = await supabase.rpc("record_contact_rate_limited", {
      p_from_user_email: email,
      p_listing_id: listingId,
    });

    if (error) {
      console.error("Supabase recordContact RPC error:", error.message);
      return { success: false, error: error.message };
    }

    return data as {
      success: boolean;
      error?: string;
      remainingToday?: number;
      contactId?: string;
      recipientEmail?: string;
      recipientName?: string;
      event?: string;
      title?: string;
    };
  }

  // In-memory fallback with atomic verification
  const listing = inMemoryListings.find((l) => l.id === listingId);
  if (!listing) {
    return { success: false, error: "Listing not found" };
  }

  if (listing.status === "filled") {
    return { success: false, error: "This requisition has already been filled." };
  }

  if (listing.status === "expired" || new Date(listing.expiresAt) < new Date()) {
    return { success: false, error: "This requisition has expired." };
  }

  // Check UGC Block
  const isBlocked = inMemoryBlocks.some(
    (b) =>
      (b.blockerEmail.toLowerCase() === email && b.blockedEmail.toLowerCase() === listing.ownerEmail.toLowerCase()) ||
      (b.blockerEmail.toLowerCase() === listing.ownerEmail.toLowerCase() && b.blockedEmail.toLowerCase() === email)
  );
  if (isBlocked) {
    return { success: false, error: "You cannot contact this user." };
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentContacts = inMemoryContacts.filter(
    (c) => c.fromUserEmail.toLowerCase() === email && c.createdAt >= oneDayAgo
  );

  if (recentContacts.length >= 10) {
    return {
      success: false,
      error: "Daily outreach limit reached (10/day). This protects creators from mass inquiries.",
      remainingToday: 0,
    };
  }

  const contactRecord: ContactRecord = {
    id: `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    fromUserEmail: email,
    listingId,
    createdAt: new Date().toISOString(),
  };

  inMemoryContacts.push(contactRecord);

  return {
    success: true,
    remainingToday: 9 - recentContacts.length,
    contactId: contactRecord.id,
    recipientEmail: listing.ownerEmail,
    recipientName: listing.ownerName,
    event: listing.event,
    title: listing.title,
  };
}

export async function getContactedListings(
  userEmail: string
): Promise<Listing[]> {
  const email = userEmail.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data: contacts, error: contactErr } = await supabase
      .from("contacts")
      .select("listing_id")
      .eq("from_user_email", email);

    if (contactErr || !contacts || contacts.length === 0) {
      return [];
    }

    const listingIds = contacts.map((c) => c.listing_id);
    const { data: listings, error: listErr } = await supabase
      .from("listings")
      .select("*")
      .in("id", listingIds);

    if (listErr || !listings) return [];
    return listings.map((row) => rowToListing(row, true));
  }

  // In-memory fallback
  const userContactListingIds = new Set(
    inMemoryContacts
      .filter((c) => c.fromUserEmail.toLowerCase() === email)
      .map((c) => c.listingId)
  );

  return inMemoryListings.filter((l) => userContactListingIds.has(l.id));
}

/* ==============================================================================
   USERS & PRIVACY (GDPR / DPDP)
   ============================================================================== */

export async function upsertUser(user: UserProfile): Promise<UserProfile> {
  const sanitized = {
    ...user,
    email: user.email.toLowerCase().trim(),
  };

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: sanitized.id,
          name: sanitized.name,
          email: sanitized.email,
          photo: sanitized.photo || null,
          role: sanitized.role,
          college: sanitized.college,
          skills: sanitized.skills,
          looking_for: sanitized.lookingFor,
          bio: sanitized.bio,
          consent_at: sanitized.consentAt,
          created_at: sanitized.createdAt,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase upsertUser error:", error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      photo: data.photo || undefined,
      role: data.role,
      college: data.college,
      skills: data.skills,
      lookingFor: data.looking_for,
      bio: data.bio,
      consentAt: data.consent_at,
      createdAt: data.created_at,
    };
  }

  const index = inMemoryUsers.findIndex((u) => u.id === sanitized.id || u.email === sanitized.email);
  if (index !== -1) {
    inMemoryUsers[index] = { ...inMemoryUsers[index], ...sanitized };
  } else {
    inMemoryUsers.push(sanitized);
  }
  return sanitized;
}

export async function getUserProfile(userId: string, userEmail?: string): Promise<UserProfile | null> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const query = supabase.from("users").select("*");
    if (userId) query.eq("id", userId);
    else if (userEmail) query.eq("email", userEmail.toLowerCase().trim());

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      photo: data.photo || undefined,
      role: data.role,
      college: data.college,
      skills: data.skills,
      lookingFor: data.looking_for,
      bio: data.bio,
      consentAt: data.consent_at,
      createdAt: data.created_at,
    };
  }

  const u = inMemoryUsers.find(
    (user) => user.id === userId || (userEmail && user.email.toLowerCase() === userEmail.toLowerCase())
  );
  return u || null;
}

export async function deleteUserData(userIdOrEmail: string, optionalEmail?: string): Promise<boolean> {
  const email = (optionalEmail || (userIdOrEmail.includes("@") ? userIdOrEmail : "")).toLowerCase().trim();
  const userId = userIdOrEmail.includes("@") ? "" : userIdOrEmail;

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    if (email) {
      await supabase.rpc("delete_user_data_cascade", { p_user_email: email });
    }
    if (userId) {
      await supabase.from("talent_profiles").delete().eq("user_id", userId);
      await supabase.from("outreach").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      await supabase.from("listings").delete().eq("owner_id", userId);
      await supabase.from("users").delete().eq("id", userId);
    }
    if (email) {
      await supabase.from("talent_profiles").delete().eq("email", email);
      await supabase.from("outreach").delete().or(`sender_email.eq.${email},recipient_email.eq.${email}`);
      await supabase.from("contacts").delete().eq("from_user_email", email);
      await supabase.from("blocks").delete().or(`blocker_email.eq.${email},blocked_email.eq.${email}`);
      await supabase.from("reports").delete().eq("reporter_email", email);
      await supabase.from("users").delete().eq("email", email);
    }
    return true;
  }

  // In-memory cascade delete
  inMemoryTalentProfiles = inMemoryTalentProfiles.filter(
    (tp) => (!userId || tp.userId !== userId) && (!email || tp.email.toLowerCase() !== email)
  );
  inMemoryOutreach = inMemoryOutreach.filter(
    (o) =>
      (!userId || (o.senderId !== userId && o.recipientId !== userId)) &&
      (!email || (o.senderEmail.toLowerCase() !== email && o.recipientEmail.toLowerCase() !== email))
  );
  inMemoryUsers = inMemoryUsers.filter(
    (u) => (!userId || u.id !== userId) && (!email || u.email.toLowerCase() !== email)
  );
  inMemoryListings = inMemoryListings.filter(
    (l) => (!userId || l.ownerId !== userId) && (!email || l.ownerEmail.toLowerCase() !== email)
  );
  if (email) {
    inMemoryContacts = inMemoryContacts.filter((c) => c.fromUserEmail.toLowerCase() !== email);
    inMemoryBlocks = inMemoryBlocks.filter(
      (b) => b.blockerEmail.toLowerCase() !== email && b.blockedEmail.toLowerCase() !== email
    );
    inMemoryReports = inMemoryReports.filter((r) => r.reporterEmail.toLowerCase() !== email);
  }
  return true;
}

export async function exportUserData(userIdOrEmail: string, optionalEmail?: string): Promise<ExportedData> {
  const email = (optionalEmail || (userIdOrEmail.includes("@") ? userIdOrEmail : "")).toLowerCase().trim();
  const userId = userIdOrEmail.includes("@") ? "" : userIdOrEmail;

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const query = supabase.from("users").select("*");
    if (userId) query.eq("id", userId);
    else if (email) query.eq("email", email);

    const [profileRes, listingsRes, contactsRes, talentRes, outreachRes] = await Promise.all([
      query.maybeSingle(),
      userId
        ? supabase.from("listings").select("*").eq("owner_id", userId)
        : supabase.from("listings").select("*").eq("owner_email", email),
      email
        ? supabase.from("contacts").select("*").eq("from_user_email", email)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase.from("talent_profiles").select("*").eq("user_id", userId).maybeSingle()
        : email
        ? supabase.from("talent_profiles").select("*").eq("email", email).maybeSingle()
        : Promise.resolve({ data: null }),
      userId
        ? supabase.from("outreach").select("*").or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        : email
        ? supabase.from("outreach").select("*").or(`sender_email.eq.${email},recipient_email.eq.${email}`)
        : Promise.resolve({ data: [] }),
    ]);

    const profile = profileRes.data
      ? {
          id: profileRes.data.id,
          name: profileRes.data.name,
          email: profileRes.data.email,
          photo: profileRes.data.photo || undefined,
          role: profileRes.data.role,
          college: profileRes.data.college,
          skills: profileRes.data.skills,
          lookingFor: profileRes.data.looking_for,
          bio: profileRes.data.bio,
          consentAt: profileRes.data.consent_at,
          createdAt: profileRes.data.created_at,
        }
      : null;

    const talentProfile: TalentProfile | null = talentRes.data
      ? rowToTalentProfile(talentRes.data as TalentProfileRow, true)
      : null;

    const listings = (listingsRes.data || []).map((row) => rowToListing(row, true));
    const contactRows = (contactsRes.data || []) as Array<{
      id: string;
      from_user_email: string;
      listing_id: string;
      created_at: string;
    }>;
    const contactHistory: ContactRecord[] = contactRows.map((row) => ({
      id: row.id,
      fromUserEmail: row.from_user_email,
      listingId: row.listing_id,
      createdAt: row.created_at,
    }));

    const outreachRows = (outreachRes.data || []) as Array<Record<string, unknown>>;
    const outreachHistory: OutreachRecord[] = outreachRows.map((row) => ({
      id: String(row.id),
      senderId: String(row.sender_id),
      senderEmail: String(row.sender_email),
      senderName: String(row.sender_name),
      recipientId: String(row.recipient_id),
      recipientEmail: String(row.recipient_email),
      profileId: String(row.profile_id),
      listingId: row.listing_id ? String(row.listing_id) : undefined,
      message: String(row.message),
      status: row.status as "pending" | "accepted" | "declined",
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at || row.created_at),
    }));

    return {
      exportedAt: new Date().toISOString(),
      profile,
      talentProfile,
      listings,
      contactHistory,
      outreachHistory,
    };
  }

  const profile =
    inMemoryUsers.find(
      (u) => (userId && u.id === userId) || (email && u.email.toLowerCase() === email)
    ) || null;
  const talentProfile =
    inMemoryTalentProfiles.find(
      (tp) => (userId && tp.userId === userId) || (email && tp.email.toLowerCase() === email)
    ) || null;
  const listings = inMemoryListings.filter(
    (l) => (userId && l.ownerId === userId) || (email && l.ownerEmail.toLowerCase() === email)
  );
  const contactHistory = inMemoryContacts.filter(
    (c) => email && c.fromUserEmail.toLowerCase() === email
  );
  const outreachHistory = inMemoryOutreach.filter(
    (o) =>
      (userId && (o.senderId === userId || o.recipientId === userId)) ||
      (email && (o.senderEmail.toLowerCase() === email || o.recipientEmail.toLowerCase() === email))
  );

  return {
    exportedAt: new Date().toISOString(),
    profile,
    talentProfile,
    listings,
    contactHistory,
    outreachHistory,
  };
}

/* ==============================================================================
   BLOCKS & MODERATION REPORTS
   ============================================================================== */

export async function getBlockedUsers(userEmail: string): Promise<string[]> {
  const email = userEmail.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_email")
      .eq("blocker_email", email);

    if (error || !data) return [];
    return data.map((b) => b.blocked_email);
  }

  return inMemoryBlocks
    .filter((b) => b.blockerEmail.toLowerCase() === email)
    .map((b) => b.blockedEmail.toLowerCase());
}

export async function blockUser(
  blockerEmail: string,
  blockedEmail: string
): Promise<{ success: boolean; error?: string }> {
  const blocker = blockerEmail.toLowerCase().trim();
  const blocked = blockedEmail.toLowerCase().trim();

  if (blocker === blocked) {
    return { success: false, error: "You cannot block yourself." };
  }

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("blocks").upsert(
      {
        id: `blk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        blocker_email: blocker,
        blocked_email: blocked,
        created_at: new Date().toISOString(),
      },
      { onConflict: "blocker_email,blocked_email" }
    );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const exists = inMemoryBlocks.some(
    (b) => b.blockerEmail === blocker && b.blockedEmail === blocked
  );
  if (!exists) {
    inMemoryBlocks.push({
      id: `blk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      blockerEmail: blocker,
      blockedEmail: blocked,
      createdAt: new Date().toISOString(),
    });
  }

  return { success: true };
}

export async function unblockUser(
  blockerEmail: string,
  blockedEmail: string
): Promise<{ success: boolean; error?: string }> {
  const blocker = blockerEmail.toLowerCase().trim();
  const blocked = blockedEmail.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_email", blocker)
      .eq("blocked_email", blocked);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  inMemoryBlocks = inMemoryBlocks.filter(
    (b) => !(b.blockerEmail === blocker && b.blockedEmail === blocked)
  );
  return { success: true };
}

export async function isUserBlocked(userA: string, userB: string): Promise<boolean> {
  const a = userA.toLowerCase().trim();
  const b = userB.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("blocks")
      .select("id")
      .or(`and(blocker_email.eq.${a},blocked_email.eq.${b}),and(blocker_email.eq.${b},blocked_email.eq.${a})`);
    return Boolean(data && data.length > 0);
  }

  return inMemoryBlocks.some(
    (item) =>
      (item.blockerEmail.toLowerCase() === a && item.blockedEmail.toLowerCase() === b) ||
      (item.blockerEmail.toLowerCase() === b && item.blockedEmail.toLowerCase() === a)
  );
}

export async function createReport(
  report: Omit<ReportRecord, "id" | "status" | "createdAt">
): Promise<ReportRecord> {
  const newReport: ReportRecord = {
    ...report,
    id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .insert({
        id: newReport.id,
        reporter_email: newReport.reporterEmail,
        target_type: newReport.targetType,
        target_id: newReport.targetId,
        reason: newReport.reason,
        details: newReport.details || "",
        status: newReport.status,
        created_at: newReport.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase createReport error:", error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      id: data.id,
      reporterEmail: data.reporter_email,
      targetType: data.target_type,
      targetId: data.target_id,
      reason: data.reason,
      details: data.details,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  inMemoryReports.push(newReport);
  return newReport;
}

export async function checkAiRateLimitDb(userEmail: string): Promise<{ allowed: boolean; remaining: number }> {
  const email = userEmail.toLowerCase().trim();
  const now = Date.now();
  const record = inMemoryAiUsage.get(email);

  if (!record || now > record.resetAt) {
    inMemoryAiUsage.set(email, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: 19 };
  }

  if (record.count >= 20) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: 20 - record.count };
}

/* ==============================================================================
   TALENT PROFILES ("OPEN-TO-COLLABORATE" AVAILABILITY CARDS)
   ============================================================================== */

export async function getTalentProfiles(
  authenticated: boolean = false,
  viewerIdOrEmail?: string,
  options?: {
    skills?: string[];
    lookingFor?: string;
    experienceLevel?: string;
    availability?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ profiles: TalentProfile[]; total: number }> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  if (isSupabaseServerConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const tableName = authenticated ? "talent_profiles" : "public_talent_profiles";
      let query = supabase.from(tableName).select("*", { count: "exact" });

      query = query.eq("visible", true).neq("availability", "hidden");

      if (options?.availability) {
        query = query.eq("availability", options.availability);
      }
      if (options?.experienceLevel) {
        query = query.eq("experience_level", options.experienceLevel);
      }
      if (options?.lookingFor) {
        query = query.contains("looking_for", [options.lookingFor]);
      }
      if (options?.skills && options.skills.length > 0) {
        query = query.overlaps("skills", options.skills);
      }
      if (options?.search) {
        query = query.or(
          `display_name.ilike.%${options.search}%,headline.ilike.%${options.search}%,bio.ilike.%${options.search}%`
        );
      }

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (!error && data && data.length > 0) {
        let rows = data as TalentProfileRow[];
        if (viewerIdOrEmail && rows.length > 0) {
          const viewerEmail = viewerIdOrEmail.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : undefined;
          if (viewerEmail) {
            const blockedUsers = await getBlockedUsers(viewerEmail);
            rows = rows.filter((r) => !blockedUsers.includes(r.email.toLowerCase()));
          }
        }

        return {
          profiles: rows.map((r) => rowToTalentProfile(r, authenticated)),
          total: count || rows.length,
        };
      }
    } catch {
      // In-memory fallback
    }
  }

  // In-memory fallback
  let list = inMemoryTalentProfiles.filter(
    (p) => p.visible !== false && p.availability !== "hidden"
  );

  if (viewerIdOrEmail) {
    const viewerEmail = viewerIdOrEmail.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : "";
    if (viewerEmail) {
      list = list.filter((p) => {
        const isBlocked = inMemoryBlocks.some(
          (b) =>
            (b.blockerEmail.toLowerCase() === viewerEmail && b.blockedEmail.toLowerCase() === p.email.toLowerCase()) ||
            (b.blockerEmail.toLowerCase() === p.email.toLowerCase() && b.blockedEmail.toLowerCase() === viewerEmail)
        );
        return !isBlocked;
      });
    }
  }

  if (options?.availability) {
    list = list.filter((p) => p.availability === options.availability);
  }
  if (options?.experienceLevel) {
    list = list.filter((p) => p.experienceLevel === options.experienceLevel);
  }
  if (options?.lookingFor) {
    list = list.filter((p) => p.lookingFor.includes(options.lookingFor as LookingForType));
  }
  if (options?.skills && options.skills.length > 0) {
    const filterSkills = options.skills.map((s) => s.toLowerCase());
    list = list.filter((p) =>
      p.skills.some((s) => filterSkills.includes(s.toLowerCase()))
    );
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);

  return {
    profiles: paginated.map((p) => ({
      ...p,
      email: authenticated ? p.email : maskEmail(p.email),
    })),
    total,
  };
}

export async function getTalentProfileById(
  id: string,
  authenticated: boolean = false,
  viewerIdOrEmail?: string
): Promise<TalentProfile | null> {
  if (isSupabaseServerConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const tableName = authenticated ? "talent_profiles" : "public_talent_profiles";
      const { data, error } = await supabase.from(tableName).select("*").eq("id", id).maybeSingle();

      if (!error && data) {
        if (viewerIdOrEmail) {
          const viewerEmail = viewerIdOrEmail.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : undefined;
          if (viewerEmail) {
            const isBlocked = await isUserBlocked(viewerEmail, data.email);
            if (isBlocked) return null;
          }
        }

        return rowToTalentProfile(data as TalentProfileRow, authenticated);
      }
    } catch {
      // In-memory fallback
    }
  }

  const profile = inMemoryTalentProfiles.find((p) => p.id === id);
  if (!profile) return null;

  if (viewerIdOrEmail) {
    const viewerEmail = viewerIdOrEmail.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : "";
    if (viewerEmail) {
      const isBlocked = inMemoryBlocks.some(
        (b) =>
          (b.blockerEmail.toLowerCase() === viewerEmail && b.blockedEmail.toLowerCase() === profile.email.toLowerCase()) ||
          (b.blockerEmail.toLowerCase() === profile.email.toLowerCase() && b.blockedEmail.toLowerCase() === viewerEmail)
      );
      if (isBlocked) return null;
    }
  }

  return {
    ...profile,
    email: authenticated ? profile.email : maskEmail(profile.email),
  };
}

export async function getTalentProfileByUserId(
  userId: string,
  authenticated: boolean = true
): Promise<TalentProfile | null> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return rowToTalentProfile(data as TalentProfileRow, authenticated);
  }

  const profile = inMemoryTalentProfiles.find((p) => p.userId === userId);
  if (!profile) return null;

  return {
    ...profile,
    email: authenticated ? profile.email : maskEmail(profile.email),
  };
}

export async function upsertTalentProfile(
  userId: string,
  userEmail: string,
  input: TalentProfileInput
): Promise<{ success: boolean; profile?: TalentProfile; error?: string }> {
  const email = userEmail.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();

    // Check if profile exists
    const { data: existing } = await supabase
      .from("talent_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const profileId = existing?.id || `prf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await supabase
      .from("talent_profiles")
      .upsert({
        id: profileId,
        user_id: userId,
        display_name: input.displayName,
        email,
        headline: input.headline,
        skills: input.skills,
        looking_for: input.lookingFor,
        experience_level: input.experienceLevel,
        bio: input.bio || "",
        github: input.github || null,
        portfolio: input.portfolio || null,
        linkedin: input.linkedin || null,
        availability: input.availability,
        visible: input.visible,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsertTalentProfile error:", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      profile: rowToTalentProfile(data as TalentProfileRow, true),
    };
  }

  // In-memory fallback
  const idx = inMemoryTalentProfiles.findIndex((p) => p.userId === userId || p.email.toLowerCase() === email);
  const now = new Date().toISOString();

  if (idx >= 0) {
    const updated: TalentProfile = {
      ...inMemoryTalentProfiles[idx],
      displayName: input.displayName,
      headline: input.headline,
      skills: input.skills,
      lookingFor: input.lookingFor,
      experienceLevel: input.experienceLevel,
      bio: input.bio || "",
      github: input.github || undefined,
      portfolio: input.portfolio || undefined,
      linkedin: input.linkedin || undefined,
      availability: input.availability,
      visible: input.visible,
      updatedAt: now,
    };
    inMemoryTalentProfiles[idx] = updated;
    return { success: true, profile: updated };
  }

  const created: TalentProfile = {
    id: `prf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    displayName: input.displayName,
    email,
    headline: input.headline,
    skills: input.skills,
    lookingFor: input.lookingFor,
    experienceLevel: input.experienceLevel,
    bio: input.bio || "",
    github: input.github || undefined,
    portfolio: input.portfolio || undefined,
    linkedin: input.linkedin || undefined,
    availability: input.availability,
    visible: input.visible,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryTalentProfiles.unshift(created);
  return { success: true, profile: created };
}

export async function updateTalentProfileVisibility(
  userId: string,
  visible: boolean,
  availability?: AvailabilityStatus
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = { visible, updated_at: new Date().toISOString() };
    if (availability) payload.availability = availability;

    const { error } = await supabase.from("talent_profiles").update(payload).eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const p = inMemoryTalentProfiles.find((tp) => tp.userId === userId);
  if (!p) return { success: false, error: "Profile not found" };

  p.visible = visible;
  if (availability) p.availability = availability;
  p.updatedAt = new Date().toISOString();
  return { success: true };
}

export async function deleteTalentProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("talent_profiles").delete().eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  inMemoryTalentProfiles = inMemoryTalentProfiles.filter((p) => p.userId !== userId);
  return { success: true };
}

/* ==============================================================================
   TWO-WAY OUTREACH (TEAM -> TALENT)
   ============================================================================== */

export async function recordOutreach(
  senderId: string,
  senderEmail: string,
  senderName: string,
  recipientId: string,
  profileId: string,
  listingId: string | undefined | null,
  message: string
): Promise<{ success: boolean; outreachId?: string; remainingToday?: number; error?: string }> {
  const email = senderEmail.toLowerCase().trim();

  // Self-outreach prevention
  if (senderId === recipientId) {
    return { success: false, error: "You cannot send outreach to your own talent profile." };
  }

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("record_outreach_rate_limited", {
      p_sender_id: senderId,
      p_sender_email: email,
      p_sender_name: senderName,
      p_recipient_id: recipientId,
      p_profile_id: profileId,
      p_listing_id: listingId || null,
      p_message: message,
    });

    if (error) {
      console.error("Supabase record_outreach_rate_limited error:", error.message);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; outreachId?: string; remainingToday?: number; error?: string };
  }

  // In-memory fallback
  const profile = inMemoryTalentProfiles.find((p) => p.id === profileId);
  if (!profile) return { success: false, error: "Talent profile not found." };
  if (!profile.visible || profile.availability === "hidden") {
    return { success: false, error: "This talent profile is currently hidden." };
  }
  if (profile.userId !== recipientId) {
    return { success: false, error: "Recipient mismatch." };
  }

  // Check block
  const isBlocked = inMemoryBlocks.some(
    (b) =>
      (b.blockerEmail.toLowerCase() === email && b.blockedEmail.toLowerCase() === profile.email.toLowerCase()) ||
      (b.blockerEmail.toLowerCase() === profile.email.toLowerCase() && b.blockedEmail.toLowerCase() === email)
  );
  if (isBlocked) {
    return { success: false, error: "Cannot contact this user." };
  }

  // Combined 10/day limit check
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentContacts = inMemoryContacts.filter(
    (c) => c.fromUserEmail.toLowerCase() === email && c.createdAt >= oneDayAgo
  ).length;
  const recentOutreach = inMemoryOutreach.filter(
    (o) => o.senderEmail.toLowerCase() === email && o.createdAt >= oneDayAgo
  ).length;

  if (recentContacts + recentOutreach >= 10) {
    return {
      success: false,
      error: "Daily outreach limit reached (10/day). This protects talent from mass messaging.",
      remainingToday: 0,
    };
  }

  const attachedListing = listingId ? inMemoryListings.find((l) => l.id === listingId) : undefined;

  const record: OutreachRecord = {
    id: `out-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    senderEmail: email,
    senderName,
    recipientId,
    recipientEmail: profile.email,
    profileId,
    listingId: listingId || undefined,
    listingTitle: attachedListing?.title,
    listingEvent: attachedListing?.event,
    message,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryOutreach.push(record);

  return {
    success: true,
    outreachId: record.id,
    remainingToday: 9 - (recentContacts + recentOutreach),
  };
}

export async function getOutreachForUser(
  userId: string,
  userEmail: string,
  direction: "incoming" | "outgoing" | "all" = "all"
): Promise<OutreachRecord[]> {
  const email = userEmail.toLowerCase().trim();

  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    let query = supabase.from("outreach").select("*, listings(title, event)");

    if (direction === "incoming") {
      query = query.or(`recipient_id.eq.${userId},recipient_email.eq.${email}`);
    } else if (direction === "outgoing") {
      query = query.or(`sender_id.eq.${userId},sender_email.eq.${email}`);
    } else {
      query = query.or(
        `sender_id.eq.${userId},recipient_id.eq.${userId},sender_email.eq.${email},recipient_email.eq.${email}`
      );
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getOutreachForUser error:", error.message);
      return [];
    }

    interface OutreachJoinedRow {
      id: string;
      sender_id: string;
      sender_email: string;
      sender_name: string;
      recipient_id: string;
      recipient_email: string;
      profile_id: string;
      listing_id?: string | null;
      listings?: { title?: string; event?: string } | null;
      message: string;
      status: "pending" | "accepted" | "declined";
      created_at: string;
      updated_at?: string;
    }

    return ((data || []) as OutreachJoinedRow[]).map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      senderEmail: row.status === "accepted" || row.sender_id === userId ? row.sender_email : maskEmail(row.sender_email),
      senderName: row.sender_name,
      recipientId: row.recipient_id,
      recipientEmail: row.status === "accepted" || row.recipient_id === userId ? row.recipient_email : maskEmail(row.recipient_email),
      profileId: row.profile_id,
      listingId: row.listing_id || undefined,
      listingTitle: row.listings?.title || undefined,
      listingEvent: row.listings?.event || undefined,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }));
  }

  // In-memory fallback
  let list = inMemoryOutreach;
  if (direction === "incoming") {
    list = list.filter((o) => o.recipientId === userId || o.recipientEmail.toLowerCase() === email);
  } else if (direction === "outgoing") {
    list = list.filter((o) => o.senderId === userId || o.senderEmail.toLowerCase() === email);
  } else {
    list = list.filter(
      (o) =>
        o.senderId === userId ||
        o.recipientId === userId ||
        o.senderEmail.toLowerCase() === email ||
        o.recipientEmail.toLowerCase() === email
    );
  }

  return list.map((o) => ({
    ...o,
    senderEmail: o.status === "accepted" || o.senderId === userId ? o.senderEmail : maskEmail(o.senderEmail),
    recipientEmail: o.status === "accepted" || o.recipientId === userId ? o.recipientEmail : maskEmail(o.recipientEmail),
  }));
}

export async function respondToOutreach(
  userId: string,
  outreachId: string,
  action: "accept" | "decline"
): Promise<{
  success: boolean;
  status?: string;
  senderEmail?: string;
  senderName?: string;
  recipientEmail?: string;
  error?: string;
}> {
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("respond_outreach", {
      p_user_id: userId,
      p_outreach_id: outreachId,
      p_action: action,
    });

    if (error) {
      console.error("Supabase respond_outreach error:", error.message);
      return { success: false, error: error.message };
    }

    return data as {
      success: boolean;
      status?: string;
      senderEmail?: string;
      senderName?: string;
      recipientEmail?: string;
      error?: string;
    };
  }

  // In-memory fallback
  const record = inMemoryOutreach.find((o) => o.id === outreachId);
  if (!record) return { success: false, error: "Outreach request not found." };
  if (record.recipientId !== userId) {
    return { success: false, error: "Unauthorized. Only the recipient can respond." };
  }
  if (record.status !== "pending") {
    return { success: false, error: "This request has already been resolved." };
  }

  record.status = action === "accept" ? "accepted" : "declined";
  record.updatedAt = new Date().toISOString();

  if (action === "accept") {
    return {
      success: true,
      status: "accepted",
      senderEmail: record.senderEmail,
      senderName: record.senderName,
      recipientEmail: record.recipientEmail,
    };
  }

  return { success: true, status: "declined" };
}
