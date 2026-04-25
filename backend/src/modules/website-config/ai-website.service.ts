import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateWebsiteConfig } from './ai-website-generator';

/**
 * AI Website Generation Service
 *
 * Uses Claude Opus 4.5 for top-quality website generation.
 *
 * Token efficiency: the static schema is sent as a CACHED system prompt block
 * (cache_control: ephemeral). After the first call the schema reads at ~10%
 * cost, so a second/third generation is cheap even on Opus.
 *
 * Falls back to the template-based generator on any error so users always get
 * a website.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Schema kept terse — Opus understands JSON structure from minimal hints.
// Cache-friendly: this exact string is stable across requests.
const SCHEMA_SYSTEM = `You are a senior product designer + copywriter. Output ONE JSON object — no markdown, no commentary.

Schema:
{
  "theme": { "primaryColor": "#hex", "secondaryColor": "#hex", "backgroundColor": "#hex", "textColor": "#hex", "fontFamily": "<Google Font>", "borderRadius": "0.75rem", "mode": "light"|"dark" },
  "layout": { "headerStyle": "centered"|"left-aligned"|"transparent", "footerStyle": "minimal"|"full"|"none", "maxWidth": "1280px" },
  "sections": [{ "type": <see below>, "order": <int>, "isVisible": true, "config": {...} }],
  "seo": { "title": "<60ch>", "description": "<155ch>", "ogImage": "", "favicon": "" },
  "customCSS": "",
  "customHeadHTML": ""
}

Section types & config keys (use ALL relevant keys; copy must be specific & vivid, NOT generic):
- hero: { headline, subtitle, ctaText }
- services: { title, columns: 3, showPrice: true, showDuration: true, showCapacity: true }
- about: { title, content (~80 words), layout: "side-by-side", showImage: true }
- pricing: { title, subtitle }
- testimonials: { title, items: [{ text (~25 words), author, rating }] } — exactly 3 items
- gallery: { title, columns: 3 }
- faq: { title, items: [{ question, answer }] } — exactly 5 items
- contact: { title, phone: "+91 ...", email, address, showMap: true, showForm: true }
- cta: { title, subtitle, buttonText }

Required output:
- 7 sections, ordered: hero(1), services(2), about(3), pricing(4), testimonials(5), faq(6), cta(7)
- Real Google Font (e.g. "Inter", "Plus Jakarta Sans", "DM Sans", "Manrope")
- Theme palette: harmonious, accessible (WCAG AA), feels premium
- Copy: punchy, benefit-led, written for the SPECIFIC business — never "we offer great service"
- Headlines under 8 words. Subtitles under 18 words.
- Testimonials: include first names + last initial, varied ratings 4-5
- FAQ: actually-useful questions a real customer would ask`;

@Injectable()
export class AiWebsiteService {
  private readonly logger = new Logger(AiWebsiteService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.anthropicApiKey') || '';
    this.model = this.configService.get<string>('ai.model') || 'claude-opus-4-5-20250929';
    this.maxTokens = this.configService.get<number>('ai.maxTokens') || 3000;
    this.enabled = this.configService.get<boolean>('ai.enabled') || false;
  }

  /**
   * Generate a website config using Claude Opus.
   * Falls back to template system on any failure.
   */
  async generateWebsiteConfigWithAI(
    businessType?: string,
    designStyle?: string,
    description?: string,
  ): Promise<{ config: any; source: 'ai' | 'template' }> {
    if (!this.enabled || !this.apiKey) {
      this.logger.log('AI disabled or no API key — using template fallback');
      return {
        config: generateWebsiteConfig(businessType, designStyle, description),
        source: 'template',
      };
    }

    try {
      const result = await this.callClaude(businessType, designStyle, description);
      this.logger.log('AI-generated website config successfully');
      return { config: result, source: 'ai' };
    } catch (error) {
      this.logger.warn(
        `AI generation failed, falling back to template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        config: generateWebsiteConfig(businessType, designStyle, description),
        source: 'template',
      };
    }
  }

  private async callClaude(
    businessType?: string,
    designStyle?: string,
    description?: string,
  ): Promise<any> {
    const userPrompt = [
      businessType ? `Business: ${businessType}` : null,
      designStyle ? `Style: ${designStyle}` : null,
      description ? `Brief: ${description}` : null,
      '',
      'Build the complete JSON config now. Make every word earn its place — this site has to convert visitors into bookings.',
    ]
      .filter((line) => line !== null)
      .join('\n');

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        // Cache the static schema — second call onward, this part costs ~10%.
        system: [
          {
            type: 'text',
            text: SCHEMA_SYSTEM,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt || 'Build a premium booking website for a general venue.',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Log cache effectiveness for monitoring
    if (data.usage) {
      this.logger.log(
        `Tokens — input: ${data.usage.input_tokens}, cached_read: ${data.usage.cache_read_input_tokens || 0}, cached_write: ${data.usage.cache_creation_input_tokens || 0}, output: ${data.usage.output_tokens}`,
      );
    }

    const textContent = data.content?.find(
      (block: any) => block.type === 'text',
    );

    if (!textContent?.text) {
      throw new Error('No text content in Claude response');
    }

    let jsonStr = textContent.text.trim();

    // Strip markdown code fences if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.theme || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid config structure returned by AI');
    }

    return parsed;
  }

  /**
   * Edit a specific section, theme, or layout using AI.
   * Returns partial config to be merged into the existing document.
   */
  async editSectionWithAI(
    currentConfig: any,
    target: string,
    sectionIndex: number | undefined,
    prompt: string,
  ): Promise<{ theme?: any; layout?: any; sectionConfig?: any }> {
    if (!this.enabled || !this.apiKey) {
      throw new Error('AI is not enabled. Please configure your Anthropic API key.');
    }

    let currentData: any;
    let responseKey: string;
    let schemaDescription: string;

    if (target === 'theme') {
      currentData = currentConfig.theme;
      responseKey = 'theme';
      schemaDescription = `{ "theme": { "primaryColor": "#hex", "secondaryColor": "#hex", "backgroundColor": "#hex", "textColor": "#hex", "fontFamily": "<Google Font>", "borderRadius": "<rem>", "mode": "light"|"dark" } }`;
    } else if (target === 'layout') {
      currentData = currentConfig.layout;
      responseKey = 'layout';
      schemaDescription = `{ "layout": { "headerStyle": "centered"|"left-aligned"|"transparent", "footerStyle": "minimal"|"full"|"none", "maxWidth": "<px>" } }`;
    } else if (target === 'section' && sectionIndex !== undefined) {
      const section = currentConfig.sections?.[sectionIndex];
      if (!section) throw new Error('Section not found');
      currentData = { type: section.type, config: section.config };
      responseKey = 'sectionConfig';
      schemaDescription = this.getSectionSchema(section.type);
    } else {
      throw new Error('Invalid edit target');
    }

    const systemPrompt = `You edit a single piece of a booking website's JSON config.

CURRENT:
${JSON.stringify(currentData, null, 2)}

RETURN: ${schemaDescription}

Rules:
- ONLY valid JSON. No markdown, no commentary.
- Only include fields you're changing.
- Hex colors must be 6 digits (#FF5733). Fonts must be real Google Fonts.
- Copy stays specific and benefit-led, never generic.
- For images use https://placehold.co/800x600/HEXCOLOR/HEXCOLOR?text=Description.
- When editing arrays (testimonials, faq items, etc.), include the FULL updated array — old items + new.`;

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1500, // edits are smaller than full generation
        messages: [{ role: 'user', content: prompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown');
      this.logger.error(`Claude API error ${response.status}: ${errorText}`);
      throw new Error(`AI service returned error ${response.status}. Please try again.`);
    }

    const data = await response.json();
    const textContent = data.content?.find((block: any) => block.type === 'text');
    if (!textContent?.text) {
      throw new Error('AI returned an empty response. Please try again.');
    }

    let jsonStr = textContent.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    this.logger.debug(`AI raw response for ${target}: ${jsonStr.substring(0, 500)}`);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      this.logger.warn(`AI returned unparseable JSON: ${jsonStr.substring(0, 200)}`);
      throw new Error('AI returned an invalid response. Please rephrase your prompt and try again.');
    }

    if (responseKey === 'theme') {
      return { theme: parsed.theme || parsed };
    } else if (responseKey === 'layout') {
      return { layout: parsed.layout || parsed };
    } else {
      return { sectionConfig: parsed.sectionConfig || parsed.config || parsed };
    }
  }

  /**
   * Compact section schemas — Opus reads these fine without verbose comments.
   */
  private getSectionSchema(sectionType: string): string {
    const schemas: Record<string, string> = {
      hero: `{ "sectionConfig": { "headline": "<8 words", "subtitle": "<18 words", "ctaText": "Book Now", "backgroundImage": "<optional URL>", "backgroundColor": "<optional #hex>" } }`,
      services: `{ "sectionConfig": { "title": "<heading>", "columns": 3, "showPrice": true, "showDuration": true, "showCapacity": true, "backgroundColor": "<optional #hex>" } }`,
      about: `{ "sectionConfig": { "title": "<heading>", "content": "<~80 words>", "layout": "centered"|"side-by-side", "showImage": true, "backgroundColor": "<optional #hex>" } }`,
      testimonials: `{ "sectionConfig": { "title": "<heading>", "items": [{ "text": "<~25 words>", "author": "<First L.>", "rating": 4|5 }], "backgroundColor": "<optional #hex>" } }`,
      gallery: `{ "sectionConfig": { "title": "<heading>", "columns": 3, "images": [{ "url": "https://placehold.co/800x600?text=...", "alt": "<desc>", "caption": "<optional>" }], "backgroundColor": "<optional #hex>" } }`,
      contact: `{ "sectionConfig": { "title": "<heading>", "phone": "<+91 ...>", "email": "<...>", "address": "<street>", "showMap": true, "showForm": true, "backgroundColor": "<optional #hex>" } }`,
      faq: `{ "sectionConfig": { "title": "<heading>", "items": [{ "question": "<...>", "answer": "<2-3 sentences>" }], "backgroundColor": "<optional #hex>" } }`,
      pricing: `{ "sectionConfig": { "title": "<heading>", "subtitle": "<optional>", "backgroundColor": "<optional #hex>" } }`,
      team: `{ "sectionConfig": { "title": "<heading>", "columns": 4, "members": [{ "name": "<full>", "role": "<title>", "bio": "<short>", "image": "<URL>" }], "backgroundColor": "<optional #hex>" } }`,
      cta: `{ "sectionConfig": { "title": "<heading>", "subtitle": "<supporting>", "buttonText": "<label>", "backgroundColor": "<optional #hex>" } }`,
      custom: `{ "sectionConfig": { "title": "<heading>", "content": "<text>", "backgroundColor": "<optional #hex>" } }`,
    };

    return schemas[sectionType] || schemas.custom;
  }
}
