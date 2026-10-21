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
import type { TalentProfileInput } from "./validations.ts";
import {
  getSupabaseAnonClient,
  getSupabaseUserClient,
  getSupabaseServerClient,
  isSupabaseServerConfigured,
} from "./supabase-server.ts";
import { getSupabaseAdminClient } from "./supabase-admin.ts";

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
   LISTINGS (Single Supabase Path)
   ============================================================================== */

export async function getListings(
  authenticated: boolean = false,
  viewerIdOrEmail?: string,
  userToken?: string
): Promise<Listing[]> {
  if (!isSupabaseServerConfigured()) {
    console.error("[Database Error] Supabase is not configured on server.");
    throw new Error("Database service unavailable. Please check system configuration.");
  }

  const viewerEmail = viewerIdOrEmail?.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : undefined;
  const viewerId = viewerIdOrEmail && !viewerIdOrEmail.includes("@") ? viewerIdOrEmail : undefined;

  // Use user client with RLS if token available, else anon client on public view
  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseAnonClient();
  const tableName = authenticated ? "listings" : "public_listings";

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .neq("status", "hidden")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Database Error] getListings failed:", error.message);
    throw new Error("Failed to load listings from database.");
  }

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

export async function getListingById(
  id: string,
  authenticated: boolean = false,
  viewerId?: string,
  userToken?: string
): Promise<Listing | null> {
  if (!isSupabaseServerConfigured()) {
    console.error("[Database Error] Supabase is not configured on server.");
    throw new Error("Database service unavailable. Please check system configuration.");
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[Database Error] getListingById error:", error.message);
    return null;
  }
  if (!data) return null;

  const isOwner = Boolean(viewerId && data.owner_id === viewerId);
  return rowToListing(data, authenticated || isOwner);
}

