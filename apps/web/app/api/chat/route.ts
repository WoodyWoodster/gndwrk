import { streamText } from "ai";
import { models, COACH_SYSTEM_PROMPT } from "@/lib/ai";

export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatContext {
  trustScore?: number;
  age?: number;
  savingsGoals?: { name: string; progress: number }[];
}

export async function POST(req: Request) {
  const { messages, context } = (await req.json()) as {
    messages: ChatMessage[];
    context?: ChatContext;
  };

  // Build context-aware system prompt
  let systemPrompt = COACH_SYSTEM_PROMPT;

  if (context) {
    const contextParts: string[] = [];

    if (context.age) {
      contextParts.push(`The kid is ${context.age} years old.`);
    }

    if (context.trustScore) {
      contextParts.push(`Their Trust Score is ${context.trustScore}/850.`);
    }

    if (context.savingsGoals?.length) {
      const goalsStr = context.savingsGoals
        .map((g) => `${g.name} (${Math.round(g.progress * 100)}% complete)`)
        .join(", ");
      contextParts.push(`Current savings goals: ${goalsStr}.`);
    }

    if (contextParts.length > 0) {
      systemPrompt += `\n\nContext about this kid:\n${contextParts.join("\n")}`;
    }
  }

  const result = streamText({
    model: models.coach,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  return result.toTextStreamResponse();
}
