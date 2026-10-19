import fs from "fs/promises";
import path from "path";
import type { Listing, ContactRecord, UserProfile, ReportRecord } from "../types/index.ts";
import { SEED_LISTINGS } from "../data/seed.ts";

const DATA_DIR = path.join(process.cwd(), "data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Memory cache for zero-downtime read-only fallback when DB is unreachable
let cachedListings: Listing[] = [...SEED_LISTINGS];
let isDatabaseDown = false;

export function isDbFallbackActive(): boolean {
  return isDatabaseDown;
}

async function ensureLocalDb(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      await fs.access(LISTINGS_FILE);
    } catch {
      await fs.writeFile(LISTINGS_FILE, JSON.stringify(SEED_LISTINGS, null, 2), "utf-8");
    }

    try {
      await fs.access(CONTACTS_FILE);
    } catch {
      await fs.writeFile(CONTACTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }

    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
    }

    try {
      await fs.access(REPORTS_FILE);
    } catch {
      await fs.writeFile(REPORTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err: unknown) {
    console.error("Local DB initialization fallback:", err);
  }
}

// Supabase PostgREST Client Helper
async function supabaseRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { data: null, error: new Error("Supabase credentials not configured") };
  }

  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${endpoint}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: new Error(`Supabase error ${res.status}: ${errText}`) };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { data: null, error };
  }
}

/* ================= LISTINGS ================= */

export async function getListings(authenticated: boolean = false): Promise<Listing[]> {
  const now = new Date();

  // Try Supabase if configured
  if (SUPABASE_URL && SUPABASE_KEY) {
    const { data, error } = await supabaseRequest<Listing[]>("listings?order=created_at.desc");
    if (!error && data) {
      isDatabaseDown = false;
      cachedListings = data;
      const processed = data.map((l) => {
        if (l.status === "open" && new Date(l.expiresAt) < now) {
          return { ...l, status: "expired" as const };
        }
        return l;
      });

      const visible = processed.filter((l) => l.status !== "hidden");
      if (authenticated) return visible;

      return visible.map((l) => ({
        ...l,
        ownerEmail: maskEmail(l.ownerEmail),
      }));
    } else {
      isDatabaseDown = true;
    }
  }

  // Fallback to local storage
  await ensureLocalDb();
  try {
    const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
    const data: Listing[] = JSON.parse(raw);

    const processed = data.map((l) => {
      if (l.status === "open" && new Date(l.expiresAt) < now) {
        return { ...l, status: "expired" as const };
      }
      return l;
    });

    const visible = processed.filter((l) => l.status !== "hidden");
    const sorted = visible.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    cachedListings = sorted;
    isDatabaseDown = false;

    if (authenticated) {
      return sorted;
    }

    return sorted.map((l) => ({
      ...l,
      ownerEmail: maskEmail(l.ownerEmail),
    }));
  } catch (err: unknown) {
    console.error("Database reading error, using cached read-only fallback:", err);
    isDatabaseDown = true;
    if (authenticated) return cachedListings;
    return cachedListings.map((l) => ({ ...l, ownerEmail: maskEmail(l.ownerEmail) }));
  }
}

export async function getListingById(
  id: string,
  authenticated: boolean = false
): Promise<Listing | null> {
  const listings = await getListings(authenticated);
  return listings.find((l) => l.id === id) || null;
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

  if (SUPABASE_URL && SUPABASE_KEY) {
    const { data: created, error } = await supabaseRequest<Listing[]>("listings", {
      method: "POST",
      body: JSON.stringify(newListing),
    });
    if (!error && created && created.length > 0) {
      return created[0];
    }
  }

  await ensureLocalDb();
  const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(raw);
  listings.unshift(newListing);
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");
  return newListing;
}

export async function updateListingStatus(
  id: string,
  ownerEmail: string,
  status: "open" | "filled" | "renew"
): Promise<{ success: boolean; listing?: Listing; error?: string }> {
  await ensureLocalDb();
  const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(raw);

  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  // Strict IDOR Protection: only verified creator can update
  if (listings[index].ownerEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
    return { success: false, error: "Only the verified creator can update this listing" };
  }

  if (status === "renew") {
    listings[index].status = "open";
    listings[index].expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    listings[index].status = status;
  }

  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");

  if (SUPABASE_URL && SUPABASE_KEY) {
    await supabaseRequest(`listings?id=eq.${id}&owner_email=eq.${encodeURIComponent(ownerEmail)}`, {
      method: "PATCH",
      body: JSON.stringify(listings[index]),
    });
  }

  return { success: true, listing: listings[index] };
}

export async function deleteListing(
  id: string,
  ownerEmail: string
): Promise<{ success: boolean; error?: string }> {
  await ensureLocalDb();
  const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(raw);

  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  // Strict IDOR Protection: only verified creator can delete
  if (listings[index].ownerEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
    return { success: false, error: "Only the verified creator can delete this listing" };
  }

  listings.splice(index, 1);
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");

  if (SUPABASE_URL && SUPABASE_KEY) {
    await supabaseRequest(`listings?id=eq.${id}&owner_email=eq.${encodeURIComponent(ownerEmail)}`, {
      method: "DELETE",
    });
  }

  return { success: true };
}

/* ================= CONTACTS & 10/DAY RATE LIMITING ================= */

