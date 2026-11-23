import { getMongoDb, isMongoConfigured } from "./mongodb.ts";
import type { Listing, TalentProfile, ContactRecord, OutreachRecord } from "../types/index.ts";

/**
 * MongoDB Atlas Service for SynqSquad
 * Provides persistent document storage, unmasking audit logs, and activity telemetry.
 */

export interface ActivityEvent {
  type: string;
  userEmail?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export async function saveListingToMongo(listing: Listing): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const db = await getMongoDb();
    await db.collection("listings").updateOne(
      { id: listing.id },
      { $set: { ...listing, updatedAt: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error("[MongoDB] Failed to save listing:", error);
    return false;
  }
}

export async function fetchListingsFromMongo(): Promise<Listing[]> {
  if (!isMongoConfigured()) return [];
  try {
    const db = await getMongoDb();
    const docs = await db.collection("listings").find({ status: "open" }).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...rest } = doc;
      return rest as unknown as Listing;
    });
  } catch (error) {
    console.error("[MongoDB] Failed to fetch listings:", error);
    return [];
  }
}

export async function deleteListingFromMongo(id: string): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const db = await getMongoDb();
    await db.collection("listings").deleteOne({ id });
    return true;
  } catch (error) {
    console.error("[MongoDB] Failed to delete listing:", error);
    return false;
  }
}

export async function saveTalentProfileToMongo(profile: TalentProfile): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const db = await getMongoDb();
    await db.collection("talent_profiles").updateOne(
      { id: profile.id },
      { $set: { ...profile, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error("[MongoDB] Failed to save talent profile:", error);
    return false;
  }
}

export async function fetchTalentProfilesFromMongo(): Promise<TalentProfile[]> {
  if (!isMongoConfigured()) return [];
  try {
    const db = await getMongoDb();
    const docs = await db.collection("talent_profiles").find({ visible: true }).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...rest } = doc;
      return rest as unknown as TalentProfile;
    });
  } catch (error) {
    console.error("[MongoDB] Failed to fetch talent profiles:", error);
    return [];
  }
}

export async function logContactAuditToMongo(contact: ContactRecord | OutreachRecord, type: "requisition_connect" | "talent_outreach"): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const db = await getMongoDb();
    await db.collection("contact_audits").insertOne({
      ...contact,
      type,
      loggedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("[MongoDB] Failed to log contact audit:", error);
    return false;
  }
}

export async function logActivityTelemetry(event: {
  type: string;
  userEmail?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const db = await getMongoDb();
    await db.collection("activity_events").insertOne({
      ...event,
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("[MongoDB] Failed to log activity telemetry:", error);
    return false;
  }
}
