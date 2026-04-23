import { SectionType } from './schemas/website-config.schema';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface GeneratedWebsite {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
    mode: 'light' | 'dark';
  };
  layout: {
    headerStyle: 'centered' | 'left-aligned' | 'transparent';
    footerStyle: 'minimal' | 'full' | 'none';
    maxWidth: string;
  };
  sections: {
    type: SectionType;
    order: number;
    isVisible: boolean;
    config: Record<string, any>;
  }[];
  seo: {
    title: string;
    description: string;
    ogImage: string;
    favicon: string;
  };
  customCSS: string;
  customHeadHTML: string;
}

// ─── Business Type Profiles ─────────────────────────────────────────────────────

interface BusinessProfile {
  name: string;
  keywords: string[];
  heroHeadline: string;
  heroSubheadline: string;
  heroCta: string;
  aboutTitle: string;
  aboutContent: string;
  seoTitle: string;
  seoDescription: string;
  servicesTitle: string;
  sections: SectionType[];
  faqItems: { question: string; answer: string }[];
  testimonials: { text: string; author: string; rating: number }[];
}

const BUSINESS_PROFILES: Record<string, BusinessProfile> = {
  'gaming-lounge': {
    name: 'Gaming Lounge',
    keywords: ['gaming', 'game', 'ps5', 'xbox', 'vr', 'arcade', 'esports', 'console', 'pc gaming', 'lan'],
    heroHeadline: 'Level Up Your Gaming Experience',
    heroSubheadline: 'PS5, VR, Racing Sims & more — book your next epic session with friends',
    heroCta: 'Book a Session',
    aboutTitle: 'The Ultimate Gaming Destination',
    aboutContent: 'Step into our state-of-the-art gaming lounge featuring the latest consoles, VR headsets, and racing simulators. Whether you\'re a casual gamer or competitive esports player, we have the perfect setup for your next gaming session.',
    seoTitle: 'Gaming Lounge — Book Your Session',
    seoDescription: 'Premium gaming lounge with PS5, VR, racing sims and more. Book your session online.',
    servicesTitle: 'Gaming Stations',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.PRICING, SectionType.GALLERY, SectionType.TESTIMONIALS, SectionType.FAQ, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'How many players per session?', answer: 'Each station supports a different number of players. Check the service details for specific capacity information.' },
      { question: 'Can I bring my own controller?', answer: 'Absolutely! You\'re welcome to bring your own controllers. We also provide controllers for all our stations.' },
      { question: 'Do you offer group packages?', answer: 'Yes! We have special rates for birthday parties, team events, and groups of 6+. Contact us for custom packages.' },
      { question: 'Is food and drinks available?', answer: 'We have a snack bar with drinks, chips, and light refreshments available for purchase.' },
    ],
    testimonials: [
      { text: 'Best gaming lounge in town! The VR setup is incredible and the staff is super friendly.', author: 'Alex M.', rating: 5 },
      { text: 'Had my birthday party here and everyone had an amazing time. Will definitely be back!', author: 'Sarah K.', rating: 5 },
      { text: 'Clean, well-maintained equipment and great atmosphere. The PS5 stations are top notch.', author: 'Mike R.', rating: 4 },
    ],
  },
  'salon': {
    name: 'Salon & Spa',
    keywords: ['salon', 'beauty', 'spa', 'hair', 'nails', 'makeup', 'barber', 'wellness', 'skincare', 'massage'],
    heroHeadline: 'Your Beauty, Our Passion',
    heroSubheadline: 'Expert stylists, premium products, and a relaxing atmosphere — book your transformation today',
    heroCta: 'Book Appointment',
    aboutTitle: 'Where Beauty Meets Excellence',
    aboutContent: 'Our expert team of stylists and beauty professionals is dedicated to making you look and feel your absolute best. Using only premium products and the latest techniques, we deliver personalized services in a relaxing, luxurious environment.',
    seoTitle: 'Beauty Salon & Spa — Book Your Appointment',
    seoDescription: 'Premium salon and spa services. Expert stylists, relaxing atmosphere. Book online.',
    servicesTitle: 'Our Services',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.ABOUT, SectionType.TEAM, SectionType.GALLERY, SectionType.TESTIMONIALS, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'How far in advance should I book?', answer: 'We recommend booking at least 48 hours in advance, especially for weekends. Walk-ins are welcome based on availability.' },
      { question: 'Do you offer bridal packages?', answer: 'Yes! We offer complete bridal packages including hair, makeup, and spa treatments. Contact us for a personalized quote.' },
      { question: 'What products do you use?', answer: 'We exclusively use premium, professional-grade products from leading brands to ensure the best results.' },
    ],
    testimonials: [
      { text: 'My hair has never looked better! The stylist really listened to what I wanted and delivered beyond expectations.', author: 'Emma L.', rating: 5 },
      { text: 'Such a relaxing experience from start to finish. The massage was heavenly!', author: 'Jennifer W.', rating: 5 },
      { text: 'Professional team, beautiful space, and amazing results. My go-to salon!', author: 'Rachel T.', rating: 5 },
    ],
  },
  'fitness': {
    name: 'Fitness & Gym',
    keywords: ['gym', 'fitness', 'workout', 'training', 'yoga', 'pilates', 'crossfit', 'personal trainer', 'martial arts'],
    heroHeadline: 'Transform Your Body, Transform Your Life',
    heroSubheadline: 'Expert trainers, world-class equipment, and a community that pushes you to be your best',
    heroCta: 'Start Training',
    aboutTitle: 'Your Fitness Journey Starts Here',
    aboutContent: 'Whether you\'re just starting out or training for competition, our certified trainers and state-of-the-art facility provide everything you need to reach your goals. Join a supportive community committed to health and excellence.',
    seoTitle: 'Fitness Studio — Book Your Training Session',
    seoDescription: 'Professional fitness studio with certified trainers. Classes, personal training, and more. Book online.',
    servicesTitle: 'Training Programs',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.ABOUT, SectionType.PRICING, SectionType.TEAM, SectionType.TESTIMONIALS, SectionType.FAQ, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'Do I need prior experience?', answer: 'Not at all! We welcome all fitness levels. Our trainers will adapt every session to your current abilities.' },
      { question: 'What should I bring?', answer: 'Just bring comfortable workout clothes, a water bottle, and a towel. We provide all the equipment.' },
      { question: 'Can I cancel or reschedule?', answer: 'You can cancel or reschedule up to 24 hours before your session at no charge.' },
    ],
    testimonials: [
      { text: 'Lost 30 pounds in 3 months! The trainers are incredible and really keep you motivated.', author: 'David H.', rating: 5 },
      { text: 'Best gym I\'ve ever been to. Clean, great equipment, and a genuinely supportive community.', author: 'Lisa M.', rating: 5 },
      { text: 'The group classes are so fun! I actually look forward to working out now.', author: 'Tom S.', rating: 4 },
    ],
  },
  'restaurant': {
    name: 'Restaurant & Dining',
    keywords: ['restaurant', 'dining', 'cafe', 'food', 'bistro', 'bar', 'lounge', 'catering', 'bakery', 'kitchen'],
    heroHeadline: 'A Culinary Experience Like No Other',
    heroSubheadline: 'Fresh ingredients, creative dishes, and an atmosphere you\'ll love — reserve your table today',
    heroCta: 'Reserve a Table',
    aboutTitle: 'Our Story',
    aboutContent: 'From farm-fresh ingredients to carefully crafted dishes, every meal at our restaurant is a celebration of flavor. Our passionate chefs combine traditional techniques with modern creativity to deliver an unforgettable dining experience.',
    seoTitle: 'Restaurant — Reserve Your Table',
    seoDescription: 'Fine dining experience with seasonal menus and a warm atmosphere. Reserve your table online.',
    servicesTitle: 'Dining Experiences',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.ABOUT, SectionType.GALLERY, SectionType.TESTIMONIALS, SectionType.FAQ, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'Do you accommodate dietary requirements?', answer: 'Absolutely! We offer vegetarian, vegan, gluten-free, and other dietary options. Please let us know when booking.' },
      { question: 'Can I book for large groups?', answer: 'Yes! We can accommodate groups of up to 30 guests. Contact us for private dining options.' },
      { question: 'Is parking available?', answer: 'We have a dedicated parking lot with ample space for our guests.' },
    ],
    testimonials: [
      { text: 'The best dining experience I\'ve had in years. Every dish was an absolute masterpiece.', author: 'Robert C.', rating: 5 },
      { text: 'Perfect for date night! Intimate atmosphere, excellent food, and wonderful service.', author: 'Maria G.', rating: 5 },
      { text: 'We had our anniversary dinner here and it was absolutely perfect. Highly recommend!', author: 'James & Sue P.', rating: 5 },
    ],
  },
  'medical': {
    name: 'Medical & Health',
    keywords: ['medical', 'clinic', 'doctor', 'dental', 'dentist', 'therapy', 'physiotherapy', 'health', 'chiropractic', 'optometry'],
    heroHeadline: 'Your Health, Our Priority',
    heroSubheadline: 'Experienced professionals, modern facilities, and compassionate care — schedule your visit today',
    heroCta: 'Book Appointment',
    aboutTitle: 'Trusted Healthcare',
    aboutContent: 'Our team of experienced healthcare professionals is committed to providing the highest quality care in a comfortable, modern environment. We use the latest technology and evidence-based approaches to ensure the best outcomes for our patients.',
    seoTitle: 'Healthcare Clinic — Schedule Your Appointment',
    seoDescription: 'Professional healthcare clinic. Experienced doctors, modern facilities. Book your appointment online.',
    servicesTitle: 'Our Services',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.ABOUT, SectionType.TEAM, SectionType.TESTIMONIALS, SectionType.FAQ, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'What insurance do you accept?', answer: 'We accept most major insurance providers. Contact our office for specific coverage details.' },
      { question: 'How long is a typical appointment?', answer: 'Most appointments are 30–60 minutes depending on the service. Your first visit may take slightly longer.' },
      { question: 'Is the facility wheelchair accessible?', answer: 'Yes, our facility is fully accessible with ramps, wide doorways, and accessible restrooms.' },
    ],
    testimonials: [
      { text: 'A truly caring team that takes the time to listen and explain everything clearly.', author: 'Patricia D.', rating: 5 },
      { text: 'Modern facility, minimal wait times, and excellent care. Highly recommended!', author: 'Thomas W.', rating: 5 },
      { text: 'I was nervous about my visit but the staff made me feel completely at ease. Thank you!', author: 'Nancy H.', rating: 5 },
    ],
  },
  'education': {
    name: 'Education & Tutoring',
    keywords: ['tutoring', 'education', 'school', 'classes', 'workshop', 'lesson', 'course', 'training', 'academy', 'coaching'],
    heroHeadline: 'Unlock Your Full Potential',
    heroSubheadline: 'Expert instructors, personalized learning, and proven results — enroll in your first session today',
    heroCta: 'Book a Class',
    aboutTitle: 'Learning Without Limits',
    aboutContent: 'Our dedicated educators are passionate about helping every student succeed. With personalized attention, proven teaching methods, and a supportive learning environment, we help students build confidence and achieve their academic goals.',
    seoTitle: 'Education Center — Book Your Session',
    seoDescription: 'Expert tutoring and educational programs. Personalized learning for all levels. Book online.',
    servicesTitle: 'Programs & Classes',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.ABOUT, SectionType.TEAM, SectionType.TESTIMONIALS, SectionType.PRICING, SectionType.FAQ, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'What age groups do you teach?', answer: 'We offer programs for students from elementary through adult education.' },
      { question: 'Can I book a trial session?', answer: 'Yes! We offer a complimentary trial session so you can experience our teaching style before committing.' },
      { question: 'Do you offer online classes?', answer: 'We offer both in-person and online sessions to accommodate your schedule and preferences.' },
    ],
    testimonials: [
      { text: 'My son\'s grades improved dramatically after just a few sessions. The tutors are fantastic!', author: 'Karen B.', rating: 5 },
      { text: 'Flexible scheduling and excellent instruction. Best investment in my education.', author: 'Chris L.', rating: 5 },
      { text: 'The personalized approach really works. I feel more confident in every subject now.', author: 'Amanda F.', rating: 4 },
    ],
  },
  'photography': {
    name: 'Photography Studio',
    keywords: ['photography', 'photo', 'portrait', 'studio', 'photographer', 'headshot', 'wedding photo', 'event photo'],
    heroHeadline: 'Capturing Moments That Last Forever',
    heroSubheadline: 'Professional photography for every occasion — portraits, events, and creative shoots',
    heroCta: 'Book a Shoot',
    aboutTitle: 'Through Our Lens',
    aboutContent: 'With years of professional experience and a passion for storytelling, we capture the moments that matter most. From intimate portraits to grand events, our studio delivers stunning imagery that you\'ll treasure forever.',
    seoTitle: 'Photography Studio — Book Your Session',
    seoDescription: 'Professional photography studio. Portraits, events, creative shoots. Book online.',
    servicesTitle: 'Photography Packages',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.GALLERY, SectionType.ABOUT, SectionType.PRICING, SectionType.TESTIMONIALS, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'How long is a typical session?', answer: 'Sessions range from 30 minutes for headshots to several hours for events and creative shoots.' },
      { question: 'When will I get my photos?', answer: 'Edited photos are typically delivered within 7–14 business days via our online gallery.' },
      { question: 'Can I request specific edits?', answer: 'Each package includes professional editing. Additional retouching can be arranged at an extra cost.' },
    ],
    testimonials: [
      { text: 'Our wedding photos are absolutely breathtaking! Best decision we made for our big day.', author: 'Jessica & Mark T.', rating: 5 },
      { text: 'Professional, creative, and so easy to work with. The headshots turned out perfectly!', author: 'Daniel K.', rating: 5 },
      { text: 'The family portraits are gorgeous. We\'ll definitely be booking again next year.', author: 'The Johnson Family', rating: 5 },
    ],
  },
  'default': {
    name: 'Default Business',
    keywords: [],
    heroHeadline: 'Welcome to Our Business',
    heroSubheadline: 'Professional services, easy online booking, and an experience you\'ll love',
    heroCta: 'Book Now',
    aboutTitle: 'About Us',
    aboutContent: 'We\'re dedicated to providing exceptional service and an outstanding experience for every customer. With easy online booking and a professional team, we make it simple to get the service you need.',
    seoTitle: 'Book Your Appointment Online',
    seoDescription: 'Professional services with easy online booking. Schedule your appointment today.',
    servicesTitle: 'Our Services',
    sections: [SectionType.HERO, SectionType.SERVICES, SectionType.ABOUT, SectionType.TESTIMONIALS, SectionType.GALLERY, SectionType.CTA, SectionType.CONTACT],
    faqItems: [
      { question: 'How do I book?', answer: 'Simply click the "Book Now" button, select your preferred service and time slot, and confirm your booking.' },
      { question: 'What is your cancellation policy?', answer: 'You can cancel or reschedule up to 24 hours before your appointment at no charge.' },
      { question: 'Do you accept walk-ins?', answer: 'Walk-ins are welcome based on availability, but we recommend booking in advance to guarantee your spot.' },
    ],
    testimonials: [
      { text: 'Great service and very professional. Will definitely be coming back!', author: 'Customer', rating: 5 },
      { text: 'Easy booking process and excellent experience from start to finish.', author: 'Happy Client', rating: 5 },
      { text: 'Highly recommend! The team really goes above and beyond.', author: 'Loyal Customer', rating: 4 },
    ],
  },
};

