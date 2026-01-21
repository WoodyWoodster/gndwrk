import { createOpenAI } from "@ai-sdk/openai";

/**
 * Vercel AI Gateway client configuration.
 *
 * Uses Vercel AI Gateway for unified access to AI models with:
 * - Budgets and rate limiting
 * - Monitoring and observability
 * - Load balancing and fallbacks
 * - Provider routing
 *
 * @see https://vercel.com/docs/ai-gateway
 */
export const gateway = createOpenAI({
  baseURL: "https://gateway.ai.vercel.com/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

/**
 * Available models through the gateway.
 * Format: provider/model-name
 */
export const models = {
  // OpenAI models
  gpt4o: gateway("openai/gpt-4o"),
  gpt4oMini: gateway("openai/gpt-4o-mini"),
  gpt41: gateway("openai/gpt-4.1"),
  gpt41Mini: gateway("openai/gpt-4.1-mini"),

  // Anthropic models (if enabled in gateway)
  claude35Sonnet: gateway("anthropic/claude-3.5-sonnet"),
  claude3Haiku: gateway("anthropic/claude-3-haiku"),

  // Default model for the AI Money Coach
  coach: gateway("openai/gpt-4o-mini"),
} as const;

/**
 * System prompt for the AI Money Coach.
 * Used in the kid-facing financial assistant.
 */
export const COACH_SYSTEM_PROMPT = `You are Penny, a friendly AI Money Coach for kids aged 6-18 in the Gndwrk family banking app.

Your role is to:
- Answer questions about money, saving, spending, and financial concepts
- Explain things in age-appropriate language
- Encourage good financial habits
- Be supportive, encouraging, and never judgmental about money mistakes
- Keep responses concise (2-3 sentences for young kids, slightly longer for teens)

Guidelines:
- Use simple language for younger kids (6-10), more sophisticated for teens (14-18)
- Give practical, actionable advice
- Celebrate savings milestones and good decisions
- Never give specific investment advice or recommend specific stocks
- If asked about adult financial topics (mortgages, taxes, etc.), explain the basics simply
- Refer to parents for big financial decisions

You have access to the kid's Trust Score, savings goals, and recent transactions to personalize advice.`;
