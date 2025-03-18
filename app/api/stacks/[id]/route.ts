import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stackId = params.id

    // Get stack
    const stack = await prisma.stack.findUnique({
      where: {
        id: stackId,
      },
    })

    if (!stack) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 })
    }

    // Check if the stack belongs to the current user
    if (stack.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse nodes and edges from JSON
    const nodes = JSON.parse(stack.nodes)
    const edges = JSON.parse(stack.edges)

    return NextResponse.json({
      id: stack.id,
      name: stack.name,
      description: stack.description,
      nodes,
      edges,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching stack:", error)
    return NextResponse.json({ error: "Failed to fetch stack" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stackId = params.id
    const body = await request.json()

    // Get stack
    const stack = await prisma.stack.findUnique({
      where: {
        id: stackId,
      },
    })

    if (!stack) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 })
    }

    // Check if the stack belongs to the current user
    if (stack.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update stack
    const updatedStack = await prisma.stack.update({
      where: {
        id: stackId,
      },
      data: {
        name: body.name || stack.name,
        description: body.description || stack.description,
        nodes: body.nodes ? JSON.stringify(body.nodes) : stack.nodes,
        edges: body.edges ? JSON.stringify(body.edges) : stack.edges,
      },
    })

    // Parse nodes and edges from JSON
    const nodes = JSON.parse(updatedStack.nodes)
    const edges = JSON.parse(updatedStack.edges)

    return NextResponse.json({
      id: updatedStack.id,
      name: updatedStack.name,
      description: updatedStack.description,
      nodes,
      edges,
      createdAt: updatedStack.createdAt,
      updatedAt: updatedStack.updatedAt,
    })
  } catch (error) {
    console.error("Error updating stack:", error)
    return NextResponse.json({ error: "Failed to update stack" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stackId = params.id

    // Get stack
    const stack = await prisma.stack.findUnique({
      where: {
        id: stackId,
      },
    })

    if (!stack) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 })
    }

    // Check if the stack belongs to the current user
    if (stack.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete stack
    await prisma.stack.delete({
      where: {
        id: stackId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting stack:", error)
    return NextResponse.json({ error: "Failed to delete stack" }, { status: 500 })
  }
}

