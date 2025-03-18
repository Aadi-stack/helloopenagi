"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

// Component data
const components = {
  llms: [
    { id: "openai-gpt-3.5", name: "OpenAI GPT-3.5", description: "OpenAI's GPT-3.5 Turbo model" },
    { id: "openai-gpt-4", name: "OpenAI GPT-4", description: "OpenAI's GPT-4 model" },
    { id: "azure-openai", name: "Azure OpenAI", description: "Microsoft Azure hosted OpenAI models" },
    { id: "anthropic-claude", name: "Anthropic Claude", description: "Anthropic's Claude model" },
    { id: "hf-llama-3", name: "Hugging Face Llama 3", description: "Meta's Llama 3 model via Hugging Face" },
    { id: "hf-mistral", name: "Hugging Face Mistral", description: "Mistral AI's model via Hugging Face" },
    { id: "hf-falcon", name: "Hugging Face Falcon", description: "Technology Innovation Institute's Falcon model" },
    { id: "hf-gemma", name: "Hugging Face Gemma", description: "Google's Gemma model via Hugging Face" },
    { id: "cohere", name: "Cohere", description: "Cohere's language models" },
    { id: "vertex-ai", name: "Google Vertex AI", description: "Google's Vertex AI models" },
  ],
  agents: [
    { id: "conversational-agent", name: "Conversational Agent", description: "General purpose conversational agent" },
    { id: "research-agent", name: "Research Agent", description: "Agent specialized in research tasks" },
    { id: "coding-agent", name: "Coding Agent", description: "Agent specialized in coding tasks" },
    { id: "multi-agent", name: "Multi-Agent System", description: "System of multiple cooperating agents" },
    { id: "reasoning-agent", name: "Reasoning Agent", description: "Agent with advanced reasoning capabilities" },
    { id: "creative-agent", name: "Creative Agent", description: "Agent specialized in creative tasks" },
    { id: "task-agent", name: "Task Agent", description: "Agent for breaking down and completing tasks" },
    { id: "planning-agent", name: "Planning Agent", description: "Agent for creating and executing plans" },
    {
      id: "autonomous-agent",
      name: "Autonomous Agent",
      description: "Fully autonomous agent with minimal supervision",
    },
  ],
  tools: [
    { id: "duckduckgo-search", name: "DuckDuckGo Search", description: "Search the web using DuckDuckGo" },
    { id: "gmail", name: "Gmail", description: "Access and manage Gmail emails" },
    { id: "github", name: "GitHub", description: "Interact with GitHub repositories" },
    { id: "web-browser", name: "Web Browser", description: "Browse and extract information from websites" },
    { id: "calculator", name: "Calculator", description: "Perform mathematical calculations" },
    { id: "weather-api", name: "Weather API", description: "Get weather information for locations" },
    { id: "calendar", name: "Calendar", description: "Manage calendar events and schedules" },
    { id: "file-system", name: "File System", description: "Access and manipulate files" },
    { id: "wikipedia", name: "Wikipedia", description: "Search and retrieve information from Wikipedia" },
    { id: "google-drive", name: "Google Drive", description: "Access and manage Google Drive files" },
    { id: "slack", name: "Slack", description: "Send and receive Slack messages" },
    { id: "jira", name: "Jira", description: "Create and manage Jira issues" },
    { id: "notion", name: "Notion", description: "Access and update Notion pages" },
  ],
}

export default function ComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter components based on search term
  const filteredComponents = {
    llms: components.llms.filter(
      (comp) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    agents: components.agents.filter(
      (comp) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    tools: components.tools.filter(
      (comp) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  }

  // Handle drag start
  const onDragStart = (event: React.DragEvent, type: string, data: any) => {
    event.dataTransfer.setData("application/reactflow/type", type)
    event.dataTransfer.setData("application/reactflow/data", JSON.stringify(data))
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search components..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="llms" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="llms">LLMs</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="llms" className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filteredComponents.llms.map((llm) => (
              <div
                key={llm.id}
                className="rounded-md border p-3 cursor-move hover:bg-gray-100 dark:hover:bg-gray-800"
                draggable
                onDragStart={(e) => onDragStart(e, "llm", llm)}
              >
                <h3 className="font-medium">{llm.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{llm.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filteredComponents.agents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-md border p-3 cursor-move hover:bg-gray-100 dark:hover:bg-gray-800"
                draggable
                onDragStart={(e) => onDragStart(e, "agent", agent)}
              >
                <h3 className="font-medium">{agent.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{agent.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filteredComponents.tools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-md border p-3 cursor-move hover:bg-gray-100 dark:hover:bg-gray-800"
                draggable
                onDragStart={(e) => onDragStart(e, "tool", tool)}
              >
                <h3 className="font-medium">{tool.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

