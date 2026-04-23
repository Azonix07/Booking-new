import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateWebsiteConfig } from './ai-website-generator';

/**
 * AI Website Generation Service
 *
 * Calls Claude Haiku to generate a structured JSON website config.
 * Falls back to the template-based generator if:
 *   - AI is disabled via config
 *   - API key is missing
 *   - Claude returns an unparseable response
 *   - Any network/API error occurs
 */
@Injectable()
export class AiWebsiteService {
  private readonly logger = new Logger(AiWebsiteService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.anthropicApiKey') || '';
    this.model = this.configService.get<string>('ai.model') || 'claude-3-haiku-20240307';
    this.maxTokens = this.configService.get<number>('ai.maxTokens') || 4096;
    this.enabled = this.configService.get<boolean>('ai.enabled') || false;
  }

  /**
   * Generate a website config using Claude Haiku.
   * Falls back to template system on any failure.
   */
  async generateWebsiteConfigWithAI(
    businessType?: string,
    designStyle?: string,
    description?: string,
  ): Promise<{ config: any; source: 'ai' | 'template' }> {
    // If AI is disabled or no key, go straight to template
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
    const systemPrompt = `You are a professional web designer AI. Generate a structured JSON website configuration for a booking-enabled business website.

The JSON must follow this exact schema:
{
  "theme": {
    "primaryColor": "<hex>",
    "secondaryColor": "<hex>",
    "backgroundColor": "<hex>",
    "textColor": "<hex>",
    "fontFamily": "<google font name>",
    "borderRadius": "<css value>",
    "mode": "light" | "dark"
  },
  "layout": {
    "headerStyle": "centered" | "left-aligned" | "transparent",
    "footerStyle": "minimal" | "full" | "none",
    "maxWidth": "<css value>"
  },
  "sections": [
    {
      "type": "hero" | "services" | "about" | "testimonials" | "gallery" | "contact" | "faq" | "pricing" | "team" | "cta" | "custom",
      "order": <number>,
      "isVisible": true,
      "config": { <section-specific config> }
    }
  ],
  "seo": {
    "title": "<page title>",
    "description": "<meta description>",
    "ogImage": "",
    "favicon": ""
  },
  "customCSS": "",
  "customHeadHTML": ""
}

Section config details:
- hero: { headline, subtitle, ctaText, ctaLink, backgroundStyle, overlayOpacity }
- services: { title, layout, columns, showPrice, showDuration, showCapacity }
- about: { title, content, showImage, layout }
- testimonials: { title, layout, maxItems, items: [{ text, author, rating }] }
- gallery: { title, layout, columns, maxImages, images: [] }
- contact: { title, showMap, showForm, showPhone, showEmail }
- faq: { title, items: [{ question, answer }] }
- pricing: { title, layout, showComparison }
- team: { title, layout, columns, members: [] }
- cta: { title, subtitle, buttonText }

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- Use real, professional copy appropriate for the business type
- Include at least 6 sections
- Colors must be valid hex codes
- Font must be a real Google Font`;

    const userPrompt = [
      businessType ? `Business type: ${businessType}` : null,
      designStyle ? `Design style: ${designStyle}` : null,
      description ? `Description: ${description}` : null,
    ]
      .filter(Boolean)
      .join('\n');

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
        messages: [
          { role: 'user', content: userPrompt || 'Create a modern booking website for a general business' },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract the text content from Claude's response
    const textContent = data.content?.find(
      (block: any) => block.type === 'text',
    );

    if (!textContent?.text) {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON (Claude might wrap it in ```json blocks)
    let jsonStr = textContent.text.trim();

    // Strip markdown code fences if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate essential structure
    if (!parsed.theme || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid config structure returned by AI');
    }

    return parsed;
  }

  /**
   * Edit a specific section, theme, or layout using AI.
   * Returns partial config to be merged into the existing document.
   * Throws on failure so the controller can return a proper error.
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
      schemaDescription = `Return JSON with a "theme" key containing ONLY the changed fields.
Valid fields:
{
  "theme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "backgroundColor": "#hex",
    "textColor": "#hex",
    "fontFamily": "Google Font name",
    "borderRadius": "CSS value like 0.5rem",
    "mode": "light" or "dark"
  }
}`;
    } else if (target === 'layout') {
      currentData = currentConfig.layout;
      responseKey = 'layout';
      schemaDescription = `Return JSON with a "layout" key containing ONLY the changed fields.
Valid fields:
{
  "layout": {
    "headerStyle": "centered" | "left-aligned" | "transparent",
    "footerStyle": "minimal" | "full" | "none",
    "maxWidth": "CSS value like 1280px"
  }
}`;
    } else if (target === 'section' && sectionIndex !== undefined) {
      const section = currentConfig.sections?.[sectionIndex];
      if (!section) throw new Error('Section not found');
      currentData = { type: section.type, config: section.config };
      responseKey = 'sectionConfig';
      schemaDescription = this.getSectionSchema(section.type);
    } else {
      throw new Error('Invalid edit target');
    }

    const systemPrompt = `You are a web design AI assistant. The user wants to edit part of their booking website.

CURRENT DATA:
${JSON.stringify(currentData, null, 2)}

RESPONSE FORMAT:
${schemaDescription}

RULES:
- Return ONLY valid JSON. No markdown fences, no explanation, no extra text.
- Only include fields that need to change based on the user's request.
- Colors MUST be valid 6-digit hex codes (e.g. "#FF5733").
- Font names must be real Google Fonts.
- All text content should be professional and appropriate.
- For images, use placeholder URLs like "https://placehold.co/800x600/HEXCOLOR/HEXCOLOR?text=Description" where HEXCOLOR matches the theme.
- Keep arrays complete — if adding items to an existing array, include ALL items (old + new).`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
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
    // Strip markdown code fences if present
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

    // Normalize response: the AI might return { theme: {...} } or { sectionConfig: {...} }
    // or just the raw values — handle all cases
    if (responseKey === 'theme') {
      return { theme: parsed.theme || parsed };
    } else if (responseKey === 'layout') {
      return { layout: parsed.layout || parsed };
    } else {
      // For sections, AI might return { sectionConfig: {...} } or { config: {...} } or raw values
      return { sectionConfig: parsed.sectionConfig || parsed.config || parsed };
    }
  }

  /**
   * Get detailed schema for a specific section type so the AI knows exactly what fields to return.
   */
  private getSectionSchema(sectionType: string): string {
    const schemas: Record<string, string> = {
      hero: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "headline": "Main heading text",
    "subtitle": "Subtitle or subheading",
    "ctaText": "Button text like Book Now",
    "backgroundImage": "URL to background image (optional)",
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      services: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "columns": 3,
    "showPrice": true,
    "showDuration": true,
    "showCapacity": true,
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      about: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "content": "Full about-us paragraph text",
    "showImage": true,
    "layout": "centered" or "side-by-side",
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      testimonials: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "items": [
      { "text": "Review text", "author": "Customer name", "rating": 5 }
    ],
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      gallery: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "columns": 3,
    "images": [
      { "url": "https://placehold.co/800x600?text=Image+Description", "alt": "Image description", "caption": "Optional caption" }
    ],
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      contact: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "phone": "Phone number",
    "email": "Email address",
    "address": "Street address",
    "showMap": true,
    "showForm": true,
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      faq: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "items": [
      { "question": "Question text", "answer": "Answer text" }
    ],
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      pricing: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "subtitle": "Optional subtitle",
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      team: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "columns": 4,
    "members": [
      { "name": "Full name", "role": "Job title", "bio": "Short bio", "image": "URL" }
    ],
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      cta: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Main heading",
    "subtitle": "Supporting text",
    "buttonText": "Button label",
    "backgroundColor": "#hex background color (optional)"
  }
}`,
      custom: `Return JSON with a "sectionConfig" key:
{
  "sectionConfig": {
    "title": "Section heading",
    "content": "HTML or text content",
    "backgroundColor": "#hex background color (optional)"
  }
}`,
    };

    return schemas[sectionType] || schemas.custom;
  }
}
