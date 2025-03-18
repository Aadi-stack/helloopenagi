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

    const workflowId = params.id

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: workflowId,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Check if the workflow belongs to the current user
    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse nodes and edges from JSON
    const nodes = JSON.parse(workflow.nodes)
    const edges = JSON.parse(workflow.edges)

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      nodes,
      edges,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching workflow:", error)
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workflowId = params.id
    const body = await request.json()

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: workflowId,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Check if the workflow belongs to the current user
    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: {
        id: workflowId,
      },
      data: {
        name: body.name || workflow.name,
        description: body.description || workflow.description,
        nodes: body.nodes ? JSON.stringify(body.nodes) : workflow.nodes,
        edges: body.edges ? JSON.stringify(body.edges) : workflow.edges,
      },
    })

    // Parse nodes and edges from JSON
    const nodes = JSON.parse(updatedWorkflow.nodes)
    const edges = JSON.parse(updatedWorkflow.edges)

    return NextResponse.json({
      id: updatedWorkflow.id,
      name: updatedWorkflow.name,
      description: updatedWorkflow.description,
      nodes,
      edges,
      createdAt: updatedWorkflow.createdAt,
      updatedAt: updatedWorkflow.updatedAt,
    })
  } catch (error) {
    console.error("Error updating workflow:", error)
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workflowId = params.id

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: workflowId,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    // Check if the workflow belongs to the current user
    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete workflow
    await prisma.workflow.delete({
      where: {
        id: workflowId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workflow:", error)
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 })
  }
}