export async function createListing(
  data: Omit<Listing, "id" | "createdAt" | "status" | "expiresAt">,
  userToken?: string
): Promise<Listing> {
  if (!isSupabaseServerConfigured()) {
    console.error("[Database Error] Supabase is not configured on server.");
    throw new Error("Database service unavailable. Please check system configuration.");
  }

  const id = `lst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newListing = {
    id,
    owner_id: data.ownerId,
    owner_name: data.ownerName,
    owner_email: data.ownerEmail.toLowerCase().trim(),
    owner_college: data.ownerCollege,
    owner_role: data.ownerRole,
    owner_photo: data.ownerPhoto || null,
    type: data.type,
    title: data.title,
    event: data.event,
    deadline: data.deadline,
    skills_needed: data.skillsNeeded,
    slots: data.slots,
    total_slots: data.totalSlots,
    description: data.description,
    status: "open",
    expires_at: expiresAt,
    created_at: now.toISOString(),
  };

  // Defense in depth: Use user client with RLS if token provided, otherwise server client
  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("listings")
    .insert(newListing)
    .select()
    .single();

  if (error) {
    console.error("[Database Error] createListing error:", error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  return rowToListing(created, true);
}

export async function updateListingStatus(
  id: string,
  ownerIdOrEmail: string,
  status: "open" | "filled" | "renew",
  userToken?: string
): Promise<{ success: boolean; listing?: Listing; error?: string }> {
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

export async function deleteListing(
  id: string,
  ownerIdOrEmail: string,
  userToken?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

/* ==============================================================================
   CONTACTS & RATE-LIMITING (RPC with advisory locks)
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
  if (!isSupabaseServerConfigured()) {
    console.error("[Database Error] Supabase is not configured on server.");
    return { success: false, error: "Database service unavailable." };
  }

  const email = fromUserEmail.toLowerCase().trim();
  // Service role / admin client used specifically to execute SECURITY DEFINER RPC with advisory lock
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("record_contact_rate_limited", {
    p_from_user_email: email,
    p_listing_id: listingId,
  });

  if (error) {
    console.error("[Database Error] recordContact RPC error:", error.message);
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

export async function getContactedListings(
  userEmail: string,
  userToken?: string
): Promise<Listing[]> {
  if (!isSupabaseServerConfigured()) return [];

  const email = userEmail.toLowerCase().trim();
  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

/* ==============================================================================
   USERS & PRIVACY (GDPR / DPDP)
   ============================================================================== */

export async function upsertUser(
  user: UserProfile,
  userToken?: string
): Promise<UserProfile> {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Database service unavailable.");
  }

  const sanitized = {
    ...user,
    email: user.email.toLowerCase().trim(),
  };

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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
    console.error("[Database Error] upsertUser error:", error.message);
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

export async function getUserProfile(
  userId: string,
  userEmail?: string,
  userToken?: string
): Promise<UserProfile | null> {
  if (!isSupabaseServerConfigured()) return null;

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

/**
 * Administrative cascading deletion for GDPR / DPDP Act 2023 compliance.
 * AUDIT NOTE: Uses service-role client to cascade deletions across tables owned by the user.
 */
export async function deleteUserData(
  userIdOrEmail: string,
  optionalEmail?: string
): Promise<boolean> {
  if (!isSupabaseServerConfigured()) return false;

  const email = (optionalEmail || (userIdOrEmail.includes("@") ? userIdOrEmail : "")).toLowerCase().trim();
  const userId = userIdOrEmail.includes("@") ? "" : userIdOrEmail;

  // Uses isolated admin client with explicit authorization logging
  const adminClient = getSupabaseAdminClient();
  console.log(`[Audit Log] Admin cascade deletion requested for user id=${userId} email=${email}`);

  if (email) {
    try {
      await adminClient.rpc("delete_user_data_cascade", { p_user_email: email });
    } catch {
      // Fallback manual cascade if stored proc does not exist
    }
  }

  if (userId) {
    await adminClient.from("talent_profiles").delete().eq("user_id", userId);
    await adminClient.from("outreach").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    await adminClient.from("listings").delete().eq("owner_id", userId);
    await adminClient.from("users").delete().eq("id", userId);
  }

  if (email) {
    await adminClient.from("talent_profiles").delete().eq("email", email);
    await adminClient.from("outreach").delete().or(`sender_email.eq.${email},recipient_email.eq.${email}`);
    await adminClient.from("contacts").delete().eq("from_user_email", email);
    await adminClient.from("blocks").delete().or(`blocker_email.eq.${email},blocked_email.eq.${email}`);
    await adminClient.from("reports").delete().eq("reporter_email", email);
    await adminClient.from("users").delete().eq("email", email);
  }

  return true;
}

export async function exportUserData(
  userIdOrEmail: string,
  optionalEmail?: string,
  userToken?: string
): Promise<ExportedData> {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Database service unavailable.");
  }

  const email = (optionalEmail || (userIdOrEmail.includes("@") ? userIdOrEmail : "")).toLowerCase().trim();
  const userId = userIdOrEmail.includes("@") ? "" : userIdOrEmail;

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

/* ==============================================================================
   BLOCKS & MODERATION REPORTS
   ============================================================================== */

export async function getBlockedUsers(
  userEmail: string,
  userToken?: string
): Promise<string[]> {
  if (!isSupabaseServerConfigured()) return [];

  const email = userEmail.toLowerCase().trim();
  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_email")
    .eq("blocker_email", email);

  if (error || !data) return [];
  return data.map((b) => b.blocked_email);
}

export async function blockUser(
  blockerEmail: string,
  blockedEmail: string,
  userToken?: string
): Promise<{ success: boolean; error?: string }> {
  const blocker = blockerEmail.toLowerCase().trim();
  const blocked = blockedEmail.toLowerCase().trim();

  if (blocker === blocked) {
    return { success: false, error: "You cannot block yourself." };
  }

  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

export async function unblockUser(
  blockerEmail: string,
  blockedEmail: string,
  userToken?: string
): Promise<{ success: boolean; error?: string }> {
  const blocker = blockerEmail.toLowerCase().trim();
  const blocked = blockedEmail.toLowerCase().trim();

  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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

export async function isUserBlocked(userA: string, userB: string): Promise<boolean> {
  const a = userA.toLowerCase().trim();
  const b = userB.toLowerCase().trim();

  if (!isSupabaseServerConfigured()) return false;

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("blocks")
    .select("id")
    .or(`and(blocker_email.eq.${a},blocked_email.eq.${b}),and(blocker_email.eq.${b},blocked_email.eq.${a})`);

  return Boolean(data && data.length > 0);
}

/**
 * Creates user report.
 * AUDIT NOTE: Uses admin client to insert into reports table because select is revoked from public.
 */
export async function createReport(
  report: Omit<ReportRecord, "id" | "status" | "createdAt">
): Promise<ReportRecord> {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Database service unavailable.");
  }

  const newReport = {
    id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    reporter_email: report.reporterEmail.toLowerCase().trim(),
    target_type: report.targetType,
    target_id: report.targetId,
    reason: report.reason,
    details: report.details || "",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("reports")
    .insert(newReport)
    .select()
    .single();

  if (error) {
    console.error("[Database Error] createReport error:", error.message);
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

/* ==============================================================================
   TALENT PROFILES ("OPEN-TO-COLLABORATE" AVAILABILITY DIRECTORY)
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
  },
  userToken?: string
): Promise<{ profiles: TalentProfile[]; total: number }> {
  if (!isSupabaseServerConfigured()) {
    console.error("[Database Error] Supabase is not configured on server.");
    throw new Error("Database service unavailable. Please check system configuration.");
  }

  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseAnonClient();
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
  if (error) {
    console.error("[Database Error] getTalentProfiles error:", error.message);
    throw new Error("Failed to load talent profiles from database.");
  }

  let rows = (data || []) as TalentProfileRow[];
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

export async function getTalentProfileById(
  id: string,
  authenticated: boolean = false,
  viewerIdOrEmail?: string,
  userToken?: string
): Promise<TalentProfile | null> {
  if (!isSupabaseServerConfigured()) return null;

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseAnonClient();
  const tableName = authenticated ? "talent_profiles" : "public_talent_profiles";
  const { data, error } = await supabase.from(tableName).select("*").eq("id", id).maybeSingle();

  if (error || !data) return null;

  if (viewerIdOrEmail) {
    const viewerEmail = viewerIdOrEmail.includes("@") ? viewerIdOrEmail.toLowerCase().trim() : undefined;
    if (viewerEmail) {
      const isBlocked = await isUserBlocked(viewerEmail, data.email);
      if (isBlocked) return null;
    }
  }

  return rowToTalentProfile(data as TalentProfileRow, authenticated);
}

export async function getTalentProfileByUserId(
  userId: string,
  authenticated: boolean = true,
  userToken?: string
): Promise<TalentProfile | null> {
  if (!isSupabaseServerConfigured()) return null;

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
  const { data, error } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToTalentProfile(data as TalentProfileRow, authenticated);
}

export async function upsertTalentProfile(
  userId: string,
  userEmail: string,
  input: TalentProfileInput,
  userToken?: string
): Promise<{ success: boolean; profile?: TalentProfile; error?: string }> {
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const email = userEmail.toLowerCase().trim();
  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const profileId =
    existing?.id || `prf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

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
    console.error("[Database Error] upsertTalentProfile error:", error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    profile: rowToTalentProfile(data as TalentProfileRow, true),
  };
}

