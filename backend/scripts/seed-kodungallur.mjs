/**
 * Seed businesses in Kodungallur / Thrissur / nearby area (680664).
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node backend/scripts/seed-kodungallur.mjs
 *   node backend/scripts/seed-kodungallur.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-platform';
const BCRYPT_ROUNDS = 12;

// Kodungallur town center: 10.2260°N, 76.1940°E
// Slight coordinate offsets to spread them around realistically
const BUSINESSES = [
  // ── Gaming Lounges ─────────────────────────────────────
  {
    name: "GG Arena Kodungallur",
    category: "gaming-lounge", plan: "standard",
    email: "ggarena.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2268, lng: 76.1952,
    description: "PS5, Xbox, and PC gaming lounge right in the heart of Kodungallur. Weekend tournaments every Saturday!",
    tags: ["ps5", "xbox", "gaming", "esports", "tournaments"],
    services: [
      { name: "PS5 Gaming", price: 150, devices: 4, maxPlayers: 4, duration: 60, mode: "slot" },
      { name: "PC Gaming", price: 100, devices: 6, maxPlayers: 1, duration: 60, mode: "slot" },
      { name: "Xbox Series X", price: 150, devices: 2, maxPlayers: 4, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "VR World Kodungallur",
    category: "gaming-lounge", plan: "ai",
    email: "vrworld.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2242, lng: 76.1925,
    description: "Kerala's first VR gaming experience with flight simulators, horror rooms, and racing rigs",
    tags: ["vr", "simulator", "gaming", "horror", "racing"],
    services: [
      { name: "VR Adventure", price: 300, devices: 3, maxPlayers: 1, duration: 30, mode: "slot" },
      { name: "Racing Simulator", price: 200, devices: 2, maxPlayers: 1, duration: 30, mode: "slot" },
      { name: "VR Horror Room", price: 350, devices: 1, maxPlayers: 1, duration: 20, mode: "slot" },
    ],
  },

  // ── Turfs & Sports ─────────────────────────────────────
  {
    name: "Striker Turf Kodungallur",
    category: "turf", plan: "standard",
    email: "striker.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2285, lng: 76.1980,
    description: "5-a-side synthetic turf with floodlights, open till 11 PM. Best turf in Kodungallur!",
    tags: ["football", "turf", "5aside", "floodlights", "sports"],
    services: [
      { name: "5-a-side Turf", price: 1000, devices: 1, maxPlayers: 10, duration: 60, mode: "slot", exclusive: true },
      { name: "7-a-side Turf", price: 1500, devices: 1, maxPlayers: 14, duration: 60, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "Smash Badminton Club",
    category: "turf", plan: "free",
    email: "smash.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2230, lng: 76.1910,
    description: "Indoor wooden-floor badminton courts with coaching for all ages",
    tags: ["badminton", "indoor", "coaching", "sports"],
    services: [
      { name: "Badminton Court", price: 300, devices: 4, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
      { name: "Coaching Session", price: 500, devices: 1, maxPlayers: 6, duration: 90, mode: "slot" },
    ],
  },
  {
    name: "PowerPlay Cricket Nets",
    category: "turf", plan: "standard",
    email: "powerplay.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2310, lng: 76.1965,
    description: "Professional cricket practice nets with bowling machines",
    tags: ["cricket", "nets", "bowling-machine", "practice"],
    services: [
      { name: "Cricket Net (with machine)", price: 400, devices: 3, maxPlayers: 2, duration: 60, mode: "slot" },
      { name: "Cricket Net (without machine)", price: 200, devices: 2, maxPlayers: 4, duration: 60, mode: "slot" },
    ],
  },

  // ── Salons & Beauty ────────────────────────────────────
  {
    name: "Elegance Unisex Salon",
    category: "salon", plan: "standard",
    email: "elegance.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2255, lng: 76.1935,
    description: "Premium unisex salon near Kodungallur bus stand. Haircuts, facials, keratin, and bridal packages",
    tags: ["haircut", "facial", "bridal", "keratin", "unisex"],
    services: [
      { name: "Men's Haircut", price: 200, devices: 3, maxPlayers: 1, duration: 30, mode: "slot" },
      { name: "Women's Haircut & Styling", price: 500, devices: 2, maxPlayers: 1, duration: 45, mode: "slot" },
      { name: "Facial Treatment", price: 700, devices: 2, maxPlayers: 1, duration: 45, mode: "slot" },
      { name: "Keratin Treatment", price: 3000, devices: 1, maxPlayers: 1, duration: 120, mode: "slot" },
    ],
  },
  {
    name: "Glow Beauty Parlour",
    category: "salon", plan: "free",
    email: "glow.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2275, lng: 76.1948,
    description: "Ladies beauty parlour specializing in bridal makeup and threading",
    tags: ["beauty", "bridal-makeup", "threading", "ladies"],
    services: [
      { name: "Bridal Makeup", price: 5000, devices: 1, maxPlayers: 1, duration: 150, mode: "slot" },
      { name: "Threading & Facial", price: 300, devices: 2, maxPlayers: 1, duration: 30, mode: "slot" },
    ],
  },

  // ── Fitness ────────────────────────────────────────────
  {
    name: "BeastMode Gym",
    category: "fitness", plan: "ai",
    email: "beastmode.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2248, lng: 76.1958,
    description: "Fully equipped gym with personal training, crossfit zone, and cardio floor",
    tags: ["gym", "fitness", "crossfit", "personal-training", "cardio"],
    services: [
      { name: "Personal Training", price: 500, devices: 3, maxPlayers: 1, duration: 60, mode: "slot" },
      { name: "CrossFit Class", price: 200, devices: 1, maxPlayers: 12, duration: 45, mode: "slot" },
      { name: "Open Gym", price: 100, devices: 1, maxPlayers: 25, duration: 90, mode: "slot" },
    ],
  },
  {
    name: "Zen Yoga Studio",
    category: "fitness", plan: "free",
    email: "zen.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2220, lng: 76.1920,
    description: "Morning yoga, meditation, and breathing classes in a peaceful setting",
    tags: ["yoga", "meditation", "wellness", "morning-class"],
    services: [
      { name: "Yoga Class", price: 150, devices: 1, maxPlayers: 15, duration: 60, mode: "slot" },
      { name: "Meditation Session", price: 100, devices: 1, maxPlayers: 10, duration: 30, mode: "slot" },
    ],
  },

  // ── Studios ────────────────────────────────────────────
  {
    name: "Rhythm Music Academy",
    category: "studio", plan: "standard",
    email: "rhythm.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2262, lng: 76.1930,
    description: "Music classes for guitar, keyboard, drums, and vocals. Rehearsal rooms available",
    tags: ["music", "guitar", "keyboard", "drums", "vocals"],
    services: [
      { name: "Rehearsal Room", price: 400, devices: 2, maxPlayers: 5, duration: 60, mode: "slot", exclusive: true },
      { name: "Recording Session", price: 800, devices: 1, maxPlayers: 3, duration: 120, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "FrameClick Studio",
    category: "photography", plan: "ai",
    email: "frameclick.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2270, lng: 76.1960,
    description: "Professional photo and video studio for events, portraits, and product shoots",
    tags: ["photography", "videography", "portrait", "wedding", "product"],
    services: [
      { name: "Portrait Session", price: 1500, devices: 1, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
      { name: "Product Photography", price: 1000, devices: 1, maxPlayers: 2, duration: 60, mode: "slot", exclusive: true },
      { name: "Pre-wedding Shoot", price: 5000, devices: 1, maxPlayers: 4, duration: 180, mode: "slot", exclusive: true },
    ],
  },

  // ── Art & Craft ────────────────────────────────────────
  {
    name: "Clay & Canvas",
    category: "art", plan: "free",
    email: "clay.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2253, lng: 76.1945,
    description: "Art and pottery workshops for kids and adults. Weekend batches available",
    tags: ["art", "pottery", "painting", "craft", "workshop"],
    services: [
      { name: "Pottery Workshop", price: 600, devices: 1, maxPlayers: 8, duration: 120, mode: "slot" },
      { name: "Canvas Painting", price: 400, devices: 1, maxPlayers: 10, duration: 90, mode: "slot" },
    ],
  },

  // ── Restaurant / Café ──────────────────────────────────
  {
    name: "Chai & Chill Café",
    category: "restaurant", plan: "standard",
    email: "chai.kod@demo.com", password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2265, lng: 76.1942,
    description: "Cozy café with private rooms for birthday parties and small events",
    tags: ["cafe", "party-room", "birthday", "events", "private-dining"],
    services: [
      { name: "Private Party Room", price: 2000, devices: 2, maxPlayers: 15, duration: 180, mode: "slot", exclusive: true },
      { name: "Outdoor Seating (reserved)", price: 500, devices: 3, maxPlayers: 6, duration: 120, mode: "slot", exclusive: true },
    ],
  },

  // ── Nearby Thrissur town (10-15 km away) ───────────────
  {
    name: "ProGamer Hub Thrissur",
    category: "gaming-lounge", plan: "full_service",
    email: "progamer.tsr@demo.com", password: "Demo@1234",
    city: "Thrissur", state: "Kerala", lat: 10.5230, lng: 76.2120,
    description: "Thrissur's biggest gaming café — 20+ PS5s, PC arena, and streaming pods",
    tags: ["gaming", "ps5", "pc", "streaming", "cafe"],
    services: [
      { name: "PS5 Station", price: 200, devices: 20, maxPlayers: 4, duration: 60, mode: "slot" },
      { name: "PC Arena", price: 120, devices: 15, maxPlayers: 1, duration: 60, mode: "slot" },
      { name: "Streaming Pod", price: 500, devices: 3, maxPlayers: 1, duration: 120, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "Kickoff Turf Thrissur",
    category: "turf", plan: "ai",
    email: "kickoff.tsr@demo.com", password: "Demo@1234",
    city: "Thrissur", state: "Kerala", lat: 10.5190, lng: 76.2180,
    description: "International-quality turf with astro surface and changing rooms",
    tags: ["turf", "football", "astro", "international"],
    services: [
      { name: "5-a-side (1 hour)", price: 1200, devices: 1, maxPlayers: 10, duration: 60, mode: "slot", exclusive: true },
      { name: "7-a-side (1 hour)", price: 1800, devices: 1, maxPlayers: 14, duration: 90, mode: "slot", exclusive: true },
    ],
  },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const tenantsCol = db.collection('tenants');
  const servicesCol = db.collection('services');
  const subscriptionsCol = db.collection('subscriptions');

  const passwordHash = await bcrypt.hash('Demo@1234', BCRYPT_ROUNDS);

  let created = 0, skipped = 0;

  for (const biz of BUSINESSES) {
    const slug = slugify(biz.name);
    const existing = await tenantsCol.findOne({ slug });
    if (existing) {
      console.log(`  ⏭ Skip "${biz.name}" (already exists)`);
      skipped++;
      continue;
    }

    // Owner user
    const existingUser = await usersCol.findOne({ email: biz.email });
    let userId;
    if (existingUser) {
      userId = existingUser._id;
    } else {
      const userDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: biz.name + ' Owner',
        email: biz.email,
        passwordHash,
        phone: '+91' + Math.floor(7000000000 + Math.random() * 2999999999),
        role: 'client_admin',
        tenantId: null,
        isActive: true,
        emailVerified: true,
        tenantMemberships: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await usersCol.insertOne(userDoc);
      userId = userDoc._id;
    }

    // Tenant
    const tenantId = new mongoose.Types.ObjectId();
    const ratingAvg = +(3.8 + Math.random() * 1.2).toFixed(1); // 3.8–5.0
    const ratingCount = Math.floor(10 + Math.random() * 120);

    await tenantsCol.insertOne({
      _id: tenantId,
      tenantId,
      ownerId: userId,
      name: biz.name,
      slug,
      description: biz.description,
      category: biz.category,
      location: { type: 'Point', coordinates: [biz.lng, biz.lat] },
      address: { street: '', city: biz.city, state: biz.state, zip: '680664', country: 'India' },
      branding: { logo: '', coverImage: '', primaryColor: '#6366f1', secondaryColor: '#f59e0b' },
      businessHours: Array.from({ length: 7 }, (_, i) => ({
        day: i, open: '09:00', close: '22:00', isClosed: false,
      })),
      shopSettings: {
        slotInterval: 30, minBookingNotice: 30, maxAdvanceBooking: 30,
        allowWalkIns: true, requirePaymentUpfront: false,
        cancellationPolicy: 'Free cancellation up to 1 hour before',
        cancellationWindowHours: 1, currency: 'INR', timezone: 'Asia/Kolkata',
      },
      rating: { average: ratingAvg, count: ratingCount },
      plan: biz.plan,
      status: 'active',
      isPublished: true,
      tags: biz.tags,
      paymentAccountId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await usersCol.updateOne({ _id: userId }, { $set: { tenantId } });

    // Services
    for (const svc of biz.services) {
      await servicesCol.insertOne({
        _id: new mongoose.Types.ObjectId(),
        tenantId,
        name: svc.name,
        description: '',
        images: [],
        category: biz.category,
        bookingMode: svc.mode || 'slot',
        isExclusive: svc.exclusive || false,
        totalUnits: 1, unitType: '', pricePerNight: 0,
        checkInTime: '14:00', checkOutTime: '11:00',
        amenities: [], facilityType: '', surfaceType: '',
        numberOfDevices: svc.devices,
        maxPlayersPerDevice: svc.maxPlayers,
        maxTotalPlayers: svc.devices * svc.maxPlayers,
        defaultDuration: svc.duration,
        bufferTime: 0,
        durationOptions: [{ minutes: svc.duration, label: `${svc.duration} min`, price: svc.price }],
        price: svc.price,
        pricePerAdditionalPerson: 0,
        currency: 'INR',
        minPersons: 1,
        maxPersons: svc.maxPlayers,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Subscription
    await subscriptionsCol.insertOne({
      _id: new mongoose.Types.ObjectId(),
      tenantId, userId, plan: biz.plan, status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(), updatedAt: new Date(),
    });

    console.log(`  ✅ "${biz.name}" — ${biz.city} (${biz.plan}) [${biz.email}]`);
    created++;
  }

  console.log(`\nDone! Created ${created}, skipped ${skipped}.`);
  console.log('📋 Password for all: Demo@1234\n');

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
