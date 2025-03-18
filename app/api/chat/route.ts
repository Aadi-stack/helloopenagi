import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Define schema for chat request validation
const ChatRequestSchema = z.object({
  stackId: z.string(),
  message: z.string(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate the request
    const result = ChatRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request structure", details: result.error.format() }, { status: 400 })
    }

    const { stackId, message, history = [] } = result.data

    // In a real app, this would process the message through the OpenAGI framework
    // For now, we'll simulate a response
    await new Promise((resolve) => setTimeout(resolve, 1000))

    let response = ""

    // Generate a response based on the message
    if (
      message.toLowerCase().includes("stock") ||
      message.toLowerCase().includes("coca cola") ||
      message.toLowerCase().includes("pepsi")
    ) {
      response = `1. Coca-Cola (KO): Coca-Cola's stock has steadily grown over the past 5 years, thanks to diversification into non-soda beverages. The pandemic caused a temporary dip in its stock price, but it has since rebounded. Its consistent dividend payouts make it appealing to long-term investors.

2. PepsiCo (PEP): PepsiCo's stock has shown stable growth, thanks to its diversified portfolio, including food and beverages, which shields it from market volatility. The company's resilience during the pandemic led to a strong recovery, and steady dividends have attracted income-focused investors.

In conclusion, both companies have demonstrated resilience and steady growth over the past 5 years, appealing to growth and income-focused investors.`
    } else {
      response = `I've processed your request: "${message}"

Here's what I found:
- The topic appears to be about ${message.split(" ").slice(-3).join(" ")}
- There are several perspectives to consider
- Based on available information, the most relevant answer would address the core question

Would you like me to elaborate on any specific part of this response?`
    }

    return NextResponse.json({
      response,
      stackId,
    })
  } catch (error) {
    console.error("Error processing chat message:", error)
    return NextResponse.json(
      { error: "Failed to process chat message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