export async function recordContact(
  fromUserEmail: string,
  listingId: string
): Promise<{ success: boolean; error?: string; remainingToday?: number }> {
  await ensureLocalDb();
  const raw = await fs.readFile(CONTACTS_FILE, "utf-8");
  const contacts: ContactRecord[] = JSON.parse(raw);

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const contactsInLast24h = contacts.filter(
    (c) =>
      c.fromUserEmail.toLowerCase() === fromUserEmail.toLowerCase() &&
      new Date(c.createdAt) > oneDayAgo
  );

  if (contactsInLast24h.length >= 10) {
    return {
      success: false,
      error: "Daily outreach limit reached (10/day). This protects creators from mass inquiries.",
      remainingToday: 0,
    };
  }

  const record: ContactRecord = {
    id: `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    fromUserEmail,
    listingId,
    createdAt: now.toISOString(),
  };

  contacts.push(record);
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");

  if (SUPABASE_URL && SUPABASE_KEY) {
    await supabaseRequest("contacts", {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  return {
    success: true,
    remainingToday: 9 - contactsInLast24h.length,
  };
}

export async function getContactedListings(fromUserEmail: string): Promise<Listing[]> {
  await ensureLocalDb();
  try {
    const rawContacts = await fs.readFile(CONTACTS_FILE, "utf-8");
    const contacts: ContactRecord[] = JSON.parse(rawContacts);
    const userContactListingIds = new Set(
      contacts
        .filter((c) => c.fromUserEmail.toLowerCase() === fromUserEmail.toLowerCase())
        .map((c) => c.listingId)
    );

    const rawListings = await fs.readFile(LISTINGS_FILE, "utf-8");
    const listings: Listing[] = JSON.parse(rawListings);

    return listings.filter((l) => userContactListingIds.has(l.id));
  } catch {
    return [];
  }
}

/* ================= USERS & GDPR/DPDP DATA PRIVACY ================= */

export async function upsertUser(user: UserProfile): Promise<UserProfile> {
  await ensureLocalDb();
  const raw = await fs.readFile(USERS_FILE, "utf-8");
  const users: UserProfile[] = JSON.parse(raw);

  const index = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (index !== -1) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }

  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  if (SUPABASE_URL && SUPABASE_KEY) {
    await supabaseRequest("users", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(user),
    });
  }

  return user;
}

export async function deleteUserData(userEmail: string): Promise<boolean> {
  await ensureLocalDb();
  const email = userEmail.toLowerCase();

  // 1. Remove user profile
  const rawUsers = await fs.readFile(USERS_FILE, "utf-8");
  const users: UserProfile[] = JSON.parse(rawUsers);
  const filteredUsers = users.filter((u) => u.email.toLowerCase() !== email);
  await fs.writeFile(USERS_FILE, JSON.stringify(filteredUsers, null, 2), "utf-8");

  // 2. Cascade delete all listings owned by user
  const rawListings = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(rawListings);
  const remainingListings = listings.filter((l) => l.ownerEmail.toLowerCase() !== email);
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(remainingListings, null, 2), "utf-8");

  // 3. Purge contact audit log for user
  const rawContacts = await fs.readFile(CONTACTS_FILE, "utf-8");
  const contacts: ContactRecord[] = JSON.parse(rawContacts);
  const remainingContacts = contacts.filter((c) => c.fromUserEmail.toLowerCase() !== email);
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(remainingContacts, null, 2), "utf-8");

  if (SUPABASE_URL && SUPABASE_KEY) {
    await supabaseRequest(`users?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" });
    await supabaseRequest(`listings?owner_email=eq.${encodeURIComponent(email)}`, { method: "DELETE" });
    await supabaseRequest(`contacts?from_user_email=eq.${encodeURIComponent(email)}`, { method: "DELETE" });
  }

  return true;
}

export interface ExportedData {
  exportedAt: string;
  profile: UserProfile | null;
  listings: Listing[];
  contactHistory: ContactRecord[];
}

export async function exportUserData(userEmail: string): Promise<ExportedData> {
  await ensureLocalDb();
  const email = userEmail.toLowerCase();

  const rawUsers = await fs.readFile(USERS_FILE, "utf-8");
  const users: UserProfile[] = JSON.parse(rawUsers);
  const profile = users.find((u) => u.email.toLowerCase() === email) || null;

  const rawListings = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(rawListings);
  const userListings = listings.filter((l) => l.ownerEmail.toLowerCase() === email);

  const rawContacts = await fs.readFile(CONTACTS_FILE, "utf-8");
  const contacts: ContactRecord[] = JSON.parse(rawContacts);
  const userContacts = contacts.filter((c) => c.fromUserEmail.toLowerCase() === email);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    listings: userListings,
    contactHistory: userContacts,
  };
}

/* ================= MODERATION & REPORTS ================= */

export async function createReport(
  report: Omit<ReportRecord, "id" | "status" | "createdAt">
): Promise<ReportRecord> {
  await ensureLocalDb();
  const raw = await fs.readFile(REPORTS_FILE, "utf-8");
  const reports: ReportRecord[] = JSON.parse(raw);

  const newReport: ReportRecord = {
    ...report,
    id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  reports.push(newReport);
  await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");

  if (SUPABASE_URL && SUPABASE_KEY) {
    await supabaseRequest("reports", {
      method: "POST",
      body: JSON.stringify(newReport),
    });
  }

  return newReport;
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••@gmail.com";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local}•••@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}
