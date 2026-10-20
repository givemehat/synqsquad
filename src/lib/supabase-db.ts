import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase.ts";
import type { Listing, ContactRecord, UserProfile, ReportRecord } from "../types/index.ts";
import { SEED_LISTINGS } from "../data/seed.ts";

export interface ExportedData {
  exportedAt: string;
  profile: UserProfile | null;
  listings: Listing[];
  contactHistory: ContactRecord[];
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••@gmail.com";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local}•••@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}

// Convert Postgres snake_case row to CamelCase Listing interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToListing(row: any, authenticated: boolean = false): Listing {
  const email = authenticated ? row.owner_email : maskEmail(row.owner_email);
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerEmail: email,
    ownerCollege: row.owner_college,
    ownerRole: row.owner_role,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localMockListings: any[] = [];
const localMockContacts: { id: string; fromUserEmail: string; listingId: string; createdAt: string }[] = [];

// ================= LISTINGS =================

export async function getListings(authenticated: boolean = false): Promise<Listing[]> {
  if (!isSupabaseConfigured()) {
    // Return combined mock and seed listings during local testing without remote database
    const dynamic = localMockListings.map((r) => rowToListing(r, authenticated));
    const seed = SEED_LISTINGS.map((l) => ({
      ...l,
      ownerEmail: authenticated ? l.ownerEmail : maskEmail(l.ownerEmail),
    }));
    return [...dynamic, ...seed];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .neq("status", "hidden")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase getListings error:", error.message);
    throw new Error(`Database unavailable: ${error.message}`);
  }

  const now = new Date();
  return (data || []).map((row) => {
    // Auto mark expired if past deadline
    let status = row.status;
    if (status === "open" && new Date(row.expires_at) < now) {
      status = "expired";
    }
    return rowToListing({ ...row, status }, authenticated);
  });
}

export async function getListingById(id: string, authenticated: boolean = false): Promise<Listing | null> {
  if (!isSupabaseConfigured()) {
    const seed = SEED_LISTINGS.find((l) => l.id === id);
    if (!seed) return null;
    return {
      ...seed,
      ownerEmail: authenticated ? seed.ownerEmail : maskEmail(seed.ownerEmail),
    };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToListing(data, authenticated);
}

export async function createListing(input: {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerCollege: string;
  ownerRole: string;
  ownerPhoto?: string;
  type: "hackathon" | "research" | "solo";
  title: string;
  event: string;
  deadline?: string;
  skillsNeeded: string[];
  slots: number;
  totalSlots: number;
  description: string;
}): Promise<Listing> {
  const id = `lst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newRow = {
    id,
    owner_id: input.ownerId,
    owner_name: input.ownerName,
    owner_email: input.ownerEmail.toLowerCase(),
    owner_college: input.ownerCollege || "Independent",
    owner_role: input.ownerRole || "Developer",
    owner_photo: input.ownerPhoto || null,
    type: input.type,
    title: input.title,
    event: input.event,
    deadline: input.deadline || "Upcoming",
    skills_needed: input.skillsNeeded,
    slots: input.slots,
    total_slots: input.totalSlots,
    description: input.description,
    status: "open",
    expires_at: expiresAt,
    created_at: now.toISOString(),
  };

  if (!isSupabaseConfigured()) {
    localMockListings.unshift(newRow);
    return rowToListing(newRow, true);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .insert([newRow])
    .select()
    .single();

  if (error) {
    console.error("Supabase createListing error:", error.message);
    throw new Error(`Failed to create listing in database: ${error.message}`);
  }

  return rowToListing(data, true);
}

export async function updateListingStatus(
  id: string,
  ownerEmail: string,
  status: "open" | "filled" | "expired" | "hidden"
): Promise<Listing | null> {
  const now = new Date();
  const email = ownerEmail.toLowerCase();

  if (!isSupabaseConfigured()) {
    const mock = localMockListings.find((l) => l.id === id);
    if (mock) {
      if (mock.owner_email.toLowerCase() !== email) return null;
      mock.status = status;
      return rowToListing(mock, true);
    }
    const seed = SEED_LISTINGS.find((l) => l.id === id);
    if (!seed) return null;
    if (seed.ownerEmail.toLowerCase() !== email) return null;
    return { ...seed, status };
  }

  const supabase = getSupabaseServerClient();
  // Fetch existing listing to verify ownership
  const { data: existing } = await supabase
    .from("listings")
    .select("owner_email, expires_at")
    .eq("id", id)
    .single();

  if (!existing || existing.owner_email.toLowerCase() !== email) {
    return null;
  }

  // If reopening, reset 30-day expiry
  const updatePayload: Record<string, unknown> = { status };
  if (status === "open" && new Date(existing.expires_at) < now) {
    updatePayload.expires_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from("listings")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return rowToListing(data, true);
}

export async function deleteListing(id: string, ownerEmail: string): Promise<boolean> {
  const email = ownerEmail.toLowerCase();

  if (!isSupabaseConfigured()) {
    const mockIdx = localMockListings.findIndex((l) => l.id === id);
    if (mockIdx !== -1) {
      if (localMockListings[mockIdx].owner_email.toLowerCase() !== email) {
        return false;
      }
      localMockListings.splice(mockIdx, 1);
      return true;
    }
    const seed = SEED_LISTINGS.find((l) => l.id === id);
    if (seed) {
      if (seed.ownerEmail.toLowerCase() !== email) {
        return false;
      }
      return true;
    }
    return false;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("owner_email", email);

  return !error;
}

// ================= CONTACTS & RATE LIMITING =================

export async function recordContact(
  fromUserEmail: string,
  listingId: string
): Promise<{ success: boolean; error?: string; remainingToday?: number }> {
  const email = fromUserEmail.toLowerCase();

  if (!isSupabaseConfigured()) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = localMockContacts.filter(
      (c) => c.fromUserEmail === email && new Date(c.createdAt) > oneDayAgo
    );
    if (recent.length >= 10) {
      return {
        success: false,
        error: "Daily outreach limit reached (10/day). This protects creators from mass inquiries.",
        remainingToday: 0,
      };
    }
    localMockContacts.push({
      id: `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      fromUserEmail: email,
      listingId,
      createdAt: new Date().toISOString(),
    });
    return {
      success: true,
      remainingToday: 9 - recent.length,
    };
  }

  const supabase = getSupabaseServerClient();

  // 1. Try atomic PostgreSQL RPC function (zero-race-condition rate limiting)
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "record_contact_rate_limited",
      {
        p_from_user_email: email,
        p_listing_id: listingId,
      }
    );

    if (!rpcError && rpcResult) {
      return rpcResult as { success: boolean; error?: string; remainingToday?: number };
    }
  } catch {
    // Fall back to direct query transaction if RPC is not compiled yet
  }

  // 2. Direct Query Transaction Fallback
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("from_user_email", email)
    .gte("created_at", oneDayAgo);

  if (countError) {
    throw new Error(`Failed to check contact limits: ${countError.message}`);
  }

  const contactsInLast24h = count || 0;
  if (contactsInLast24h >= 10) {
    return {
      success: false,
      error: "Daily outreach limit reached (10/day). This protects creators from mass inquiries.",
      remainingToday: 0,
    };
  }

  const contactId = `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const { error: insertError } = await supabase.from("contacts").insert([
    {
      id: contactId,
      from_user_email: email,
      listing_id: listingId,
      created_at: new Date().toISOString(),
    },
  ]);

  if (insertError) {
    throw new Error(`Failed to record contact: ${insertError.message}`);
  }

  return {
    success: true,
    remainingToday: 9 - contactsInLast24h,
  };
}

export async function getContactedListings(fromUserEmail: string): Promise<Listing[]> {
  const email = fromUserEmail.toLowerCase();
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data: contactRows, error: contactError } = await supabase
    .from("contacts")
    .select("listing_id")
    .eq("from_user_email", email);

  if (contactError || !contactRows || contactRows.length === 0) {
    return [];
  }

  const listingIds = contactRows.map((c) => c.listing_id);
  const { data: listingRows, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .in("id", listingIds);

  if (listingError || !listingRows) {
    return [];
  }

  return listingRows.map((r) => rowToListing(r, true));
}

// ================= USERS & COMPLIANCE =================

export async function upsertUser(user: UserProfile): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    return user;
  }

  const supabase = getSupabaseServerClient();
  const row = {
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase(),
    photo: user.photo || null,
    role: user.role,
    college: user.college,
    skills: user.skills,
    looking_for: user.lookingFor,
    bio: user.bio,
    consent_at: user.consentAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(row, { onConflict: "email" })
    .select()
    .single();

  if (error) {
    console.error("Supabase upsertUser error:", error.message);
    throw new Error(`Failed to save user: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    photo: data.photo || undefined,
    role: data.role,
    college: data.college,
    skills: data.skills || [],
    lookingFor: data.looking_for,
    bio: data.bio,
    consentAt: data.consent_at,
    createdAt: data.created_at,
  };
}

