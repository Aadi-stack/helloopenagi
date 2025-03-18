import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Octokit } from "octokit"

// Define schema for GitHub request validation
const GitHubRequestSchema = z.object({
  action: z.enum(["getRepo", "listRepos", "getIssues", "createIssue", "searchCode"]),
  token: z.string(),
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
    const result = GitHubRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request structure", details: result.error.format() }, { status: 400 })
    }

    const { action, token, params } = result.data

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: token,
    })

    // Perform GitHub action
    let response

    switch (action) {
      case "getRepo":
        response = await octokit.rest.repos.get({
          owner: params.owner,
          repo: params.repo,
        })
        break

      case "listRepos":
        response = await octokit.rest.repos.listForAuthenticatedUser({
          per_page: params.per_page || 10,
          page: params.page || 1,
        })
        break

      case "getIssues":
        response = await octokit.rest.issues.listForRepo({
          owner: params.owner,
          repo: params.repo,
          state: params.state || "open",
          per_page: params.per_page || 10,
          page: params.page || 1,
        })
        break

      case "createIssue":
        response = await octokit.rest.issues.create({
          owner: params.owner,
          repo: params.repo,
          title: params.title,
          body: params.body,
        })
        break

      case "searchCode":
        response = await octokit.rest.search.code({
          q: params.query,
        })
        break

      default:
        return NextResponse.json({ error: "Unsupported GitHub action" }, { status: 400 })
    }

    return NextResponse.json({
      data: response.data,
    })
  } catch (error) {
    console.error("Error performing GitHub action:", error)
    return NextResponse.json(
      { error: "Failed to perform GitHub action", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

