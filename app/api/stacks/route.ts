import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// Define schema for stack validation
const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()),
})

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
})

const StackSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate the stack
    const result = StackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid stack structure", details: result.error.format() }, { status: 400 })
    }

    const { name, description, nodes, edges } = result.data

    // Save stack to database
    const stack = await prisma.stack.create({
      data: {
        name,
        description: description || "",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      id: stack.id,
      name: stack.name,
      description: stack.description,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
    })
  } catch (error) {
    console.error("Error saving stack:", error)
    return NextResponse.json({ error: "Failed to save stack" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get stacks for the current user
    const stacks = await prisma.stack.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Transform the stacks to include parsed nodes and edges
    const transformedStacks = stacks.map((stack) => ({
      id: stack.id,
      name: stack.name,
      description: stack.description,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
    }))

    return NextResponse.json(transformedStacks)
  } catch (error) {
    console.error("Error fetching stacks:", error)
    return NextResponse.json({ error: "Failed to fetch stacks" }, { status: 500 })
  }
}