export async function updateTalentProfileVisibility(
  userId: string,
  visible: boolean,
  availability?: AvailabilityStatus,
  userToken?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
  const payload: Record<string, unknown> = { visible, updated_at: new Date().toISOString() };
  if (availability) payload.availability = availability;

  const { error } = await supabase.from("talent_profiles").update(payload).eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTalentProfile(
  userId: string,
  userToken?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
  const { error } = await supabase.from("talent_profiles").delete().eq("user_id", userId);
  if (error) return { success: false, error: error.message };
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
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const email = senderEmail.toLowerCase().trim();

  if (senderId === recipientId) {
    return { success: false, error: "You cannot send outreach to your own talent profile." };
  }

  // AUDIT NOTE: Atomic rate-limited outreach via advisory-lock stored procedure (SECURITY DEFINER)
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("record_outreach_rate_limited", {
    p_sender_id: senderId,
    p_sender_email: email,
    p_sender_name: senderName,
    p_recipient_id: recipientId,
    p_profile_id: profileId,
    p_listing_id: listingId || null,
    p_message: message,
  });

  if (error) {
    console.error("[Database Error] record_outreach_rate_limited error:", error.message);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; outreachId?: string; remainingToday?: number; error?: string };
}

export async function getOutreachForUser(
  userId: string,
  userEmail: string,
  direction: "incoming" | "outgoing" | "all" = "all",
  userToken?: string
): Promise<OutreachRecord[]> {
  if (!isSupabaseServerConfigured()) return [];

  const email = userEmail.toLowerCase().trim();
  const supabase = userToken ? getSupabaseUserClient(userToken) : getSupabaseServerClient();
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
    console.error("[Database Error] getOutreachForUser error:", error.message);
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
    senderEmail:
      row.status === "accepted" || row.sender_id === userId
        ? row.sender_email
        : maskEmail(row.sender_email),
    senderName: row.sender_name,
    recipientId: row.recipient_id,
    recipientEmail:
      row.status === "accepted" || row.recipient_id === userId
        ? row.recipient_email
        : maskEmail(row.recipient_email),
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
  if (!isSupabaseServerConfigured()) {
    return { success: false, error: "Database service unavailable." };
  }

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("respond_outreach", {
    p_user_id: userId,
    p_outreach_id: outreachId,
    p_action: action,
  });

  if (error) {
    console.error("[Database Error] respond_outreach error:", error.message);
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

// In-process rate limiting cache for AI requests (20 requests per 24 hours per user)
const aiUsageCache = new Map<string, { count: number; resetAt: number }>();

export async function checkAiRateLimitDb(userEmail: string): Promise<{ allowed: boolean; remaining: number }> {
  const email = userEmail.toLowerCase().trim();
  const now = Date.now();
  const record = aiUsageCache.get(email);

  if (!record || now > record.resetAt) {
    aiUsageCache.set(email, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: 19 };
  }

  if (record.count >= 20) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: 20 - record.count };
}

