import fs from "fs/promises";
import path from "path";
import { Listing, ContactRecord, UserProfile } from "@/types";
import { SEED_LISTINGS } from "@/data/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

let isInitialized = false;

async function ensureDb(): Promise<void> {
  if (isInitialized) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Seed listings if missing
    try {
      await fs.access(LISTINGS_FILE);
    } catch {
      await fs.writeFile(LISTINGS_FILE, JSON.stringify(SEED_LISTINGS, null, 2), "utf-8");
    }

    // Seed contacts if missing
    try {
      await fs.access(CONTACTS_FILE);
    } catch {
      await fs.writeFile(CONTACTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }

    // Seed users if missing
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
    }

    isInitialized = true;
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

export async function getListings(authenticated: boolean = false): Promise<Listing[]> {
  await ensureDb();
  try {
    const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
    const data: Listing[] = JSON.parse(raw);
    const sorted = data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (authenticated) {
      return sorted;
    }

    // Mask emails for logged-out viewers (Privacy protection)
    return sorted.map((l) => ({
      ...l,
      ownerEmail: maskEmail(l.ownerEmail),
    }));
  } catch (err) {
    console.error("Error reading listings:", err);
    return SEED_LISTINGS;
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
  await ensureDb();
  const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(raw);

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

  listings.unshift(newListing);
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");
  return newListing;
}

export async function updateListingStatus(
  id: string,
  ownerEmail: string,
  status: "open" | "filled"
): Promise<{ success: boolean; listing?: Listing; error?: string }> {
  await ensureDb();
  const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(raw);

  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  // Verify owner
  if (listings[index].ownerEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
    return { success: false, error: "Only the verified creator can update this listing" };
  }

  listings[index].status = status;
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");
  return { success: true, listing: listings[index] };
}

export async function deleteListing(
  id: string,
  ownerEmail: string
): Promise<{ success: boolean; error?: string }> {
  await ensureDb();
  const raw = await fs.readFile(LISTINGS_FILE, "utf-8");
  const listings: Listing[] = JSON.parse(raw);

  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  if (listings[index].ownerEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
    return { success: false, error: "Only the verified creator can delete this listing" };
  }

  listings.splice(index, 1);
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2), "utf-8");
  return { success: true };
}

// Contact record & Abuse protection (10 connects / day)
export async function recordContact(
  fromUserEmail: string,
  listingId: string
): Promise<{ success: boolean; error?: string; remainingToday?: number }> {
  await ensureDb();
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
      error: "Daily limit reached. To prevent spam, you can connect with up to 10 creators per day.",
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

  return {
    success: true,
    remainingToday: 9 - contactsInLast24h.length,
  };
}

export async function getContactedListings(fromUserEmail: string): Promise<Listing[]> {
  await ensureDb();
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

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••@gmail.com";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local}•••@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}
