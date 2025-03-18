import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import axios from "axios"
import * as cheerio from "cheerio"

// Define schema for DuckDuckGo search request validation
const SearchRequestSchema = z.object({
  query: z.string(),
  maxResults: z.number().optional(),
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
    const result = SearchRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request structure", details: result.error.format() }, { status: 400 })
    }

    const { query, maxResults = 5 } = result.data

    // Perform DuckDuckGo search
    const searchResults = await performDuckDuckGoSearch(query, maxResults)

    return NextResponse.json({
      results: searchResults,
      query,
    })
  } catch (error) {
    console.error("Error performing DuckDuckGo search:", error)
    return NextResponse.json(
      { error: "Failed to perform search", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Perform DuckDuckGo search
async function performDuckDuckGoSearch(query: string, maxResults: number) {
  try {
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query)

    // Make request to DuckDuckGo
    const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodedQuery}`)

    // Parse HTML response
    const $ = cheerio.load(response.data)

    // Extract search results
    const results = []

    $(".result").each((i, element) => {
      if (i >= maxResults) return false

      const title = $(element).find(".result__title").text().trim()
      const snippet = $(element).find(".result__snippet").text().trim()
      const url = $(element).find(".result__url").text().trim()

      results.push({
        title,
        snippet,
        url,
      })
    })

    return results
  } catch (error) {
    console.error("Error in DuckDuckGo search:", error)
    throw new Error("Failed to perform DuckDuckGo search")
  }
}

