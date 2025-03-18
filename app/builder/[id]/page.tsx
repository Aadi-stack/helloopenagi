"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Connection,
  type NodeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, Play } from "lucide-react"
import Header from "@/components/header"
import ComponentSidebar from "@/components/component-sidebar"
import ConfigPanel from "@/components/config-panel"
import ChatPanel from "@/components/chat-panel"
import AgentNode from "@/components/nodes/agent-node"
import LLMNode from "@/components/nodes/llm-node"
import ToolNode from "@/components/nodes/tool-node"
import { stacksAPI, chatAPI } from "@/lib/api"

// Define custom node types
const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  llmNode: LLMNode,
  toolNode: ToolNode,
}

export default function BuilderPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stackName, setStackName] = useState("")
  const [stackDescription, setStackDescription] = useState("")
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.accessToken) {
      fetchStackDetails()
    }
  }, [status, router, id, session])

  const fetchStackDetails = async () => {
    setIsLoading(true)
    try {
      if (session?.accessToken && id) {
        const stackData = await stacksAPI.getStack(id as string, session.accessToken as string)

        setStackName(stackData.name)
        setStackDescription(stackData.description)
        setNodes(stackData.nodes || [])
        setEdges(stackData.edges || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stack details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow/type")
      const data = JSON.parse(event.dataTransfer.getData("application/reactflow/data"))

      // Check if the dropped element is valid
      if (!type || !data) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      // Create a new node
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: `${type}Node`,
        position,
        data: { ...data },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...newData },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  const handleSave = async () => {
    try {
      if (session?.accessToken && id) {
        const stackData = {
          name: stackName,
          description: stackDescription,
          nodes,
          edges,
        }

        await stacksAPI.updateStack(id as string, stackData, session.accessToken as string)

        toast({
          title: "Success",
          description: "Stack saved successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save stack",
        variant: "destructive",
      })
    }
  }

  const handleRun = async () => {
    try {
      if (session?.accessToken && id) {
        // Save the stack first
        await handleSave()

        // Create a new chat session
        const sessionData = await chatAPI.createSession(id as string, session.accessToken as string)
        setChatSessionId(sessionData.id)

        // Open the chat panel
        setIsChatOpen(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Component Sidebar */}
        <ComponentSidebar />

        {/* Main Builder Area */}
        <div className="flex flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-l p-4">
            <h1 className="text-xl font-bold">{stackName}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
              <Button onClick={handleRun}>
                <Play className="mr-2 h-4 w-4" /> Run
              </Button>
            </div>
          </div>

          {/* Flow Builder */}
          <div className="flex-1 border-l" ref={reactFlowWrapper}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>

        {/* Configuration Panel */}
        {selectedNode && <ConfigPanel node={selectedNode} updateNodeData={updateNodeData} />}
      </div>

      {/* Chat Panel */}
      {isChatOpen && chatSessionId && (
        <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} sessionId={chatSessionId} />
      )}
    </div>
  )
}

