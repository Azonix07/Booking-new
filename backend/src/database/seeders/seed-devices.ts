/**
 * Seed script — creates the three GameSpot gaming devices for a tenant.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeders/seed-devices.ts <tenantId>
 *
 * Or after build:
 *   node dist/database/seeders/seed-devices.js <tenantId>
 */

import * as mongoose from 'mongoose';
import { ServiceSchema } from '../../modules/services/schemas/service.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-platform';

async function seed() {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Usage: seed-devices <tenantId>');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const ServiceModel = mongoose.model('Service', ServiceSchema);

  const devices = [
    // ─── PS5 Station ────────────────────────────────────────────────────────────
    {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: 'PS5 Station',
      description: 'PlayStation 5 gaming station with 4 controllers per console. Up to 4 players per device, 2 devices available (max 8 players total per slot).',
      category: 'console',
      numberOfDevices: 2,
      maxPlayersPerDevice: 4,
      maxTotalPlayers: 8, // 2 × 4
      defaultDuration: 60,
      bufferTime: 0,
      durationOptions: [
        { minutes: 60,  label: '1 Hour',  price: 400 },
        { minutes: 120, label: '2 Hours', price: 700 },
        { minutes: 180, label: '3 Hours', price: 950 },
      ],
      price: 400,
      pricePerAdditionalPerson: 100,
      currency: 'INR',
      minPersons: 1,
      maxPersons: 4, // max per single booking = 1 device group
      sortOrder: 1,
      isActive: true,
    },

    // ─── VR Headset ─────────────────────────────────────────────────────────────
    {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: 'VR Headset',
      description: 'Immersive VR experience. Single player per headset, one headset available.',
      category: 'vr',
      numberOfDevices: 1,
      maxPlayersPerDevice: 1,
      maxTotalPlayers: 1, // 1 × 1
      defaultDuration: 60,
      bufferTime: 10, // 10 min cleanup between sessions
      durationOptions: [
        { minutes: 30,  label: '30 Minutes', price: 250 },
        { minutes: 60,  label: '1 Hour',     price: 450 },
        { minutes: 120, label: '2 Hours',    price: 800 },
      ],
      price: 450,
      pricePerAdditionalPerson: 0,
      currency: 'INR',
      minPersons: 1,
      maxPersons: 1,
      sortOrder: 2,
      isActive: true,
    },

    // ─── Driving Sim ────────────────────────────────────────────────────────────
    {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: 'Driving Simulator',
      description: 'Racing simulator cockpit. Single player only.',
      category: 'sim',
      numberOfDevices: 1,
      maxPlayersPerDevice: 1,
      maxTotalPlayers: 1, // 1 × 1
      defaultDuration: 60,
      bufferTime: 5,
      durationOptions: [
        { minutes: 30,  label: '30 Minutes', price: 200 },
        { minutes: 60,  label: '1 Hour',     price: 350 },
        { minutes: 120, label: '2 Hours',    price: 600 },
      ],
      price: 350,
      pricePerAdditionalPerson: 0,
      currency: 'INR',
      minPersons: 1,
      maxPersons: 1,
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const device of devices) {
    const existing = await ServiceModel.findOne({
      tenantId: device.tenantId,
      name: device.name,
    });

    if (existing) {
      console.log(`  ⏭  ${device.name} already exists, skipping`);
    } else {
      await ServiceModel.create(device);
      console.log(`  ✅ Created: ${device.name}`);
    }
  }

  console.log('\nDone! Device seed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