// ─── Design Style Presets ───────────────────────────────────────────────────────

interface DesignPreset {
  name: string;
  keywords: string[];
  theme: Partial<GeneratedWebsite['theme']>;
  layout: Partial<GeneratedWebsite['layout']>;
  customCSS: string;
}

const DESIGN_PRESETS: Record<string, DesignPreset> = {
  'modern': {
    name: 'Modern',
    keywords: ['modern', 'clean', 'contemporary', 'sleek'],
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#06b6d4',
      fontFamily: 'Inter',
      borderRadius: '0.75rem',
    },
    layout: { headerStyle: 'left-aligned', footerStyle: 'minimal', maxWidth: '1280px' },
    customCSS: '',
  },
  'elegant': {
    name: 'Elegant',
    keywords: ['elegant', 'luxury', 'luxurious', 'premium', 'classy', 'sophisticated'],
    theme: {
      primaryColor: '#b8860b',
      secondaryColor: '#6b21a8',
      fontFamily: 'Playfair Display',
      borderRadius: '0.25rem',
    },
    layout: { headerStyle: 'centered', footerStyle: 'full', maxWidth: '1200px' },
    customCSS: '',
  },
  'bold': {
    name: 'Bold',
    keywords: ['bold', 'vibrant', 'energetic', 'dynamic', 'powerful', 'strong'],
    theme: {
      primaryColor: '#dc2626',
      secondaryColor: '#ea580c',
      fontFamily: 'Montserrat',
      borderRadius: '1rem',
    },
    layout: { headerStyle: 'left-aligned', footerStyle: 'full', maxWidth: '1400px' },
    customCSS: '',
  },
  'minimal': {
    name: 'Minimal',
    keywords: ['minimal', 'minimalist', 'simple', 'zen', 'understated'],
    theme: {
      primaryColor: '#18181b',
      secondaryColor: '#71717a',
      fontFamily: 'Inter',
      borderRadius: '0.375rem',
    },
    layout: { headerStyle: 'left-aligned', footerStyle: 'none', maxWidth: '1024px' },
    customCSS: '',
  },
  'playful': {
    name: 'Playful',
    keywords: ['playful', 'fun', 'colorful', 'creative', 'whimsical', 'cheerful'],
    theme: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#f59e0b',
      fontFamily: 'Nunito',
      borderRadius: '1.5rem',
    },
    layout: { headerStyle: 'centered', footerStyle: 'full', maxWidth: '1280px' },
    customCSS: '',
  },
  'dark': {
    name: 'Dark',
    keywords: ['dark', 'night', 'noir', 'cyber', 'neon'],
    theme: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#10b981',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      fontFamily: 'Rajdhani',
      borderRadius: '0.75rem',
      mode: 'dark',
    },
    layout: { headerStyle: 'transparent', footerStyle: 'full', maxWidth: '1400px' },
    customCSS: '',
  },
  'warm': {
    name: 'Warm',
    keywords: ['warm', 'cozy', 'rustic', 'earthy', 'natural', 'organic'],
    theme: {
      primaryColor: '#b45309',
      secondaryColor: '#059669',
      backgroundColor: '#fffbeb',
      textColor: '#292524',
      fontFamily: 'Lora',
      borderRadius: '0.5rem',
    },
    layout: { headerStyle: 'centered', footerStyle: 'minimal', maxWidth: '1200px' },
    customCSS: '',
  },
  'corporate': {
    name: 'Corporate',
    keywords: ['corporate', 'professional', 'business', 'formal', 'enterprise'],
    theme: {
      primaryColor: '#1e40af',
      secondaryColor: '#0d9488',
      fontFamily: 'Source Sans Pro',
      borderRadius: '0.375rem',
    },
    layout: { headerStyle: 'left-aligned', footerStyle: 'full', maxWidth: '1280px' },
    customCSS: '',
  },
};

