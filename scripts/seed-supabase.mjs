// Supabase Seed Script for SynqSquad
// Runs strictly on demand via "npm run seed:supabase" - Never auto-seeds in production

import { createClient } from "@supabase/supabase-js";
import { SEED_LISTINGS, SEED_PROFILES } from "../src/data/seed.ts";

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

  let countListings = 0;
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
      console.log(`  ✓ Inserted Listing: [${item.event}] ${item.title}`);
      countListings++;
    }
  }

  console.log(`\n🌱 Seeding 12 verified user profiles and talent profiles into Supabase...\n`);
  let countUsers = 0;
  let countTalent = 0;

  for (const p of SEED_PROFILES) {
    // 1. Seed user record
    const { error: userErr } = await supabase.from("users").upsert(
      {
        id: p.id,
        name: p.name,
        email: p.email.toLowerCase(),
        photo: p.photo || null,
        role: p.role,
        college: p.college,
        skills: p.skills,
        looking_for: p.lookingFor,
        bio: p.bio,
        consent_at: p.consentAt,
        created_at: p.createdAt,
      },
      { onConflict: "id" }
    );

    if (userErr) {
      console.error(`  ✗ Failed to insert user ${p.id}:`, userErr.message);
    } else {
      countUsers++;
    }

    // 2. Seed talent profile record
    const lookingForArr =
      p.lookingFor === "both"
        ? ["hackathon", "research"]
        : p.lookingFor === "hackathon"
        ? ["hackathon"]
        : ["research"];

    const { error: talentErr } = await supabase.from("talent_profiles").upsert(
      {
        id: `prf-${p.id}`,
        user_id: p.id,
        display_name: p.name,
        email: p.email.toLowerCase(),
        headline: `${p.role} • ${p.college}`,
        skills: p.skills,
        looking_for: lookingForArr,
        experience_level: p.id.includes("elena") ? "experienced" : "student",
        bio: p.bio,
        availability: "open",
        visible: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (talentErr) {
      console.error(`  ✗ Failed to insert talent profile for ${p.id}:`, talentErr.message);
    } else {
      console.log(`  ✓ Inserted Talent Profile: ${p.name} (${p.role})`);
      countTalent++;
    }
  }

  console.log(`\n✅ Seeding complete:`);
  console.log(`   - ${countListings}/${SEED_LISTINGS.length} listings saved to Supabase.`);
  console.log(`   - ${countUsers}/${SEED_PROFILES.length} user records saved.`);
  console.log(`   - ${countTalent}/${SEED_PROFILES.length} talent profiles saved.\n`);
}

runSeed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
