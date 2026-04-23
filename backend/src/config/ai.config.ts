import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.AI_MODEL || 'claude-3-haiku-20240307',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
  enabled: process.env.AI_ENABLED === 'true',
}));
