"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Play, Wrench, Save, X, Trash2, List, Download } from "lucide-react"
import ComponentLibrary from "@/components/component-library"
import ComponentConfiguration from "@/components/component-configuration"
import ChatModal from "@/components/chat-modal"
import LLMNode from "@/components/nodes/llm-node"
import AgentNode from "@/components/nodes/agent-node"
import ToolNode from "@/components/nodes/tool-node"
import SaveWorkflowDialog from "@/components/save-workflow-dialog"
import LoadWorkflowDialog from "@/components/load-workflow-dialog"

// Define custom node types
const nodeTypes: NodeTypes = {
  llmNode: LLMNode,
  agentNode: AgentNode,
  toolNode: ToolNode,
}

export default function BuilderInterface() {
  // State for nodes and edges in the flow
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // State for selected node (for configuration panel)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // State for chat modal
  const [isChatOpen, setIsChatOpen] = useState(false)

  // State for save/load dialogs
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)

  // State for current workflow
  const [currentWorkflow, setCurrentWorkflow] = useState<{
    id?: string
    name?: string
    description?: string
  }>({})

  // Toast notifications
  const { toast } = useToast()

  // Reference to the ReactFlow instance
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Handle node selection for configuration
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // Handle node deselection
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Handle connections between nodes
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // Handle dropping components from the library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const componentType = event.dataTransfer.getData("application/reactflow/type")
      const componentData = JSON.parse(event.dataTransfer.getData("application/reactflow/data"))

      // Check if the dropped element is valid
      if (!componentType || !componentData) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      // Create a new node
      const newNode: Node = {
        id: `${componentType}-${Date.now()}`,
        type: `${componentType}Node`,
        position,
        data: { ...componentData, label: componentData.name || componentType },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Handle building the workflow
  const handleBuild = useCallback(() => {
    // Validate the workflow
    const validationResult = validateWorkflow()

    if (validationResult.isValid) {
      toast({
        title: "Workflow Built Successfully",
        description: "Your workflow is valid and ready to run.",
      })
    } else {
      toast({
        title: "Invalid Workflow",
        description: validationResult.error,
        variant: "destructive",
      })
    }
  }, [nodes, edges, toast])

  // Validate the workflow
  const validateWorkflow = useCallback(() => {
    // Check if there are any nodes
    if (nodes.length === 0) {
      return { isValid: false, error: "Workflow must contain at least one component." }
    }

    // Check if there is at least one agent node
    const hasAgent = nodes.some((node) => node.type === "agentNode")
    if (!hasAgent) {
      return { isValid: false, error: "Workflow must contain at least one agent." }
    }

    // Check if there is at least one LLM node
    const hasLLM = nodes.some((node) => node.type === "llmNode")
    if (!hasLLM) {
      return { isValid: false, error: "Workflow must contain at least one LLM." }
    }

    // Check if all nodes are connected
    if (nodes.length > 1 && edges.length === 0) {
      return { isValid: false, error: "Components must be connected to each other." }
    }

    // Check if LLM nodes have API keys
    const llmNodes = nodes.filter((node) => node.type === "llmNode")
    for (const llmNode of llmNodes) {
      const isHuggingFace = llmNode.data.id?.startsWith("hf-")

      if (isHuggingFace) {
        if (!llmNode.data.huggingFaceToken) {
          return { isValid: false, error: `${llmNode.data.name} is missing a Hugging Face token.` }
        }
        if (!llmNode.data.modelId) {
          return { isValid: false, error: `${llmNode.data.name} is missing a model ID.` }
        }
      } else {
        if (!llmNode.data.apiKey) {
          return { isValid: false, error: `${llmNode.data.name} is missing an API key.` }
        }
        if (!llmNode.data.model) {
          return { isValid: false, error: `${llmNode.data.name} is missing a model selection.` }
        }
      }
    }

    return { isValid: true, error: null }
  }, [nodes, edges])

  // Handle running the workflow
  const handleRun = useCallback(() => {
    // First build/validate the workflow
    const validationResult = validateWorkflow()

    if (validationResult.isValid) {
      // Open the chat modal
      setIsChatOpen(true)
    } else {
      toast({
        title: "Cannot Run Workflow",
        description: validationResult.error,
        variant: "destructive",
      })
    }
  }, [validateWorkflow, toast])

  // Update node data when configuration changes
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

      toast({
        title: "Configuration Saved",
        description: "Component configuration has been updated.",
      })
    },
    [setNodes, toast],
  )

  // Handle saving the workflow
  const handleSaveWorkflow = useCallback(
    (name: string, description: string) => {
      setIsSaveDialogOpen(false)

      // If workflow already has an ID, update it
      if (currentWorkflow.id) {
        // Update workflow
        fetch(`/api/workflows/${currentWorkflow.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            nodes,
            edges,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to update workflow")
            }
            return response.json()
          })
          .then((data) => {
            setCurrentWorkflow({
              id: data.id,
              name: data.name,
              description: data.description,
            })
            toast({
              title: "Workflow Updated",
              description: `"${name}" has been updated successfully.`,
            })
          })
          .catch((error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            })
          })
      } else {
        // Create new workflow
        fetch("/api/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            nodes,
            edges,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to save workflow")
            }
            return response.json()
          })
          .then((data) => {
            setCurrentWorkflow({
              id: data.id,
              name: data.name,
              description: data.description,
            })
            toast({
              title: "Workflow Saved",
              description: `"${name}" has been saved successfully.`,
            })
          })
          .catch((error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            })
          })
      }
    },
    [currentWorkflow.id, nodes, edges, toast],
  )

  // Handle loading a workflow
  const handleLoadWorkflow = useCallback(
    (workflowId: string) => {
      setIsLoadDialogOpen(false)

      fetch(`/api/workflows/${workflowId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to load workflow")
          }
          return response.json()
        })
        .then((data) => {
          setNodes(data.nodes)
          setEdges(data.edges)
          setCurrentWorkflow({
            id: data.id,
            name: data.name,
            description: data.description,
          })
          toast({
            title: "Workflow Loaded",
            description: `"${data.name}" has been loaded successfully.`,
          })
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
        })
    },
    [setNodes, setEdges, toast],
  )

  // Add this function to the BuilderInterface component
  const exportOpenAGIConfig = useCallback(() => {
    // Validate the workflow first
    const validationResult = validateWorkflow()

    if (!validationResult.isValid) {
      toast({
        title: "Cannot Export Configuration",
        description: validationResult.error,
        variant: "destructive",
      })
      return
    }

    // Create OpenAGI configuration
    const llmNodes = nodes.filter((node) => node.type === "llmNode")
    const agentNodes = nodes.filter((node) => node.type === "agentNode")
    const toolNodes = nodes.filter((node) => node.type === "toolNode")

    // Get the primary LLM
    const primaryLLM = llmNodes[0]

    // Get the primary agent
    const primaryAgent = agentNodes[0]

    // Create the configuration
    const openAGIConfig = {
      name: currentWorkflow.name || "Untitled Workflow",
      description: currentWorkflow.description || "",
      llm: {
        type: primaryLLM.data.id,
        config: {
          model: primaryLLM.data.model || primaryLLM.data.modelId,
          temperature: primaryLLM.data.temperature || 0.7,
        },
      },
      agent: {
        type: primaryAgent.data.id,
        config: {
          system_prompt: primaryAgent.data.systemPrompt || "",
          verbose: primaryAgent.data.verbose || false,
          memory: primaryAgent.data.memory || false,
        },
      },
      tools: toolNodes.map((tool) => ({
        type: tool.data.id,
        config: { ...tool.data },
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    }

    // Create a downloadable file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(openAGIConfig, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${openAGIConfig.name.replace(/\s+/g, "_")}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()

    toast({
      title: "Configuration Exported",
      description: "OpenAGI configuration has been exported successfully.",
    })
  }, [currentWorkflow, nodes, edges, validateWorkflow, toast])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Component Library Panel */}
      <div className="w-64 border-r bg-gray-50 p-4 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold">Components</h2>
        <ComponentLibrary />
      </div>

      {/* Workspace Panel */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-2 flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={handleBuild} variant="outline" size="sm" className="gap-1">
              <Wrench className="h-4 w-4" /> Build
            </Button>
            <Button onClick={handleRun} size="sm" className="gap-1">
              <Play className="h-4 w-4" /> Run
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={exportOpenAGIConfig}>
              <Download className="h-4 w-4" /> Export Config
            </Button>
          </div>
          <div className="flex items-center">
            {currentWorkflow.name && <span className="mr-4 text-sm font-medium">{currentWorkflow.name}</span>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsSaveDialogOpen(true)}>
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsLoadDialogOpen(true)}>
                <List className="h-4 w-4" /> Load
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1" ref={reactFlowWrapper}>
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
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Configuration Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-gray-50 p-4 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Configure Component</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ComponentConfiguration node={selectedNode} updateNodeData={updateNodeData} />
          <Separator className="my-4" />
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-1"
            onClick={() => {
              setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
              setSelectedNode(null)
              toast({
                title: "Component Deleted",
                description: "The component has been removed from the workflow.",
              })
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete Component
          </Button>
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          workflow={{ id: currentWorkflow.id, nodes, edges }}
        />
      )}

      {/* Save Workflow Dialog */}
      <SaveWorkflowDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveWorkflow}
        initialName={currentWorkflow.name || ""}
        initialDescription={currentWorkflow.description || ""}
      />

      {/* Load Workflow Dialog */}
      <LoadWorkflowDialog
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onLoad={handleLoadWorkflow}
      />
    </div>
  )
}

