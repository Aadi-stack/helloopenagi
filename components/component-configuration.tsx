"use client"

import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface ComponentConfigurationProps {
  node: Node
  updateNodeData: (nodeId: string, newData: any) => void
}

export default function ComponentConfiguration({ node, updateNodeData }: ComponentConfigurationProps) {
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
    switch (node.type) {
      case "llmNode":
        return renderLLMConfig()
      case "agentNode":
        return renderAgentConfig()
      case "toolNode":
        return renderToolConfig()
      default:
        return <p>No configuration available for this component type.</p>
    }
  }

  // Update the LLM configuration form to include Hugging Face models
  const renderLLMConfig = () => {
    // Check if it's a Hugging Face model
    const isHuggingFace = formData.id?.startsWith("hf-")

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        {isHuggingFace ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="huggingFaceToken">Hugging Face Token</Label>
              <Input
                id="huggingFaceToken"
                type="password"
                value={formData.huggingFaceToken || ""}
                onChange={(e) => handleChange("huggingFaceToken", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelId">Model ID</Label>
              <Select value={formData.modelId || ""} onValueChange={(value) => handleChange("modelId", value)}>
                <SelectTrigger id="modelId">
                  <SelectValue placeholder="Select Hugging Face model" />
                </SelectTrigger>
                <SelectContent>
                  {formData.id === "hf-llama-3" && (
                    <>
                      <SelectItem value="meta-llama/Llama-3-8b-chat-hf">Llama-3-8b-chat</SelectItem>
                      <SelectItem value="meta-llama/Llama-3-70b-chat-hf">Llama-3-70b-chat</SelectItem>
                    </>
                  )}
                  {formData.id === "hf-mistral" && (
                    <>
                      <SelectItem value="mistralai/Mistral-7B-Instruct-v0.2">Mistral-7B-Instruct</SelectItem>
                      <SelectItem value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral-8x7B-Instruct</SelectItem>
                    </>
                  )}
                  {formData.id === "hf-falcon" && (
                    <>
                      <SelectItem value="tiiuae/falcon-7b-instruct">Falcon-7B-Instruct</SelectItem>
                      <SelectItem value="tiiuae/falcon-40b-instruct">Falcon-40B-Instruct</SelectItem>
                    </>
                  )}
                  {formData.id === "hf-gemma" && (
                    <>
                      <SelectItem value="google/gemma-7b-it">Gemma-7B-Instruct</SelectItem>
                      <SelectItem value="google/gemma-2b-it">Gemma-2B-Instruct</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLength">Max Output Length</Label>
              <Input
                id="maxLength"
                type="number"
                min="10"
                max="4096"
                value={formData.maxLength || 1024}
                onChange={(e) => handleChange("maxLength", Number.parseInt(e.target.value))}
              />
            </div>
          </>
        ) : (
          <>
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
              <Label htmlFor="model">Model</Label>
              <Select value={formData.model || ""} onValueChange={(value) => handleChange("model", value)}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {formData.id === "openai-gpt-3.5" && <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>}
                  {formData.id === "openai-gpt-4" && (
                    <>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </>
                  )}
                  {formData.id === "anthropic-claude" && (
                    <>
                      <SelectItem value="claude-2">Claude 2</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature</Label>
          <div className="flex items-center gap-2">
            <Input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature || 0.7}
              onChange={(e) => handleChange("temperature", Number.parseFloat(e.target.value))}
            />
            <span>{formData.temperature || 0.7}</span>
          </div>
        </div>
      </div>
    )
  }

  // Agent configuration form
  const renderAgentConfig = () => {
    const agentType = formData.id?.split("-")[0] || ""

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={formData.systemPrompt || ""}
            onChange={(e) => handleChange("systemPrompt", e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {agentType === "multi" && (
          <div className="space-y-2">
            <Label htmlFor="agentCount">Number of Agents</Label>
            <Input
              id="agentCount"
              type="number"
              min="2"
              max="5"
              value={formData.agentCount || 2}
              onChange={(e) => handleChange("agentCount", Number.parseInt(e.target.value))}
            />
          </div>
        )}

        {agentType === "autonomous" && (
          <div className="space-y-2">
            <Label htmlFor="maxIterations">Max Iterations</Label>
            <Input
              id="maxIterations"
              type="number"
              min="1"
              max="50"
              value={formData.maxIterations || 10}
              onChange={(e) => handleChange("maxIterations", Number.parseInt(e.target.value))}
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="verbose"
            checked={formData.verbose || false}
            onCheckedChange={(checked) => handleChange("verbose", checked)}
          />
          <Label htmlFor="verbose">Verbose Mode</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="memory"
            checked={formData.memory || false}
            onCheckedChange={(checked) => handleChange("memory", checked)}
          />
          <Label htmlFor="memory">Enable Memory</Label>
        </div>
      </div>
    )
  }

  // Tool configuration form
  const renderToolConfig = () => {
    // Different tools have different configuration options
    const toolType = formData.id?.split("-")[0] || ""

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
        </div>

        {toolType === "duckduckgo" && (
          <div className="space-y-2">
            <Label htmlFor="maxResults">Max Results</Label>
            <Input
              id="maxResults"
              type="number"
              min="1"
              max="10"
              value={formData.maxResults || 5}
              onChange={(e) => handleChange("maxResults", Number.parseInt(e.target.value))}
            />
          </div>
        )}

        {toolType === "gmail" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="gmailCredentials">Gmail Credentials</Label>
              <Textarea
                id="gmailCredentials"
                value={formData.gmailCredentials || ""}
                onChange={(e) => handleChange("gmailCredentials", e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="readOnly"
                checked={formData.readOnly || true}
                onCheckedChange={(checked) => handleChange("readOnly", checked)}
              />
              <Label htmlFor="readOnly">Read Only</Label>
            </div>
          </>
        )}

        {toolType === "github" && (
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
    <div className="space-y-6">
      {renderConfigForm()}
      <Button onClick={handleSave} className="w-full">
        Save Configuration
      </Button>
    </div>
  )
}

