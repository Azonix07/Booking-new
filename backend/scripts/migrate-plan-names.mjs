#!/usr/bin/env node
/**
 * One-shot migration: rename legacy plan values to the new 4-plan taxonomy.
 *
 * Legacy  →  New
 *   basic →  free       (subscriptions + tenant docs that used "free" already)
 *   pro   →  ai         (tenant doc only)
 *   premium → standard  (subscriptions; premium meant paid-customizable)
 *   enterprise → standard  (tenant doc only)
 *
 * NOTE on "premium" → "standard": the original premium plan maps to what
 * we now call "standard" — a paid tier with customizable pages + theme.
 * The new "full_service" is a separate request-driven workflow and is NOT
 * the destination for legacy premium subscriptions.
 *
 * Run with: MONGODB_URI=... node scripts/migrate-plan-names.mjs
 */

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI env var is required');
  process.exit(1);
}

const SUBSCRIPTION_MAP = { basic: 'free', premium: 'standard', ai: 'ai' };
const TENANT_MAP = { pro: 'ai', enterprise: 'standard', free: 'free' };

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');

  const db = client.db();

  // ── subscriptions.plan ────────────────────────────────────────────────────
  for (const [oldPlan, newPlan] of Object.entries(SUBSCRIPTION_MAP)) {
    if (oldPlan === newPlan) continue;
    const res = await db
      .collection('subscriptions')
      .updateMany({ plan: oldPlan }, { $set: { plan: newPlan } });
    console.log(
      `subscriptions: ${oldPlan} → ${newPlan}: ${res.modifiedCount} updated`,
    );
  }

  // ── tenants.plan ──────────────────────────────────────────────────────────
  for (const [oldPlan, newPlan] of Object.entries(TENANT_MAP)) {
    if (oldPlan === newPlan) continue;
    const res = await db
      .collection('tenants')
      .updateMany({ plan: oldPlan }, { $set: { plan: newPlan } });
    console.log(`tenants: ${oldPlan} → ${newPlan}: ${res.modifiedCount} updated`);
  }

  // ── legacy premium_requests → full_service_requests ──────────────────────
  const legacy = await db
    .collection('premium_requests')
    .find({})
    .toArray()
    .catch(() => []);

  if (legacy.length) {
    const migrated = legacy.map((doc) => ({
      tenantId: doc.tenantId ?? null,
      requestedBy: doc.requestedBy ?? null,
      businessName: doc.businessName ?? 'Legacy request',
      businessType: doc.businessType ?? 'other',
      businessDescription: doc.businessDescription ?? '',
      features: doc.featuresNeeded ?? [],
      designPreferences: doc.designPreferences ?? '',
      targetAudience: '',
      existingWebsite: '',
      budget: doc.quotedPrice ?? null,
      timeline: '',
      additionalNotes: doc.additionalNotes ?? '',
      contact: doc.contact ?? {
        name: 'Legacy',
        email: 'legacy@migrated.local',
        phone: '0000000000',
      },
      status:
        doc.status === 'accepted' || doc.status === 'completed'
          ? doc.status === 'completed'
            ? 'completed'
            : 'in_progress'
          : doc.status === 'rejected'
            ? 'cancelled'
            : 'pending',
      assignedTo: null,
      adminNotes: doc.adminReply ?? '',
      contactedAt: doc.repliedAt ?? null,
      startedAt: null,
      completedAt: null,
      deliveredDomain: '',
      listedTenantId: null,
      createdAt: doc.createdAt ?? new Date(),
      updatedAt: doc.updatedAt ?? new Date(),
    }));
    await db.collection('full_service_requests').insertMany(migrated);
    console.log(`Migrated ${migrated.length} premium_requests → full_service_requests`);
  } else {
    console.log('No legacy premium_requests to migrate');
  }

  await client.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
