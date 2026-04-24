// Fallback imagery for businesses that haven't uploaded a cover photo.
// Unsplash URLs — licensed for broad use, served via CDN with w/q params.
// `next.config.ts` whitelists all HTTPS hosts so these work with Next/Image too,
// but we use plain <img> for carousel / cards to avoid LCP warnings on lists.

type ImageSet = {
  cover: string; // wide 16:9-ish for hero / card background
  card: string;  // portrait-friendly 3:4 for card centers
};

const FALLBACKS: Record<string, ImageSet> = {
  "gaming-lounge": {
    cover:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80&auto=format&fit=crop",
  },
  turf: {
    cover:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80&auto=format&fit=crop",
  },
  salon: {
    cover:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format&fit=crop",
  },
  fitness: {
    cover:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop",
  },
  studio: {
    cover:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80&auto=format&fit=crop",
  },
  art: {
    cover:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1452802447250-470a88ac82bc?w=800&q=80&auto=format&fit=crop",
  },
  restaurant: {
    cover:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop",
  },
  photography: {
    cover:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&q=80&auto=format&fit=crop",
    card:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&auto=format&fit=crop",
  },
};

const DEFAULT: ImageSet = {
  cover:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop",
  card:
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&auto=format&fit=crop",
};

export function getCategoryImage(category?: string | null): ImageSet {
  if (!category) return DEFAULT;
  return FALLBACKS[category] ?? DEFAULT;
}

export function getCardImage(business: {
  category?: string | null;
  branding?: { coverImage?: string | null; logo?: string | null } | null;
}): string {
  return (
    business.branding?.coverImage ||
    getCategoryImage(business.category).card
  );
}

export function getCoverImage(business: {
  category?: string | null;
  branding?: { coverImage?: string | null } | null;
}): string {
  return (
    business.branding?.coverImage ||
    getCategoryImage(business.category).cover
  );
}
