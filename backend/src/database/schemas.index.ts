// ─── Schema barrel exports ──────────────────────────────────────────────────────

export { User, UserSchema, UserDocument, UserRole } from '../modules/users/schemas/user.schema';
export { Tenant, TenantSchema, TenantDocument, TenantPlan, TenantStatus } from '../modules/tenants/schemas/tenant.schema';
export { Service, ServiceSchema, ServiceDocument } from '../modules/services/schemas/service.schema';
export { TimeSlot, TimeSlotSchema, TimeSlotDocument, SlotStatus } from '../modules/time-slots/schemas/time-slot.schema';
export { Booking, BookingSchema, BookingDocument, BookingStatus } from '../modules/bookings/schemas/booking.schema';
export { WebsiteConfig, WebsiteConfigSchema, WebsiteConfigDocument, WebsiteStatus, SectionType } from '../modules/website-config/schemas/website-config.schema';
export { Payment, PaymentSchema, PaymentDocument, PaymentStatus, PaymentProvider } from '../modules/payments/schemas/payment.schema';
export { Domain, DomainSchema, DomainDocument, SslStatus } from '../modules/domains/schemas/domain.schema';
export { Review, ReviewSchema, ReviewDocument } from '../modules/reviews/schemas/review.schema';
export { ServiceRequest, ServiceRequestSchema, ServiceRequestDocument, ServiceRequestStatus, ServiceCategory } from '../modules/service-requests/schemas/service-request.schema';
export { TrackingSession, TrackingSessionSchema, TrackingSessionDocument, TrackingStatus } from '../modules/service-requests/schemas/tracking-session.schema';
