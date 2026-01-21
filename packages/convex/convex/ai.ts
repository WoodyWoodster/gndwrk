import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Get current conversation
export const getCurrentConversation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    // Get most recent conversation (within last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("updatedAt"), oneDayAgo))
      .order("desc")
      .first();

    return conversation;
  },
});

// Chat with AI coach
export const chat = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user data for context
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) throw new Error("User not found");

    // Get conversation or create new one
    let conversation = await ctx.runQuery(api.ai.getCurrentConversation);

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user" as const,
      content: message,
      timestamp: Date.now(),
    };

    // Get context for AI
    const trustScore = await ctx.runQuery(api.trustScore.getMyCurrent);
    const accounts = await ctx.runQuery(api.accounts.getMyAccounts);

    // Calculate user age category for age-appropriate responses
    const ageCategory = user.dateOfBirth
      ? calculateAgeCategory(user.dateOfBirth)
      : "teen";

    // Build system prompt
    const systemPrompt = buildSystemPrompt(ageCategory, {
      firstName: user.firstName,
      trustScore: trustScore?.score,
      accounts: accounts ?? undefined,
    });

    // Build messages array
    const previousMessages = conversation?.messages ?? [];
    const messagesToSend = [
      ...previousMessages.slice(-10), // Keep last 10 messages for context
      userMessage,
    ];

    // Call Claude API
    const response = await callClaude(systemPrompt, messagesToSend);

    const assistantMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: "assistant" as const,
      content: response,
      timestamp: Date.now(),
    };

    // Save conversation
    const allMessages = [...(conversation?.messages ?? []), userMessage, assistantMessage];

    if (conversation) {
      await ctx.runMutation(api.ai.updateConversation, {
        conversationId: conversation._id,
        messages: allMessages,
      });
    } else {
      await ctx.runMutation(api.ai.createConversation, {
        messages: allMessages,
        context: {
          trustScore: trustScore?.score,
          age: user.dateOfBirth
            ? Math.floor(
                (Date.now() - user.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000)
              )
            : undefined,
        },
      });
    }

    return response;
  },
});

// Create new conversation
export const createConversation = mutation({
  args: {
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    context: v.optional(v.any()),
  },
  handler: async (ctx, { messages, context }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    return await ctx.db.insert("aiConversations", {
      userId: user._id,
      messages,
      context,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update conversation
export const updateConversation = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, { conversationId, messages }) => {
    await ctx.db.patch(conversationId, {
      messages,
      updatedAt: Date.now(),
    });
  },
});

// Helper functions
function calculateAgeCategory(dateOfBirth: number): "child" | "teen" | "young_adult" {
  const age = Math.floor(
    (Date.now() - dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000)
  );
  if (age < 10) return "child";
  if (age < 16) return "teen";
  return "young_adult";
}

function buildSystemPrompt(
  ageCategory: string,
  context: {
    firstName: string;
    trustScore?: number;
    accounts?: any[];
  }
): string {
  const basePrompt = `You are a friendly financial coach for a family banking app called Gndwrk. Your role is to help kids and teens learn about money management in an engaging, supportive way.

User Context:
- Name: ${context.firstName}
- Trust Score: ${context.trustScore ?? "Not yet calculated"}
- Accounts: ${JSON.stringify(context.accounts ?? [])}

Guidelines:
1. Be encouraging and positive
2. Explain financial concepts in simple terms
3. Give practical, actionable advice
4. Use examples that relate to their life
5. Never give investment advice or recommend specific financial products
6. If asked about something inappropriate, gently redirect to money topics
7. Keep responses concise (2-3 short paragraphs max)`;

  const ageSpecificGuidelines = {
    child: `
- Use very simple language and fun analogies
- Focus on basic concepts: saving, spending wisely, earning
- Use examples like toys, games, or treats
- Be extra encouraging and celebrate small wins`,
    teen: `
- Use relatable examples like phones, games, clothes
- Discuss budgeting and saving for bigger goals
- Introduce concepts like loans and interest simply
- Be supportive but not condescending`,
    young_adult: `
- Discuss more advanced topics like credit, investing basics
- Use real-world examples like cars, college, apartments
- Be more direct and less simplified
- Help them prepare for adult financial responsibility`,
  };

  return (
    basePrompt +
    (ageSpecificGuidelines[ageCategory as keyof typeof ageSpecificGuidelines] || "")
  );
}

async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content[0].text;
}
