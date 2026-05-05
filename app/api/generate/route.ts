import { streamText } from "ai";
import { getModel } from "@/lib/ai-provider";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { z } from "zod";

const requestSchema = z.object({
  categories: z.array(
    z.enum(["emotion", "daily", "relationship", "selfcare", "work", "rest"])
  ),
  pastThemes: z.string().max(3000).optional().default(""),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { categories, pastThemes } = parsed.data;

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(categories, pastThemes),
    maxOutputTokens: 2048,
  });

  return result.toTextStreamResponse();
}
