"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

// Component data
const components = {
  agents: [
    { id: "agent-writer", name: "Writer", description: "Expert in writing and summarizing content" },
    { id: "agent-researcher", name: "Researcher", description: "Specialized in research and information gathering" },
    { id: "agent-coder", name: "Coder", description: "Expert in writing and explaining code" },
    { id: "agent-assistant", name: "Assistant", description: "General purpose assistant for various tasks" },
    { id: "agent-analyst", name: "Analyst", description: "Specialized in data analysis and insights" },
  ],
  tools: [
    { id: "tool-wikisearch", name: "Wikisearch", description: "Search Wikipedia for information" },
    { id: "tool-duckduckgo", name: "DuckDuck search", description: "Search the web using DuckDuckGo" },
    { id: "tool-gmail", name: "GMail", description: "Access and manage Gmail emails" },
    { id: "tool-github", name: "Github", description: "Interact with GitHub repositories" },
    { id: "tool-calculator", name: "Calculator", description: "Perform mathematical calculations" },
    { id: "tool-weather", name: "Weather", description: "Get weather information for locations" },
  ],
  llms: [
    { id: "llm-openai-3.5", name: "OpenAI 3.5", description: "OpenAI's GPT-3.5 Turbo model" },
    { id: "llm-openai-4", name: "OpenAI 4", description: "OpenAI's GPT-4 model" },
    { id: "llm-azure-openai", name: "Azure OpenAI", description: "Microsoft Azure hosted OpenAI models" },
    { id: "llm-anthropic", name: "Anthropic", description: "Anthropic's Claude models" },
    { id: "llm-mistral", name: "Mistral", description: "Mistral AI's models" },
    { id: "llm-llama", name: "Llama", name: "Meta's Llama models" },
  ],
}

export default function ComponentSidebar() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter components based on search term
  const filteredComponents = {
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
    llms: components.llms.filter(
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
    <div className="w-64 border-r bg-white p-4">
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search components..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="llms">LLMs</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-4 space-y-2">
          {filteredComponents.agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-md border p-3 cursor-move hover:bg-gray-100"
              draggable
              onDragStart={(e) => onDragStart(e, "agent", agent)}
            >
              <h3 className="font-medium">{agent.name}</h3>
              <p className="text-xs text-gray-500">{agent.description}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tools" className="mt-4 space-y-2">
          {filteredComponents.tools.map((tool) => (
            <div
              key={tool.id}
              className="rounded-md border p-3 cursor-move hover:bg-gray-100"
              draggable
              onDragStart={(e) => onDragStart(e, "tool", tool)}
            >
              <h3 className="font-medium">{tool.name}</h3>
              <p className="text-xs text-gray-500">{tool.description}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="llms" className="mt-4 space-y-2">
          {filteredComponents.llms.map((llm) => (
            <div
              key={llm.id}
              className="rounded-md border p-3 cursor-move hover:bg-gray-100"
              draggable
              onDragStart={(e) => onDragStart(e, "llm", llm)}
            >
              <h3 className="font-medium">{llm.name}</h3>
              <p className="text-xs text-gray-500">{llm.description}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

