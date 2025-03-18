import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Define schema for weather request validation
const WeatherRequestSchema = z.object({
  location: z.string(),
  units: z.enum(["metric", "imperial"]).optional(),
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
    const result = WeatherRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request structure", details: result.error.format() }, { status: 400 })
    }

    const { location, units = "metric" } = result.data

    // Get weather data
    const weatherData = await getWeatherData(location, units)

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Error getting weather data:", error)
    return NextResponse.json(
      { error: "Failed to get weather data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Get weather data from OpenWeatherMap API
async function getWeatherData(location: string, units: string) {
  try {
    // In a real implementation, this would call the OpenWeatherMap API
    // For now, simulate a response
    return {
      location,
      current: {
        temp: units === "metric" ? 22 : 72,
        feels_like: units === "metric" ? 23 : 74,
        humidity: 65,
        wind_speed: units === "metric" ? 5 : 11,
        weather: "Partly Cloudy",
      },
      forecast: [
        {
          date: new Date().toISOString(),
          temp_max: units === "metric" ? 25 : 77,
          temp_min: units === "metric" ? 18 : 64,
          weather: "Sunny",
        },
        {
          date: new Date(Date.now() + 86400000).toISOString(),
          temp_max: units === "metric" ? 23 : 73,
          temp_min: units === "metric" ? 17 : 63,
          weather: "Cloudy",
        },
        {
          date: new Date(Date.now() + 172800000).toISOString(),
          temp_max: units === "metric" ? 20 : 68,
          temp_min: units === "metric" ? 15 : 59,
          weather: "Rain",
        },
      ],
    }
  } catch (error) {
    console.error("Error in weather API:", error)
    throw new Error("Failed to get weather data")
  }
}

