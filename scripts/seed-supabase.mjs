// Supabase Seed Script for SynqSquad
// Runs strictly on demand via "npm run seed:supabase" - Never auto-seeds in production

import { createClient } from "@supabase/supabase-js";
import { SEED_LISTINGS } from "../src/data/seed.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node --experimental-strip-types scripts/seed-supabase.mjs");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSeed() {
  console.log(`\n🌱 Seeding 12 verified realistic listings into Supabase (${supabaseUrl})...\n`);

  let count = 0;
  for (const item of SEED_LISTINGS) {
    const row = {
      id: item.id,
      owner_id: item.ownerId,
      owner_name: item.ownerName,
      owner_email: item.ownerEmail.toLowerCase(),
      owner_college: item.ownerCollege,
      owner_role: item.ownerRole,
      owner_photo: item.ownerPhoto || null,
      type: item.type,
      title: item.title,
      event: item.event,
      deadline: item.deadline,
      skills_needed: item.skillsNeeded,
      slots: item.slots,
      total_slots: item.totalSlots,
      description: item.description,
      status: item.status,
      expires_at: item.expiresAt,
      created_at: item.createdAt,
    };

    const { error } = await supabase
      .from("listings")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error(`  ✗ Failed to insert listing ${item.id}:`, error.message);
    } else {
      console.log(`  ✓ Inserted: [${item.event}] ${item.title}`);
      count++;
    }
  }

  console.log(`\n✅ Seeding complete: ${count}/${SEED_LISTINGS.length} listings saved to Supabase.\n`);
}

runSeed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
