import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

// Define schema for Gmail request validation
const GmailRequestSchema = z.object({
  action: z.enum(["listMessages", "getMessage", "sendMessage", "createDraft"]),
  credentials: z.string(),
  params: z.record(z.any()),
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
    const result = GmailRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request structure", details: result.error.format() }, { status: 400 })
    }

    const { action, credentials, params } = result.data

    // Parse credentials
    let parsedCredentials
    try {
      parsedCredentials = JSON.parse(credentials)
    } catch (error) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 })
    }

    // Initialize Gmail client
    const auth = new google.auth.OAuth2(
      parsedCredentials.client_id,
      parsedCredentials.client_secret,
      parsedCredentials.redirect_uri,
    )

    auth.setCredentials({
      refresh_token: parsedCredentials.refresh_token,
    })

    const gmail = google.gmail({ version: "v1", auth })

    // Perform Gmail action
    let response

    switch (action) {
      case "listMessages":
        response = await gmail.users.messages.list({
          userId: "me",
          maxResults: params.maxResults || 10,
          q: params.query || "",
        })
        break

      case "getMessage":
        response = await gmail.users.messages.get({
          userId: "me",
          id: params.id,
        })
        break

      case "sendMessage":
        // Create email content
        const emailContent = [
          `From: ${params.from}`,
          `To: ${params.to}`,
          `Subject: ${params.subject}`,
          "",
          params.body,
        ].join("\n")

        // Encode to base64
        const encodedEmail = Buffer.from(emailContent)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedEmail,
          },
        })
        break

      case "createDraft":
        // Create email content
        const draftContent = [
          `From: ${params.from}`,
          `To: ${params.to}`,
          `Subject: ${params.subject}`,
          "",
          params.body,
        ].join("\n")

        // Encode to base64
        const encodedDraft = Buffer.from(draftContent)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        response = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw: encodedDraft,
            },
          },
        })
        break

      default:
        return NextResponse.json({ error: "Unsupported Gmail action" }, { status: 400 })
    }

    return NextResponse.json({
      data: response.data,
    })
  } catch (error) {
    console.error("Error performing Gmail action:", error)
    return NextResponse.json(
      { error: "Failed to perform Gmail action", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