export async function deleteUserData(userEmail: string): Promise<boolean> {
  const email = userEmail.toLowerCase();
  if (!isSupabaseConfigured()) {
    return true;
  }

  const supabase = getSupabaseServerClient();

  // Try RPC cascade erasure
  try {
    const { data: rpcResult } = await supabase.rpc("delete_user_data_cascade", {
      p_user_email: email,
    });
    if (rpcResult === true) return true;
  } catch {}

  // Explicit fallback deletion
  await supabase.from("listings").delete().eq("owner_email", email);
  await supabase.from("contacts").delete().eq("from_user_email", email);
  await supabase.from("users").delete().eq("email", email);

  return true;
}

export async function exportUserData(userEmail: string): Promise<ExportedData> {
  const email = userEmail.toLowerCase();
  if (!isSupabaseConfigured()) {
    return {
      exportedAt: new Date().toISOString(),
      profile: null,
      listings: [],
      contactHistory: [],
    };
  }

  const supabase = getSupabaseServerClient();

  const [userRes, listingsRes, contactsRes] = await Promise.all([
    supabase.from("users").select("*").eq("email", email).maybeSingle(),
    supabase.from("listings").select("*").eq("owner_email", email),
    supabase.from("contacts").select("*").eq("from_user_email", email),
  ]);

  const profile = userRes.data
    ? {
        id: userRes.data.id,
        name: userRes.data.name,
        email: userRes.data.email,
        photo: userRes.data.photo || undefined,
        role: userRes.data.role,
        college: userRes.data.college,
        skills: userRes.data.skills || [],
        lookingFor: userRes.data.looking_for,
        bio: userRes.data.bio,
        consentAt: userRes.data.consent_at,
        createdAt: userRes.data.created_at,
      }
    : null;

  const listings = (listingsRes.data || []).map((r) => rowToListing(r, true));
  const contactHistory: ContactRecord[] = (contactsRes.data || []).map((c) => ({
    id: c.id,
    fromUserEmail: c.from_user_email,
    listingId: c.listing_id,
    createdAt: c.created_at,
  }));

  return {
    exportedAt: new Date().toISOString(),
    profile,
    listings,
    contactHistory,
  };
}

// ================= REPORTS =================

export async function createReport(report: {
  reporterEmail: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  details?: string;
}): Promise<ReportRecord> {
  const id = `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const reportRow = {
    id,
    reporter_email: report.reporterEmail.toLowerCase(),
    target_type: report.targetType,
    target_id: report.targetId,
    reason: report.reason,
    details: report.details || "",
    status: "pending" as const,
    created_at: now,
  };

  if (!isSupabaseConfigured()) {
    return {
      id,
      reporterEmail: report.reporterEmail.toLowerCase(),
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details || "",
      status: "pending" as const,
      createdAt: now,
    };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .insert([reportRow])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit report: ${error.message}`);
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
