import fs from "fs/promises";
import path from "path";
import { Listing } from "@/types";
import { SEED_LISTINGS } from "@/data/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "listings.json");

let isInitialized = false;

async function ensureDb(): Promise<void> {
  if (isInitialized) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // File does not exist, seed it
      await fs.writeFile(DB_FILE, JSON.stringify(SEED_LISTINGS, null, 2), "utf-8");
    }
    isInitialized = true;
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

export async function getListings(): Promise<Listing[]> {
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    const data: Listing[] = JSON.parse(raw);
    // Sort: Boosted first, then by createdAt desc
    return data.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (err) {
    console.error("Error reading listings:", err);
    return SEED_LISTINGS;
  }
}

export async function getListingById(id: string): Promise<Listing | null> {
  const listings = await getListings();
  const item = listings.find((l) => l.id === id);
  if (!item) return null;

  // Increment views asynchronously without blocking
  try {
    item.views = (item.views || 0) + 1;
    await saveListings(listings);
  } catch (e) {
    // non-fatal
  }

  return item;
}

export async function createListing(
  data: Omit<Listing, "id" | "views" | "createdAt" | "updatedAt">
): Promise<Listing> {
  const listings = await getListings();
  const id = `lst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newListing: Listing = {
    ...data,
    id,
    views: 1,
    createdAt: now,
    updatedAt: now,
  };

  listings.unshift(newListing);
  await saveListings(listings);
  return newListing;
}

export async function updateListing(
  id: string,
  pin: string,
  updates: Partial<Omit<Listing, "id" | "managePin" | "createdAt">>
): Promise<{ success: boolean; listing?: Listing; error?: string }> {
  const listings = await getListings();
  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  const existing = listings[index];
  if (existing.managePin !== pin) {
    return { success: false, error: "Invalid 6-digit manage PIN" };
  }

  const updated: Listing = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  listings[index] = updated;
  await saveListings(listings);
  return { success: true, listing: updated };
}

export async function deleteListing(
  id: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  const listings = await getListings();
  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  if (listings[index].managePin !== pin) {
    return { success: false, error: "Invalid 6-digit manage PIN" };
  }

  listings.splice(index, 1);
  await saveListings(listings);
  return { success: true };
}

export async function boostListing(
  id: string,
  days: number = 7
): Promise<{ success: boolean; listing?: Listing; error?: string }> {
  const listings = await getListings();
  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return { success: false, error: "Listing not found" };
  }

  const target = listings[index];
  target.isBoosted = true;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  target.boostExpiresAt = expires.toISOString();
  target.updatedAt = new Date().toISOString();

  listings[index] = target;
  await saveListings(listings);
  return { success: true, listing: target };
}

async function saveListings(listings: Listing[]): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_FILE, JSON.stringify(listings, null, 2), "utf-8");
}
