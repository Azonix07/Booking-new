import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  // Default to Opus 4.5 — top-quality output for the website builder.
  // Override via AI_MODEL env if you want a cheaper model.
  model: process.env.AI_MODEL || 'claude-opus-4-5-20250929',
  // 3000 is plenty for a complete website JSON; Opus is concise.
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '3000', 10),
  enabled: process.env.AI_ENABLED === 'true',
}));