// ─── Color palettes keyed by mood ────────────────────────────────────────────

const DARK_MODE_DEFAULTS = {
  backgroundColor: '#0f172a',
  textColor: '#f1f5f9',
};

const LIGHT_MODE_DEFAULTS = {
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

// ─── Generator ──────────────────────────────────────────────────────────────────

export function generateWebsiteConfig(
  businessType?: string,
  designStyle?: string,
  prompt?: string,
): GeneratedWebsite {
  // 1. Resolve business profile
  const profile = resolveBusinessProfile(businessType, prompt);

  // 2. Resolve design preset
  const design = resolveDesignPreset(designStyle, prompt);

  // 3. Merge theme
  const isDark = design.theme.mode === 'dark';
  const modeDefaults = isDark ? DARK_MODE_DEFAULTS : LIGHT_MODE_DEFAULTS;

  const theme: GeneratedWebsite['theme'] = {
    primaryColor: design.theme.primaryColor || '#6366f1',
    secondaryColor: design.theme.secondaryColor || '#f59e0b',
    backgroundColor: design.theme.backgroundColor || modeDefaults.backgroundColor,
    textColor: design.theme.textColor || modeDefaults.textColor,
    fontFamily: design.theme.fontFamily || 'Inter',
    borderRadius: design.theme.borderRadius || '0.5rem',
    mode: design.theme.mode || 'light',
  };

  // Extract explicit color from prompt if present
  if (prompt) {
    const colorMatch = prompt.toLowerCase().match(/#[0-9a-f]{6}/);
    if (colorMatch) {
      theme.primaryColor = colorMatch[0];
    }
  }

  // 4. Build layout
  const layout: GeneratedWebsite['layout'] = {
    headerStyle: design.layout.headerStyle || 'left-aligned',
    footerStyle: design.layout.footerStyle || 'minimal',
    maxWidth: design.layout.maxWidth || '1280px',
  };

  // 5. Build sections with rich content from the profile
  const sections = profile.sections.map((type, index) => ({
    type,
    order: index,
    isVisible: true,
    config: buildSectionConfig(type, profile, theme),
  }));

  // 6. SEO
  const seo = {
    title: profile.seoTitle,
    description: profile.seoDescription,
    ogImage: '',
    favicon: '',
  };

  return {
    theme,
    layout,
    sections,
    seo,
    customCSS: design.customCSS || '',
    customHeadHTML: '',
  };
}

function resolveBusinessProfile(
  businessType?: string,
  prompt?: string,
): BusinessProfile {
  // First try exact match on businessType
  if (businessType) {
    const normalized = businessType.toLowerCase().replace(/\s+/g, '-');
    if (BUSINESS_PROFILES[normalized]) {
      return BUSINESS_PROFILES[normalized];
    }
  }

  // Try keyword matching across all profiles
  const text = [businessType, prompt].filter(Boolean).join(' ').toLowerCase();

  let bestMatch: { key: string; score: number } = { key: 'default', score: 0 };

  for (const [key, profile] of Object.entries(BUSINESS_PROFILES)) {
    if (key === 'default') continue;
    const score = profile.keywords.reduce(
      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
      0,
    );
    if (score > bestMatch.score) {
      bestMatch = { key, score };
    }
  }

  return BUSINESS_PROFILES[bestMatch.key];
}

function resolveDesignPreset(
  designStyle?: string,
  prompt?: string,
): DesignPreset {
  // First try exact match
  if (designStyle) {
    const normalized = designStyle.toLowerCase().replace(/\s+/g, '-');
    if (DESIGN_PRESETS[normalized]) {
      return DESIGN_PRESETS[normalized];
    }
  }

  // Try keyword matching
  const text = [designStyle, prompt].filter(Boolean).join(' ').toLowerCase();

  let bestMatch: { key: string; score: number } = { key: 'modern', score: 0 };

  for (const [key, preset] of Object.entries(DESIGN_PRESETS)) {
    const score = preset.keywords.reduce(
      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
      0,
    );
    if (score > bestMatch.score) {
      bestMatch = { key, score };
    }
  }

  return DESIGN_PRESETS[bestMatch.key];
}

function buildSectionConfig(
  type: SectionType,
  profile: BusinessProfile,
  theme: GeneratedWebsite['theme'],
): Record<string, any> {
  switch (type) {
    case SectionType.HERO:
      return {
        headline: profile.heroHeadline,
        subtitle: profile.heroSubheadline,
        ctaText: profile.heroCta,
        ctaLink: '#services',
        backgroundStyle: theme.mode === 'dark' ? 'gradient' : 'gradient',
        overlayOpacity: 0.5,
      };
    case SectionType.SERVICES:
      return {
        title: profile.servicesTitle,
        layout: 'grid',
        columns: 3,
        showPrice: true,
        showDuration: true,
        showCapacity: true,
      };
    case SectionType.ABOUT:
      return {
        title: profile.aboutTitle,
        content: profile.aboutContent,
        showImage: true,
        layout: 'side-by-side',
      };
    case SectionType.TESTIMONIALS:
      return {
        title: 'What Our Customers Say',
        layout: 'grid',
        maxItems: 6,
        items: profile.testimonials,
      };
    case SectionType.GALLERY:
      return {
        title: 'Gallery',
        layout: 'masonry',
        columns: 3,
        maxImages: 12,
        images: [],
      };
    case SectionType.CONTACT:
      return {
        title: 'Get in Touch',
        showMap: true,
        showForm: true,
        showPhone: true,
        showEmail: true,
      };
    case SectionType.FAQ:
      return {
        title: 'Frequently Asked Questions',
        items: profile.faqItems,
      };
    case SectionType.PRICING:
      return {
        title: 'Pricing',
        layout: 'cards',
        showComparison: false,
      };
    case SectionType.TEAM:
      return {
        title: 'Meet Our Team',
        layout: 'grid',
        columns: 4,
        members: [],
      };
    case SectionType.CTA:
      return {
        title: 'Ready to Get Started?',
        subtitle: 'Book your appointment today and experience the difference.',
        buttonText: profile.heroCta,
      };
    case SectionType.CUSTOM:
      return { html: '' };
    default:
      return {};
  }
}

/** Returns the list of available business types for the UI picker */
export function getBusinessTypes(): { id: string; name: string; icon: string }[] {
  return [
    { id: 'gaming-lounge', name: 'Gaming Lounge', icon: '🎮' },
    { id: 'salon', name: 'Salon & Spa', icon: '💇' },
    { id: 'fitness', name: 'Fitness & Gym', icon: '💪' },
    { id: 'restaurant', name: 'Restaurant & Dining', icon: '🍽️' },
    { id: 'medical', name: 'Medical & Health', icon: '🏥' },
    { id: 'education', name: 'Education & Tutoring', icon: '📚' },
    { id: 'photography', name: 'Photography Studio', icon: '📷' },
    { id: 'default', name: 'Other', icon: '🏢' },
  ];
}

/** Returns the list of available design styles for the UI picker */
export function getDesignStyles(): { id: string; name: string; description: string; preview: { primary: string; secondary: string; bg: string; mode: string } }[] {
  return Object.entries(DESIGN_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name,
    description: `${preset.name} design with ${preset.theme.fontFamily || 'Inter'} font`,
    preview: {
      primary: preset.theme.primaryColor || '#6366f1',
      secondary: preset.theme.secondaryColor || '#f59e0b',
      bg: preset.theme.backgroundColor || '#ffffff',
      mode: preset.theme.mode || 'light',
    },
  }));
}
