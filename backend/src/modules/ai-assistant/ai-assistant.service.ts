import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { Service } from '../services/schemas/service.schema';
import { SetupWizard } from '../setup-wizard/schemas/setup-wizard.schema';
import {
  AiChatDto,
  AiContextType,
  FloorPlannerDto,
  ConfusionDetectDto,
} from './dto/ai-assistant.dto';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(Service.name) private serviceModel: Model<Service>,
    @InjectModel(SetupWizard.name) private wizardModel: Model<SetupWizard>,
  ) {
    this.apiKey = this.config.get<string>('ai.anthropicApiKey', '');
    this.model = this.config.get<string>('ai.model', 'claude-sonnet-4-20250514');
    this.maxTokens = this.config.get<number>('ai.maxTokens', 4096);
    this.enabled = this.config.get<boolean>('ai.enabled', false);
  }

  // ─── System prompt with full Bokingo knowledge ─────────────────────────────

  private getSystemPrompt(context: AiContextType, extras?: Record<string, any>): string {
    const base = `You are Bokingo AI — the friendly, expert setup assistant for the Bokingo booking platform.
You help business owners set up their booking websites quickly and correctly.

## About Bokingo
Bokingo is an instant booking platform where businesses (gaming lounges, salons, turfs, fitness studios, restaurants, hotels, co-working spaces, etc.) create their own booking page. Customers discover and book slots in real-time.

## Key Concepts
- **Services/Devices**: The bookable items. A gaming lounge has PS5 stations, PCs, VR pods. A salon has chairs. A turf has fields. A hotel has rooms.
- **Slots**: Time blocks when services are available. Generated from business hours + slot duration.
- **Capacity**: Each service has devices/units. Each device can have max players. E.g., "PS5 Station" × 4 devices × 2 players each = 8 max total players per slot.
- **Booking Modes**: "slot" (hourly booking) or "date-range" (hotel-style check-in/out).
- **Exclusive mode**: One booking fills the entire slot (turfs, party halls).
- **Duration tiers**: Different prices for different durations (30min ₹200, 1hr ₹350, 2hr ₹600).
- **Plans**: Free, Standard, AI, Full Service — each with different features.

## Business Types & Their Typical Setup
- **Gaming Lounge**: PS5, PS4, Xbox, PC, VR, Simulator stations. Each has multiple devices. Players per device varies (1 for VR, 2–4 for consoles).
- **Salon/Spa**: Hair stations, facial rooms, massage tables. Usually 1 person per station.
- **Turf/Sports**: Football field, cricket pitch, badminton court. Usually exclusive booking.
- **Fitness/Gym**: Class slots, personal training slots. Group classes have capacity.
- **Restaurant**: Tables (2-seater, 4-seater, 6-seater). Can be exclusive or shared.
- **Hotel**: Rooms with date-range booking. Deluxe, Suite, Standard types.
- **Co-working**: Desks, meeting rooms, phone booths. Desks are shared, rooms are exclusive.
- **Photography Studio**: Studio rooms, outdoor areas. Usually exclusive.
- **Party Hall**: Banquet halls, event spaces. Always exclusive.

## Setup Wizard Steps (in order)
1. **Business Type** — Pick category (gaming-lounge, salon, turf, fitness, hotel, restaurant, co-working, party-hall, photography, education, other)
2. **Location** — Address + Google Maps coordinates
3. **Business Hours** — Open/close times per day of week
4. **Services** — Add your bookable items (devices/rooms/stations) with name, quantity, capacity
5. **Slot Config** — Duration (15–120 min), buffer time, notice period, advance booking window
6. **Pricing** — Set prices per service, with optional duration tiers
7. **Payment** — Online (Razorpay) and/or pay-at-shop
8. **Customer Fields** — What info to collect (name, phone, email, custom fields)
9. **Review & Launch** — Review all steps, finalize, choose plan

## Floor Planning
When helping with floor layout, think about:
- Flow: entrance → reception → main area → amenities
- Spacing between stations/devices for comfort
- Power/network access points
- Customer waiting area
- Staff accessibility
- Emergency exits

Keep responses concise, helpful, and friendly. Use bullet points for lists. If the user seems confused, proactively explain what they need to do and why.
Never reveal you're Claude or mention Anthropic. You are "Bokingo AI".`;

    if (context === AiContextType.SETUP_WIZARD && extras?.currentStep) {
      return `${base}\n\n## Current Context\nThe user is on step "${extras.currentStep}" of the setup wizard.\nTheir current wizard data: ${JSON.stringify(extras.wizardData || {}, null, 2)}\n\nHelp them specifically with this step. If they seem stuck, explain what this step needs and give examples based on their business type.`;
    }

    if (context === AiContextType.FLOOR_PLANNER) {
      return `${base}\n\n## Current Context\nThe user is using the floor planner to layout their business space.\nBusiness category: ${extras?.category || 'unknown'}\n\nHelp them design an optimal layout. When generating a floor plan, respond with a JSON block in this format:\n\`\`\`json\n{"items": [{"id": "unique-id", "type": "device|furniture|zone", "name": "PS5 Station 1", "x": 100, "y": 200, "width": 80, "height": 60, "rotation": 0, "color": "#hex"}], "dimensions": {"width": 800, "height": 600}}\n\`\`\`\nProvide the JSON along with explanations. Dimensions are in pixels (1px ≈ 5cm real-world).`;
    }

    return base;
  }

  // ─── Call Claude API ───────────────────────────────────────────────────────

  private async callClaude(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    if (!this.enabled || !this.apiKey) {
      return 'AI assistant is currently unavailable. Please contact support or continue setting up manually — each step has helpful tips built in!';
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        this.logger.error(`Claude API error: ${response.status} — ${err}`);
        return 'I\'m having a moment — please try again in a few seconds!';
      }

      const data = await response.json();
      return data.content?.[0]?.text || 'I couldn\'t generate a response. Please try again.';
    } catch (error) {
      this.logger.error('Claude API call failed', error);
      return 'Connection issue — please try again shortly.';
    }
  }

  // ─── Chat endpoint ─────────────────────────────────────────────────────────

  async chat(tenantId: string, dto: AiChatDto): Promise<{ reply: string }> {
    const history = dto.conversationHistory || [];
    const messages = [
      ...history,
      { role: 'user' as const, content: dto.message },
    ];

    const systemPrompt = this.getSystemPrompt(dto.context, {
      currentStep: dto.currentStep,
      wizardData: dto.wizardData,
    });

    const reply = await this.callClaude(systemPrompt, messages);
    return { reply };
  }

  // ─── Floor planner generation ──────────────────────────────────────────────

  async generateFloorPlan(
    tenantId: string,
    dto: FloorPlannerDto,
  ): Promise<{ reply: string; layout?: any }> {
    const systemPrompt = this.getSystemPrompt(AiContextType.FLOOR_PLANNER, {
      category: dto.category,
    });

    const userMessage = dto.existingLayout
      ? `I have an existing layout: ${JSON.stringify(dto.existingLayout)}. ${dto.description}`
      : dto.description;

    const reply = await this.callClaude(systemPrompt, [
      { role: 'user', content: userMessage },
    ]);

    // Try to extract JSON layout from the response
    let layout: any = null;
    const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        layout = JSON.parse(jsonMatch[1]);
      } catch {
        // Layout couldn't be parsed — still return the text
      }
    }

    return { reply, layout };
  }

  // ─── Confusion detection — returns a proactive help message ────────────────

  async detectConfusion(
    tenantId: string,
    dto: ConfusionDetectDto,
  ): Promise<{ shouldHelp: boolean; message?: string }> {
    const timeThreshold = 60; // seconds before considering confused
    const tooLong = (dto.timeOnStep || 0) > timeThreshold;

    // Check for repeated back-and-forth or empty data
    const actions = dto.userActions || [];
    const repeatedActions =
      actions.length >= 4 &&
      new Set(actions.slice(-4)).size <= 2;

    if (!tooLong && !repeatedActions) {
      return { shouldHelp: false };
    }

    // Generate a contextual help message
    const stepHints: Record<string, string> = {
      business_type:
        "Looks like you're deciding on a category. Pick the one closest to your main service — you can always adjust later!",
      location:
        "Need help with location? Just paste your Google Maps link and we'll extract the coordinates automatically!",
      business_hours:
        'Tip: Use "Same hours every day" to set it once, then customize specific days if needed.',
      services:
        "This is where you add what customers can book. For example, a gaming lounge adds PS5 stations, PCs, VR pods. Each with a quantity (how many you have) and capacity (max players per device). Want me to help set this up?",
      slot_config:
        'Slot duration is how long each booking lasts. 60 min is standard for most businesses. Buffer time (5–10 min) gives you time between bookings for cleanup.',
      pricing:
        "Set a base price per service. You can add duration tiers too — e.g., 30min ₹200, 1hr ₹350. This gives customers flexible options.",
      payment_method:
        'You need at least one payment method. "Pay at shop" is the simplest to start with. Add online payments (Razorpay) when you\'re ready.',
      customer_fields:
        'Name and phone are usually enough. Add email if you want to send confirmation emails. Custom fields are optional — use them for special needs.',
      review_create:
        "Review each section — if something looks off, click Edit to go back. When everything's green, hit Launch!",
    };

    const hint = stepHints[dto.currentStep];
    if (hint) {
      return { shouldHelp: true, message: hint };
    }

    // Fallback: ask Claude for help
    const systemPrompt = this.getSystemPrompt(AiContextType.SETUP_WIZARD, {
      currentStep: dto.currentStep,
      wizardData: dto.wizardData,
    });

    const reply = await this.callClaude(systemPrompt, [
      {
        role: 'user',
        content: `I've been on the "${dto.currentStep}" step for a while and seem stuck. What should I do here? Keep it under 3 sentences.`,
      },
    ]);

    return { shouldHelp: true, message: reply };
  }

  // ─── Smart suggestions for services based on category ──────────────────────

  async suggestServices(
    category: string,
  ): Promise<{ suggestions: any[] }> {
    const presets: Record<string, any[]> = {
      'gaming-lounge': [
        { name: 'PS5 Station', numberOfDevices: 4, maxPlayersPerDevice: 2, icon: '🎮' },
        { name: 'Gaming PC', numberOfDevices: 6, maxPlayersPerDevice: 1, icon: '🖥️' },
        { name: 'VR Pod', numberOfDevices: 2, maxPlayersPerDevice: 1, icon: '🥽' },
        { name: 'Racing Simulator', numberOfDevices: 2, maxPlayersPerDevice: 1, icon: '🏎️' },
        { name: 'Xbox Station', numberOfDevices: 3, maxPlayersPerDevice: 2, icon: '🕹️' },
        { name: 'Nintendo Switch', numberOfDevices: 2, maxPlayersPerDevice: 4, icon: '🎯' },
      ],
      salon: [
        { name: 'Hair Station', numberOfDevices: 4, maxPlayersPerDevice: 1, icon: '💇' },
        { name: 'Facial Room', numberOfDevices: 2, maxPlayersPerDevice: 1, icon: '✨' },
        { name: 'Massage Table', numberOfDevices: 3, maxPlayersPerDevice: 1, icon: '💆' },
        { name: 'Nail Station', numberOfDevices: 2, maxPlayersPerDevice: 1, icon: '💅' },
        { name: 'Pedicure Chair', numberOfDevices: 2, maxPlayersPerDevice: 1, icon: '🦶' },
      ],
      turf: [
        { name: 'Football Field', numberOfDevices: 1, maxPlayersPerDevice: 14, isExclusive: true, icon: '⚽' },
        { name: 'Cricket Pitch', numberOfDevices: 1, maxPlayersPerDevice: 22, isExclusive: true, icon: '🏏' },
        { name: 'Badminton Court', numberOfDevices: 2, maxPlayersPerDevice: 4, isExclusive: true, icon: '🏸' },
        { name: 'Tennis Court', numberOfDevices: 1, maxPlayersPerDevice: 4, isExclusive: true, icon: '🎾' },
      ],
      fitness: [
        { name: 'Yoga Class', numberOfDevices: 1, maxPlayersPerDevice: 20, icon: '🧘' },
        { name: 'Personal Training', numberOfDevices: 3, maxPlayersPerDevice: 1, icon: '💪' },
        { name: 'Spin Class', numberOfDevices: 1, maxPlayersPerDevice: 15, icon: '🚴' },
        { name: 'CrossFit Session', numberOfDevices: 1, maxPlayersPerDevice: 12, icon: '🏋️' },
      ],
      restaurant: [
        { name: '2-Seater Table', numberOfDevices: 6, maxPlayersPerDevice: 2, icon: '🪑' },
        { name: '4-Seater Table', numberOfDevices: 4, maxPlayersPerDevice: 4, icon: '🍽️' },
        { name: '6-Seater Table', numberOfDevices: 2, maxPlayersPerDevice: 6, icon: '🪑' },
        { name: 'Private Dining Room', numberOfDevices: 1, maxPlayersPerDevice: 12, isExclusive: true, icon: '🥂' },
      ],
      hotel: [
        { name: 'Standard Room', numberOfDevices: 10, maxPlayersPerDevice: 2, bookingMode: 'date-range', icon: '🛏️' },
        { name: 'Deluxe Room', numberOfDevices: 5, maxPlayersPerDevice: 2, bookingMode: 'date-range', icon: '🏨' },
        { name: 'Suite', numberOfDevices: 2, maxPlayersPerDevice: 4, bookingMode: 'date-range', icon: '👑' },
      ],
      'co-working': [
        { name: 'Hot Desk', numberOfDevices: 20, maxPlayersPerDevice: 1, icon: '💻' },
        { name: 'Meeting Room (4p)', numberOfDevices: 3, maxPlayersPerDevice: 4, isExclusive: true, icon: '🤝' },
        { name: 'Meeting Room (8p)', numberOfDevices: 2, maxPlayersPerDevice: 8, isExclusive: true, icon: '📊' },
        { name: 'Phone Booth', numberOfDevices: 4, maxPlayersPerDevice: 1, isExclusive: true, icon: '📞' },
      ],
      'party-hall': [
        { name: 'Main Hall', numberOfDevices: 1, maxPlayersPerDevice: 200, isExclusive: true, icon: '🎉' },
        { name: 'VIP Lounge', numberOfDevices: 1, maxPlayersPerDevice: 30, isExclusive: true, icon: '🥂' },
        { name: 'Garden Area', numberOfDevices: 1, maxPlayersPerDevice: 100, isExclusive: true, icon: '🌿' },
      ],
      photography: [
        { name: 'Studio A', numberOfDevices: 1, maxPlayersPerDevice: 6, isExclusive: true, icon: '📸' },
        { name: 'Studio B', numberOfDevices: 1, maxPlayersPerDevice: 4, isExclusive: true, icon: '🎬' },
        { name: 'Outdoor Set', numberOfDevices: 1, maxPlayersPerDevice: 8, isExclusive: true, icon: '🌅' },
      ],
    };

    return { suggestions: presets[category] || [] };
  }
}
