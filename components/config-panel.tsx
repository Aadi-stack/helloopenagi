"use client"

import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { X } from "lucide-react"

interface ConfigPanelProps {
  node: Node
  updateNodeData: (nodeId: string, newData: any) => void
}

export default function ConfigPanel({ node, updateNodeData }: ConfigPanelProps) {
  const [formData, setFormData] = useState<any>({})

  // Initialize form data from node data
  useEffect(() => {
    setFormData({ ...node.data })
  }, [node])

  // Handle form changes
  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  // Save changes
  const handleSave = () => {
    updateNodeData(node.id, formData)
  }

  // Render different configuration forms based on node type
  const renderConfigForm = () => {
    if (node.type === "llmNode") {
      return renderLLMConfig()
    } else if (node.type === "agentNode") {
      return renderAgentConfig()
    } else if (node.type === "toolNode") {
      return renderToolConfig()
    } else {
      return <p>No configuration available for this component type.</p>
    }
  }

  // LLM configuration form
  const renderLLMConfig = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={formData.apiKey || ""}
            onChange={(e) => handleChange("apiKey", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiBase">API Base</Label>
          <Input
            id="apiBase"
            value={formData.apiBase || ""}
            onChange={(e) => handleChange("apiBase", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <Input
            id="maxTokens"
            type="number"
            value={formData.maxTokens || 256}
            onChange={(e) => handleChange("maxTokens", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature: {formData.temperature || 0.7}</Label>
          <Slider
            id="temperature"
            min={0}
            max={1}
            step={0.1}
            value={[formData.temperature || 0.7]}
            onValueChange={(value) => handleChange("temperature", value[0])}
          />
        </div>
      </div>
    )
  }

  // Agent configuration form
  const renderAgentConfig = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name</Label>
          <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={formData.role || ""} onChange={(e) => handleChange("role", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Textarea
            id="goal"
            value={formData.goal || ""}
            onChange={(e) => handleChange("goal", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="backstory">Backstory</Label>
          <Textarea
            id="backstory"
            value={formData.backstory || ""}
            onChange={(e) => handleChange("backstory", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capability">Capability</Label>
          <Select value={formData.capability || ""} onValueChange={(value) => handleChange("capability", value)}>
            <SelectTrigger id="capability">
              <SelectValue placeholder="Select capability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llm_task_executor">LLM Task Executor</SelectItem>
              <SelectItem value="search_executor">Search Executor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task">Task</Label>
          <Textarea
            id="task"
            value={formData.task || ""}
            onChange={(e) => handleChange("task", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    )
  }

  // Tool configuration form
  const renderToolConfig = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        {formData.id?.includes("duckduckgo") && (
          <div className="space-y-2">
            <Label htmlFor="maxResults">Max Results</Label>
            <Input
              id="maxResults"
              type="number"
              value={formData.maxResults || 5}
              onChange={(e) => handleChange("maxResults", Number(e.target.value))}
            />
          </div>
        )}

        {formData.id?.includes("gmail") && (
          <div className="space-y-2">
            <Label htmlFor="gmailCredentials">Gmail Credentials</Label>
            <Textarea
              id="gmailCredentials"
              value={formData.gmailCredentials || ""}
              onChange={(e) => handleChange("gmailCredentials", e.target.value)}
              rows={4}
            />
          </div>
        )}

        {formData.id?.includes("github") && (
          <div className="space-y-2">
            <Label htmlFor="githubToken">GitHub Token</Label>
            <Input
              id="githubToken"
              type="password"
              value={formData.githubToken || ""}
              onChange={(e) => handleChange("githubToken", e.target.value)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-80 border-l bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Configure Component</h2>
        <Button variant="ghost" size="icon" onClick={() => updateNodeData(node.id, formData)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {renderConfigForm()}
      <Button onClick={handleSave} className="w-full mt-6">
        Save Configuration
      </Button>
    </div>
  )
}

