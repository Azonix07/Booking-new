// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'client_admin' | 'customer';

export type SubscriptionPlan = 'free' | 'standard' | 'ai' | 'full_service';
export type SubscriptionStatus = 'pending' | 'active' | 'rejected' | 'expired';

export type FullServiceRequestStatus =
  | 'pending'
  | 'contacted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface FullServiceRequest {
  _id: string;
  businessName: string;
  businessType: string;
  businessDescription: string;
  features: string[];
  designPreferences: string;
  targetAudience: string;
  existingWebsite: string;
  budget: number | null;
  timeline: string;
  additionalNotes: string;
  contact: { name: string; email: string; phone: string };
  status: FullServiceRequestStatus;
  adminNotes: string;
  deliveredDomain: string;
  assignedTo?: { name: string; email: string } | string | null;
  contactedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface OnboardingStatus {
  setupCompleted: boolean;
  tenantStatus: 'active' | 'suspended' | 'pending_setup';
  tenantPlan: string;
  subscription: {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    rejectionReason: string | null;
  } | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  tenantId?: string | null;
  avatar?: string;
  isActive: boolean;
  onboarding?: OnboardingStatus | null;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Tenant / Shop ───────────────────────────────────────────────────────────
export interface BusinessHoursEntry {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface ShopSettings {
  slotInterval: number;
  minBookingNotice: number;
  maxAdvanceBooking: number;
  allowWalkIns: boolean;
  requirePaymentUpfront: boolean;
  cancellationPolicy: string;
  cancellationWindowHours: number;
  currency: string;
  timezone: string;
}

export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location: { type: string; coordinates: [number, number] };
  address: { street: string; city: string; state: string; zip: string; country: string };
  branding: { logo: string; coverImage: string; primaryColor: string; secondaryColor: string };
  businessHours: BusinessHoursEntry[];
  shopSettings: ShopSettings;
  rating: { average: number; count: number };
  customDomain?: string;
  plan: SubscriptionPlan;
  status: 'active' | 'suspended' | 'pending_setup';
  isPublished: boolean;
  tags: string[];
}

// ─── Service / Device ────────────────────────────────────────────────────────
export interface DurationOption {
  minutes: number;
  label: string;
  price: number;
}

export type BookingMode = 'slot' | 'date-range';

export interface Service {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  bookingMode: BookingMode;
  isExclusive: boolean;
  numberOfDevices: number;
  maxPlayersPerDevice: number;
  maxTotalPlayers: number;
  defaultDuration: number;
  bufferTime: number;
  durationOptions: DurationOption[];
  price: number;
  pricePerAdditionalPerson: number;
  currency: string;
  minPersons: number;
  maxPersons: number;
  sortOrder: number;
  isActive: boolean;
  // Room / accommodation fields
  totalUnits?: number;
  unitType?: string;
  pricePerNight?: number;
  checkInTime?: string;
  checkOutTime?: string;
  amenities?: string[];
  // Facility fields (turfs, courts)
  facilityType?: string;
  surfaceType?: string;
}

// ─── Time Slots ──────────────────────────────────────────────────────────────
export type SlotStatus = 'available' | 'filling' | 'full' | 'blocked';

export interface SlotView {
  slotId: string;
  startTime: string;
  endTime: string;
  maxPlayers: number;
  bookedPlayers: number;
  availablePlayers: number;
  status: SlotStatus;
  canBook: boolean;
}

// ─── Booking ─────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'refunded';

export interface Booking {
  _id: string;
  tenantId: string;
  serviceId: string | Service;
  customerId: string | User;
  bookingMode: BookingMode;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  numberOfPersons: number;
  slotIds: string[];
  // Date-range fields (rooms/hotels)
  checkInDate?: string;
  checkOutDate?: string;
  numberOfNights?: number;
  numberOfUnits?: number;
  status: BookingStatus;
  paymentId?: string;
  totalAmount: number;
  currency: string;
  customerNotes: string;
  bookingRef: string;
  createdAt: string;
}

export interface DateAvailability {
  date: string;
  totalUnits: number;
  bookedUnits: number;
  available: number;
}

// ─── Payments ────────────────────────────────────────────────────────────────
export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingRef: string;
}

export interface PaymentVerification {
  bookingId: string;
  bookingRef: string;
  paymentId: string;
  status: string;
}

// ─── Website Config ──────────────────────────────────────────────────────────
export type SectionType =
  | 'hero' | 'services' | 'about' | 'testimonials'
  | 'gallery' | 'contact' | 'faq' | 'pricing'
  | 'team' | 'cta' | 'custom';

export interface WebsiteSection {
  type: SectionType;
  order: number;
  isVisible: boolean;
  config: Record<string, any>;
}

export interface WebsiteTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  mode: 'light' | 'dark';
}

export interface WebsiteConfig {
  _id: string;
  tenantId: string;
  prompt: string;
  theme: WebsiteTheme;
  layout: { headerStyle: string; footerStyle: string; maxWidth: string };
  sections: WebsiteSection[];
  seo: { title: string; description: string; ogImage: string; favicon: string };
  customCSS: string;
  customHeadHTML: string;
  status: 'draft' | 'published';
  generationCount: number;
}

// ─── Marketplace ─────────────────────────────────────────────────────────────
export interface MarketplaceBusiness extends Tenant {
  distanceKm?: number;
  phone?: string;
  email?: string;
  website?: string;
  reviewCount?: number;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  customerId: { name: string; avatar?: string };
  serviceId: { name: string };
  reply?: { text: string; repliedAt: string };
  createdAt: string;
}

export interface StorefrontData {
  tenant: Tenant;
  services: Service[];
  reviews: Review[];
  customDomain: string | null;
  shouldRedirect: boolean;
  redirectUrl: string | null;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export interface DashboardStats {
  period: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalPlayers: number;
  todaysBookings: number;
  upcomingBookings: number;
  activeServices: number;
}

// ─── API Response wrapper ────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
