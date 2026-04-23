/**
 * Seed 30 businesses across India with different plans, categories, services, and owners.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node backend/scripts/seed-businesses.mjs
 *
 * Or locally:
 *   node backend/scripts/seed-businesses.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-platform';
const BCRYPT_ROUNDS = 12;

// ─── Define all 30 businesses ────────────────────────────────────────────────

const BUSINESSES = [
  // ── Kochi (6 businesses) ───────────────────────────────
  {
    name: "GameZone Kochi",          category: "gaming-lounge", plan: "standard",
    email: "gamezone.kochi@demo.com", password: "Demo@1234",
    city: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673,
    description: "Premium gaming lounge with PS5, VR, and racing simulators",
    tags: ["ps5", "vr", "gaming", "esports"],
    services: [
      { name: "PS5 Console", price: 200, devices: 4, maxPlayers: 4, duration: 60, mode: "slot" },
      { name: "VR Experience", price: 350, devices: 2, maxPlayers: 1, duration: 30, mode: "slot" },
    ],
  },
  {
    name: "AquaCut Salon",           category: "salon", plan: "free",
    email: "aquacut.kochi@demo.com", password: "Demo@1234",
    city: "Kochi", state: "Kerala", lat: 9.9395, lng: 76.2601,
    description: "Unisex salon with haircuts, facials, and spa treatments",
    tags: ["haircut", "facial", "spa", "grooming"],
    services: [
      { name: "Men's Haircut", price: 300, devices: 3, maxPlayers: 1, duration: 30, mode: "slot" },
      { name: "Facial Treatment", price: 800, devices: 2, maxPlayers: 1, duration: 45, mode: "slot" },
    ],
  },
  {
    name: "Thunder Turf Kochi",      category: "turf", plan: "ai",
    email: "thunder.kochi@demo.com", password: "Demo@1234",
    city: "Kochi", state: "Kerala", lat: 9.9453, lng: 76.2520,
    description: "5-a-side and 7-a-side football turfs with floodlights",
    tags: ["football", "turf", "sports", "5aside"],
    services: [
      { name: "5-a-side Turf", price: 1200, devices: 1, maxPlayers: 10, duration: 60, mode: "slot", exclusive: true },
      { name: "7-a-side Turf", price: 1800, devices: 1, maxPlayers: 14, duration: 60, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "FitBox Gym",              category: "fitness", plan: "standard",
    email: "fitbox.kochi@demo.com",  password: "Demo@1234",
    city: "Kochi", state: "Kerala", lat: 9.9280, lng: 76.2750,
    description: "CrossFit and personal training with modern equipment",
    tags: ["gym", "crossfit", "fitness", "training"],
    services: [
      { name: "Personal Training", price: 500, devices: 3, maxPlayers: 1, duration: 60, mode: "slot" },
      { name: "Group CrossFit", price: 200, devices: 1, maxPlayers: 15, duration: 45, mode: "slot" },
    ],
  },
  {
    name: "Shutterframe Studio",     category: "photography", plan: "free",
    email: "shutter.kochi@demo.com", password: "Demo@1234",
    city: "Kochi", state: "Kerala", lat: 9.9350, lng: 76.2580,
    description: "Professional photography studio for portraits and events",
    tags: ["photography", "portraits", "studio"],
    services: [
      { name: "Portrait Session", price: 1500, devices: 1, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "Flavour Lab",             category: "restaurant", plan: "standard",
    email: "flavour.kochi@demo.com", password: "Demo@1234",
    city: "Kochi", state: "Kerala", lat: 9.9415, lng: 76.2655,
    description: "Fine dining restaurant with private dining rooms",
    tags: ["restaurant", "dining", "fine-dining"],
    services: [
      { name: "Private Dining Room", price: 2000, devices: 2, maxPlayers: 8, duration: 120, mode: "slot", exclusive: true },
    ],
  },

  // ── Bengaluru (6 businesses) ──────────────────────────
  {
    name: "PixelDen Gaming",         category: "gaming-lounge", plan: "ai",
    email: "pixelden.blr@demo.com",  password: "Demo@1234",
    city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946,
    description: "Esports-ready gaming lounge with streaming setups",
    tags: ["gaming", "esports", "ps5", "pc-gaming"],
    services: [
      { name: "PS5 Gaming", price: 250, devices: 6, maxPlayers: 4, duration: 60, mode: "slot" },
      { name: "PC Gaming", price: 150, devices: 10, maxPlayers: 1, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Kickstart Arena",         category: "turf", plan: "standard",
    email: "kickstart.blr@demo.com", password: "Demo@1234",
    city: "Bengaluru", state: "Karnataka", lat: 12.9352, lng: 77.6245,
    description: "Indoor and outdoor turf for football and cricket",
    tags: ["turf", "football", "cricket", "indoor"],
    services: [
      { name: "Indoor Football", price: 1500, devices: 1, maxPlayers: 10, duration: 60, mode: "slot", exclusive: true },
      { name: "Cricket Net", price: 800, devices: 3, maxPlayers: 2, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Bliss Spa & Salon",       category: "salon", plan: "ai",
    email: "bliss.blr@demo.com",     password: "Demo@1234",
    city: "Bengaluru", state: "Karnataka", lat: 12.9780, lng: 77.5850,
    description: "Luxury spa and salon for men and women",
    tags: ["spa", "salon", "luxury", "massage"],
    services: [
      { name: "Full Body Massage", price: 2000, devices: 4, maxPlayers: 1, duration: 60, mode: "slot" },
      { name: "Hair Styling", price: 600, devices: 3, maxPlayers: 1, duration: 45, mode: "slot" },
    ],
  },
  {
    name: "BeatBox Studio",          category: "studio", plan: "free",
    email: "beatbox.blr@demo.com",   password: "Demo@1234",
    city: "Bengaluru", state: "Karnataka", lat: 12.9610, lng: 77.6010,
    description: "Music recording studio and rehearsal space",
    tags: ["music", "recording", "studio", "band"],
    services: [
      { name: "Recording Session", price: 1000, devices: 1, maxPlayers: 5, duration: 120, mode: "slot", exclusive: true },
      { name: "Rehearsal Room", price: 500, devices: 2, maxPlayers: 6, duration: 60, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "IronForge Fitness",       category: "fitness", plan: "standard",
    email: "ironforge.blr@demo.com", password: "Demo@1234",
    city: "Bengaluru", state: "Karnataka", lat: 12.9550, lng: 77.5880,
    description: "Strength training gym with Olympic lifting platforms",
    tags: ["gym", "weightlifting", "strength", "fitness"],
    services: [
      { name: "Open Gym Session", price: 150, devices: 1, maxPlayers: 30, duration: 90, mode: "slot" },
      { name: "PT Session", price: 700, devices: 5, maxPlayers: 1, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Canvas & Coffee",         category: "art", plan: "free",
    email: "canvas.blr@demo.com",    password: "Demo@1234",
    city: "Bengaluru", state: "Karnataka", lat: 12.9700, lng: 77.6100,
    description: "Art workshop space with painting sessions and pottery",
    tags: ["art", "painting", "pottery", "workshop"],
    services: [
      { name: "Painting Workshop", price: 800, devices: 1, maxPlayers: 12, duration: 120, mode: "slot" },
    ],
  },

  // ── Mumbai (5 businesses) ─────────────────────────────
  {
    name: "Level Up Gaming",         category: "gaming-lounge", plan: "full_service",
    email: "levelup.mum@demo.com",   password: "Demo@1234",
    city: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777,
    description: "State-of-the-art gaming café with tournaments",
    tags: ["gaming", "tournaments", "ps5", "xbox"],
    services: [
      { name: "PS5 Station", price: 300, devices: 8, maxPlayers: 4, duration: 60, mode: "slot" },
      { name: "Xbox Station", price: 250, devices: 4, maxPlayers: 4, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Goal Strikers Turf",      category: "turf", plan: "ai",
    email: "strikers.mum@demo.com",  password: "Demo@1234",
    city: "Mumbai", state: "Maharashtra", lat: 19.0830, lng: 72.8900,
    description: "Premium football turf with synthetic grass",
    tags: ["turf", "football", "synthetic", "sports"],
    services: [
      { name: "Full Turf (11-a-side)", price: 3000, devices: 1, maxPlayers: 22, duration: 90, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "Glam Studio Mumbai",      category: "salon", plan: "standard",
    email: "glam.mum@demo.com",      password: "Demo@1234",
    city: "Mumbai", state: "Maharashtra", lat: 19.0650, lng: 72.8680,
    description: "Celebrity-style beauty salon and makeup studio",
    tags: ["salon", "beauty", "makeup", "celebrity"],
    services: [
      { name: "Bridal Makeup", price: 5000, devices: 2, maxPlayers: 1, duration: 120, mode: "slot" },
      { name: "Men's Grooming", price: 500, devices: 3, maxPlayers: 1, duration: 30, mode: "slot" },
    ],
  },
  {
    name: "Zenith Yoga",             category: "fitness", plan: "free",
    email: "zenith.mum@demo.com",    password: "Demo@1234",
    city: "Mumbai", state: "Maharashtra", lat: 19.0580, lng: 72.8350,
    description: "Traditional yoga and meditation classes",
    tags: ["yoga", "meditation", "wellness", "fitness"],
    services: [
      { name: "Yoga Class", price: 300, devices: 1, maxPlayers: 20, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "SoundWave Studios",       category: "studio", plan: "ai",
    email: "soundwave.mum@demo.com", password: "Demo@1234",
    city: "Mumbai", state: "Maharashtra", lat: 19.0700, lng: 72.8750,
    description: "Professional music production and podcast studio",
    tags: ["music", "podcast", "production", "studio"],
    services: [
      { name: "Podcast Room", price: 800, devices: 2, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
      { name: "Music Production", price: 1500, devices: 1, maxPlayers: 3, duration: 120, mode: "slot", exclusive: true },
    ],
  },

  // ── Chennai (4 businesses) ────────────────────────────
  {
    name: "Arcade Nation Chennai",   category: "gaming-lounge", plan: "standard",
    email: "arcade.chn@demo.com",    password: "Demo@1234",
    city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707,
    description: "Retro and modern gaming under one roof",
    tags: ["gaming", "arcade", "retro", "ps5"],
    services: [
      { name: "Retro Arcade", price: 100, devices: 8, maxPlayers: 2, duration: 30, mode: "slot" },
      { name: "PS5 Gaming", price: 200, devices: 4, maxPlayers: 4, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Smash Court Chennai",     category: "turf", plan: "free",
    email: "smash.chn@demo.com",     password: "Demo@1234",
    city: "Chennai", state: "Tamil Nadu", lat: 13.0600, lng: 80.2500,
    description: "Badminton and tennis courts with coaching",
    tags: ["badminton", "tennis", "court", "coaching"],
    services: [
      { name: "Badminton Court", price: 500, devices: 3, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
      { name: "Tennis Court", price: 700, devices: 2, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "The Style Lounge",        category: "salon", plan: "standard",
    email: "style.chn@demo.com",     password: "Demo@1234",
    city: "Chennai", state: "Tamil Nadu", lat: 13.0750, lng: 80.2650,
    description: "Trendy unisex salon with organic products",
    tags: ["salon", "organic", "haircut", "unisex"],
    services: [
      { name: "Haircut & Styling", price: 400, devices: 4, maxPlayers: 1, duration: 40, mode: "slot" },
    ],
  },
  {
    name: "Lenscraft Photography",   category: "photography", plan: "ai",
    email: "lens.chn@demo.com",      password: "Demo@1234",
    city: "Chennai", state: "Tamil Nadu", lat: 13.0900, lng: 80.2800,
    description: "Photo studio for weddings, portfolios, and products",
    tags: ["photography", "wedding", "portfolio", "studio"],
    services: [
      { name: "Portfolio Shoot", price: 2500, devices: 1, maxPlayers: 2, duration: 90, mode: "slot", exclusive: true },
      { name: "Product Photography", price: 1500, devices: 1, maxPlayers: 2, duration: 60, mode: "slot", exclusive: true },
    ],
  },

  // ── Hyderabad (4 businesses) ──────────────────────────
  {
    name: "GameVault Hyderabad",     category: "gaming-lounge", plan: "ai",
    email: "vault.hyd@demo.com",     password: "Demo@1234",
    city: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867,
    description: "VR gaming lounge with motion simulators",
    tags: ["vr", "gaming", "simulator", "esports"],
    services: [
      { name: "VR Motion Simulator", price: 400, devices: 3, maxPlayers: 1, duration: 30, mode: "slot" },
      { name: "PS5 Premium", price: 250, devices: 5, maxPlayers: 4, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Arena 7 Turf",            category: "turf", plan: "standard",
    email: "arena7.hyd@demo.com",    password: "Demo@1234",
    city: "Hyderabad", state: "Telangana", lat: 17.3950, lng: 78.4700,
    description: "Multi-sport turf with football, cricket and volleyball",
    tags: ["turf", "football", "cricket", "volleyball"],
    services: [
      { name: "Football Turf", price: 1400, devices: 1, maxPlayers: 14, duration: 60, mode: "slot", exclusive: true },
      { name: "Volleyball Court", price: 800, devices: 1, maxPlayers: 12, duration: 60, mode: "slot", exclusive: true },
    ],
  },
  {
    name: "Glow & Grace Spa",        category: "salon", plan: "full_service",
    email: "glow.hyd@demo.com",      password: "Demo@1234",
    city: "Hyderabad", state: "Telangana", lat: 17.3750, lng: 78.4900,
    description: "Luxury standalone spa with Ayurvedic treatments",
    tags: ["spa", "ayurveda", "luxury", "wellness"],
    services: [
      { name: "Ayurvedic Massage", price: 2500, devices: 3, maxPlayers: 1, duration: 90, mode: "slot" },
      { name: "Facial Treatment", price: 1200, devices: 2, maxPlayers: 1, duration: 45, mode: "slot" },
    ],
  },
  {
    name: "Cook's Table",            category: "restaurant", plan: "free",
    email: "cookstable.hyd@demo.com", password: "Demo@1234",
    city: "Hyderabad", state: "Telangana", lat: 17.3800, lng: 78.5000,
    description: "Private dining and cooking class experiences",
    tags: ["restaurant", "cooking-class", "private-dining"],
    services: [
      { name: "Cooking Class", price: 1500, devices: 1, maxPlayers: 8, duration: 120, mode: "slot" },
    ],
  },

  // ── Delhi/NCR (3 businesses) ──────────────────────────
  {
    name: "Frag Zone Delhi",         category: "gaming-lounge", plan: "standard",
    email: "fragzone.del@demo.com",  password: "Demo@1234",
    city: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090,
    description: "Competitive gaming arena with prize tournaments",
    tags: ["gaming", "competitive", "tournaments", "pc"],
    services: [
      { name: "Tournament PC", price: 200, devices: 20, maxPlayers: 1, duration: 60, mode: "slot" },
      { name: "PS5 Lounge", price: 250, devices: 6, maxPlayers: 4, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Delhi Dance Studio",      category: "studio", plan: "ai",
    email: "dance.del@demo.com",     password: "Demo@1234",
    city: "New Delhi", state: "Delhi", lat: 28.6280, lng: 77.2200,
    description: "Dance classes — Bollywood, Hip-hop, Contemporary",
    tags: ["dance", "bollywood", "hiphop", "studio"],
    services: [
      { name: "Bollywood Class", price: 400, devices: 1, maxPlayers: 20, duration: 60, mode: "slot" },
      { name: "Hip-hop Class", price: 400, devices: 1, maxPlayers: 15, duration: 60, mode: "slot" },
    ],
  },
  {
    name: "Green Turf Noida",        category: "turf", plan: "full_service",
    email: "greenturf.noida@demo.com", password: "Demo@1234",
    city: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910,
    description: "Largest turf complex in NCR with 3 fields",
    tags: ["turf", "football", "cricket", "large"],
    services: [
      { name: "Small Turf (5v5)", price: 1000, devices: 1, maxPlayers: 10, duration: 60, mode: "slot", exclusive: true },
      { name: "Large Turf (11v11)", price: 2500, devices: 1, maxPlayers: 22, duration: 90, mode: "slot", exclusive: true },
    ],
  },

  // ── Kodungallur / Thrissur (2 businesses) ─────────────
  {
    name: "PlaySpot Kodungallur",    category: "gaming-lounge", plan: "standard",
    email: "playspot.kod@demo.com",  password: "Demo@1234",
    city: "Kodungallur", state: "Kerala", lat: 10.2260, lng: 76.1940,
    description: "Family-friendly gaming café with console and VR",
    tags: ["gaming", "family", "ps5", "vr"],
    services: [
      { name: "PS5 Console", price: 150, devices: 3, maxPlayers: 4, duration: 60, mode: "slot" },
      { name: "VR Zone", price: 250, devices: 2, maxPlayers: 1, duration: 30, mode: "slot" },
    ],
  },
  {
    name: "Thrissur Sports Arena",   category: "turf", plan: "ai",
    email: "sports.tsr@demo.com",    password: "Demo@1234",
    city: "Thrissur", state: "Kerala", lat: 10.5276, lng: 76.2144,
    description: "Multi-sport complex with turf, badminton, and pool",
    tags: ["turf", "badminton", "swimming", "sports"],
    services: [
      { name: "Football Turf", price: 1000, devices: 1, maxPlayers: 14, duration: 60, mode: "slot", exclusive: true },
      { name: "Badminton Court", price: 400, devices: 4, maxPlayers: 4, duration: 60, mode: "slot", exclusive: true },
    ],
  },
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const tenantsCol = db.collection('tenants');
  const servicesCol = db.collection('services');
  const subscriptionsCol = db.collection('subscriptions');

  // Hash the common password once
  const passwordHash = await bcrypt.hash('Demo@1234', BCRYPT_ROUNDS);

  let created = 0;
  let skipped = 0;

  for (const biz of BUSINESSES) {
    // Check if tenant already exists by slug
    const slug = slugify(biz.name);
    const existing = await tenantsCol.findOne({ slug });
    if (existing) {
      console.log(`  ⏭ Skip "${biz.name}" (slug "${slug}" exists)`);
      skipped++;
      continue;
    }

    // 1. Create owner user
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
        tenantId: null, // will update after tenant creation
        isActive: true,
        emailVerified: true,
        tenantMemberships: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await usersCol.insertOne(userDoc);
      userId = userDoc._id;
    }

    // 2. Create tenant
    const tenantId = new mongoose.Types.ObjectId();
    const ratingAvg = +(3.5 + Math.random() * 1.5).toFixed(1);
    const ratingCount = Math.floor(5 + Math.random() * 95);

    const tenantDoc = {
      _id: tenantId,
      tenantId,
      ownerId: userId,
      name: biz.name,
      slug,
      description: biz.description,
      category: biz.category,
      location: {
        type: 'Point',
        coordinates: [biz.lng, biz.lat],
      },
      address: {
        street: '',
        city: biz.city,
        state: biz.state,
        zip: '',
        country: 'India',
      },
      branding: {
        logo: '',
        coverImage: '',
        primaryColor: '#6366f1',
        secondaryColor: '#f59e0b',
      },
      businessHours: Array.from({ length: 7 }, (_, i) => ({
        day: i,
        open: '10:00',
        close: '22:00',
        isClosed: i === 0,
      })),
      shopSettings: {
        slotInterval: 30,
        minBookingNotice: 60,
        maxAdvanceBooking: 30,
        allowWalkIns: false,
        requirePaymentUpfront: true,
        cancellationPolicy: 'Free cancellation up to 2 hours before',
        cancellationWindowHours: 2,
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
      rating: { average: ratingAvg, count: ratingCount },
      plan: biz.plan,
      status: 'active',
      isPublished: true,
      tags: biz.tags,
      paymentAccountId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await tenantsCol.insertOne(tenantDoc);

    // Update user to point to tenant
    await usersCol.updateOne({ _id: userId }, { $set: { tenantId } });

    // 3. Create services
    for (const svc of biz.services) {
      const serviceId = new mongoose.Types.ObjectId();
      const serviceDoc = {
        _id: serviceId,
        tenantId,
        name: svc.name,
        description: '',
        images: [],
        category: biz.category,
        bookingMode: svc.mode || 'slot',
        isExclusive: svc.exclusive || false,
        totalUnits: 1,
        unitType: '',
        pricePerNight: 0,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        amenities: [],
        facilityType: '',
        surfaceType: '',
        numberOfDevices: svc.devices,
        maxPlayersPerDevice: svc.maxPlayers,
        maxTotalPlayers: svc.devices * svc.maxPlayers,
        defaultDuration: svc.duration,
        bufferTime: 0,
        durationOptions: [
          { minutes: svc.duration, label: `${svc.duration} min`, price: svc.price },
        ],
        price: svc.price,
        pricePerAdditionalPerson: 0,
        currency: 'INR',
        minPersons: 1,
        maxPersons: svc.maxPlayers,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await servicesCol.insertOne(serviceDoc);
    }

    // 4. Create subscription record
    const subDoc = {
      _id: new mongoose.Types.ObjectId(),
      tenantId,
      userId,
      plan: biz.plan,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await subscriptionsCol.insertOne(subDoc);

    console.log(`  ✅ "${biz.name}" — ${biz.city} (${biz.plan}) [${biz.email}]`);
    created++;
  }

  console.log(`\nDone! Created ${created}, skipped ${skipped}.`);
  console.log('\n📋 All credentials use password: Demo@1234');
  console.log('Emails follow pattern: <name>.<city>@demo.com');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
