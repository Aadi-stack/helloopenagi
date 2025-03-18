"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import type { Edge, Node } from "reactflow"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  workflow: {
    id?: string
    nodes: Node[]
    edges: Edge[]
  }
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export default function ChatModal({ isOpen, onClose, workflow }: ChatModalProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "I'm your AI assistant built with OpenAGI. How can I help you today?" },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Extract workflow components for better responses
  const agentNodes = workflow.nodes.filter((node) => node.type === "agentNode")
  const toolNodes = workflow.nodes.filter((node) => node.type === "toolNode")
  const llmNodes = workflow.nodes.filter((node) => node.type === "llmNode")

  // Get the primary agent, if any
  // const primaryAgent = agentNodes.length > 0 ? agentNodes[0].data : null

  // Get the primary LLM, if any
  // const primaryLLM = llmNodes.length > 0 ? llmNodes[0].data : null

  // Get tool names
  // const toolNames = toolNodes.map((node) => node.data.name)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call the API to process the message
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: workflow.id || "temp-workflow",
          message: input,
          history: messages.filter((msg) => msg.role !== "system"),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process message")
      }

      const data = await response.json()

      // Add assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error processing message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your message",
        variant: "destructive",
      })
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error processing your request." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate a response based on the user input and workflow
  // const generateResponse = async (userInput: string) => {
  //   // Simulate processing time
  //   await new Promise((resolve) => setTimeout(resolve, 1500))

  //   // Check if we have a Hugging Face model
  //   const isHuggingFace = primaryLLM && primaryLLM.id && primaryLLM.id.startsWith("hf-")

  //   // Generate a response based on the workflow components and user input
  //   let response = ""

  //   // If using a Hugging Face model, mention it
  //   if (isHuggingFace) {
  //     response += `Using ${primaryLLM.name} (${primaryLLM.modelId || "Hugging Face model"}) to process your request.\n\n`
  //   }

  //   // If we have a primary agent with a system prompt, use it to guide the response
  //   if (primaryAgent && primaryAgent.systemPrompt) {
  //     // Use the agent's system prompt to guide the response style
  //     const agentType = primaryAgent.id.split("-")[0]

  //     if (agentType === "conversational") {
  //       response += generateConversationalResponse(userInput)
  //     } else if (agentType === "research") {
  //       response += generateResearchResponse(userInput, toolNames)
  //     } else if (agentType === "coding") {
  //       response += generateCodingResponse(userInput)
  //     } else if (agentType === "reasoning") {
  //       response += generateReasoningResponse(userInput)
  //     } else if (agentType === "creative") {
  //       response += generateCreativeResponse(userInput)
  //     } else {
  //       response += generateGenericResponse(userInput, toolNames)
  //     }
  //   } else {
  //     // Default response if no specific agent type
  //     response += generateGenericResponse(userInput, toolNames)
  //   }

  //   // Add the response to the messages
  //   setMessages((prev) => [...prev, { role: "assistant", content: response }])
  // }

  // Generate a response for a conversational agent
  // const generateConversationalResponse = (userInput: string) => {
  //   const lowerInput = userInput.toLowerCase()

  //   if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("hey")) {
  //     return "Hello! I'm your conversational assistant. How can I help you today?"
  //   } else if (lowerInput.includes("how are you")) {
  //     return "I'm functioning well, thank you for asking! How can I assist you today?"
  //   } else if (lowerInput.includes("what can you do")) {
  //     return "As a conversational agent, I can chat with you, answer questions, provide information, and help with various tasks. What would you like to know or discuss?"
  //   } else if (lowerInput.includes("weather")) {
  //     return "I notice you're asking about the weather. While I don't have real-time weather data in this demo, in a fully implemented version, I would connect to a weather API to provide you with current conditions and forecasts for your location."
  //   } else {
  //     return (
  //       "I understand you're saying: \"" +
  //       userInput +
  //       '". How can I help you with this? Feel free to ask me questions or tell me more about what you need.'
  //     )
  //   }
  // }

  // Generate a response for a research agent
  // const generateResearchResponse = (userInput: string, toolNames: string[]) => {
  //   const lowerInput = userInput.toLowerCase()
  //   let response = ""

  //   if (toolNames.includes("DuckDuckGo Search")) {
  //     response += "I'm using DuckDuckGo Search to find information about your query.\n\n"
  //   }

  //   if (
  //     lowerInput.includes("who") ||
  //     lowerInput.includes("what") ||
  //     lowerInput.includes("when") ||
  //     lowerInput.includes("where") ||
  //     lowerInput.includes("why") ||
  //     lowerInput.includes("how")
  //   ) {
  //     response += "That's an interesting research question. Let me search for information about that.\n\n"
  //     response += "Based on my search, here are some key findings related to your query:\n\n"
  //     response += "1. [Finding 1 would appear here in a real implementation]\n"
  //     response += "2. [Finding 2 would appear here in a real implementation]\n"
  //     response += "3. [Finding 3 would appear here in a real implementation]\n\n"
  //     response += "Would you like me to explore any specific aspect of this topic in more depth?"
  //   } else if (lowerInput.includes("search") || lowerInput.includes("find") || lowerInput.includes("look up")) {
  //     response += "I'm searching for information about \"" + userInput + '".\n\n'
  //     response += "Here are the top results I found:\n\n"
  //     response += "1. [Result 1 would appear here in a real implementation]\n"
  //     response += "2. [Result 2 would appear here in a real implementation]\n"
  //     response += "3. [Result 3 would appear here in a real implementation]\n\n"
  //     response += "Is there anything specific from these results you'd like me to elaborate on?"
  //   } else {
  //     response += "I'll research information about \"" + userInput + '" for you.\n\n'
  //     response +=
  //       "In a fully implemented version, I would search the web, analyze the results, and provide you with a comprehensive summary of the most relevant information."
  //   }

  //   return response
  // }

  // Generate a response for a coding agent
  // const generateCodingResponse = (userInput: string) => {
  //   const lowerInput = userInput.toLowerCase()

  //   if (lowerInput.includes("code") || lowerInput.includes("function") || lowerInput.includes("program")) {
  //     return "I see you're asking about code. In a fully implemented version, I would analyze your request and generate appropriate code. For example, if you asked for a sorting algorithm, I might provide:\n\n\`\`\`python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\`\`\`\n\nIs there a specific programming task you're interested in?"
  //   } else if (lowerInput.includes("bug") || lowerInput.includes("error") || lowerInput.includes("fix")) {
  //     return "I understand you're dealing with a coding issue. In a fully implemented version, I would help debug your code by analyzing the error messages and suggesting fixes. Could you share more details about the specific error you're encountering?"
  //   } else if (lowerInput.includes("github")) {
  //     return "I see you're mentioning GitHub. With the GitHub tool integration, I could help you manage repositories, create issues, review pull requests, and more. What specific GitHub-related task would you like assistance with?"
  //   } else {
  //     return (
  //       "I understand you're asking about: \"" +
  //       userInput +
  //       '". In a fully implemented version, I would analyze your coding question and provide relevant code examples, explanations, or debugging help based on your specific needs.'
  //     )
  //   }
  // }

  // Generate a response for a reasoning agent
  // const generateReasoningResponse = (userInput: string) => {
  //   const lowerInput = userInput.toLowerCase()

  //   if (lowerInput.includes("problem") || lowerInput.includes("solve") || lowerInput.includes("solution")) {
  //     return "I see you've presented a problem to solve. Let me break this down step by step:\n\n1. First, I'll identify the key elements of the problem\n2. Next, I'll analyze potential approaches\n3. Then, I'll evaluate the pros and cons of each approach\n4. Finally, I'll recommend the most suitable solution\n\nIn a fully implemented version, I would apply this reasoning process to your specific problem and provide a detailed analysis and recommendation."
  //   } else if (lowerInput.includes("think") || lowerInput.includes("reason") || lowerInput.includes("analyze")) {
  //     return "I'll think through this carefully. When analyzing complex issues, I consider multiple perspectives, examine evidence, identify assumptions, and draw logical conclusions.\n\nIn a fully implemented version, I would apply this reasoning process to your specific query and provide a thoughtful, nuanced response that considers various angles and implications."
  //   } else {
  //     return (
  //       "I'll reason through your query: \"" +
  //       userInput +
  //       '". In a fully implemented version, I would apply critical thinking and structured analysis to provide you with a comprehensive response that examines different perspectives and reaches well-supported conclusions.'
  //     )
  //   }
  // }

  // Generate a response for a creative agent
  // const generateCreativeResponse = (userInput: string) => {
  //   const lowerInput = userInput.toLowerCase()

  //   if (lowerInput.includes("story") || lowerInput.includes("write") || lowerInput.includes("creative")) {
  //     return "I'd be happy to create something for you! Here's a short creative piece based on your request:\n\n*The sun dipped below the horizon, painting the sky in hues of orange and purple. As the last light faded, the stars emerged one by one, like diamonds scattered across black velvet. In that moment of transition between day and night, anything seemed possible.*\n\nIn a fully implemented version, I could generate longer stories, poems, or other creative content tailored to your specific preferences and requirements."
  //   } else if (lowerInput.includes("idea") || lowerInput.includes("brainstorm") || lowerInput.includes("suggest")) {
  //     return "Let me brainstorm some creative ideas for you:\n\n1. A mobile app that translates bird songs into human language\n2. A community garden that doubles as an outdoor art gallery\n3. A podcast series where experts in different fields solve each other's problems\n4. A cookbook where each recipe tells part of a continuing story\n5. A social network based on shared dreams and sleep patterns\n\nIn a fully implemented version, I could generate more tailored ideas based on your specific interests and constraints."
  //   } else {
  //     return (
  //       "I'll approach your request creatively: \"" +
  //       userInput +
  //       '". In a fully implemented version, I would use my creative capabilities to generate original content, ideas, or solutions that are imaginative, engaging, and tailored to your specific needs.'
  //     )
  //   }
  // }

  // Generate a generic response
  // const generateGenericResponse = (userInput: string, toolNames: string[]) => {
  //   const lowerInput = userInput.toLowerCase()

  //   if (lowerInput.includes("search") || lowerInput.includes("find") || lowerInput.includes("look up")) {
  //     if (toolNames.includes("DuckDuckGo Search")) {
  //       return (
  //         "I'm using DuckDuckGo Search to find information about \"" +
  //         userInput +
  //         '".\n\nIn a fully implemented version, I would search the web and provide you with relevant results and a summary of the information.'
  //       )
  //     } else {
  //       return "I notice you're asking me to search for information. In a fully implemented version with search tools configured, I would be able to look up information on the web and provide you with relevant results."
  //     }
  //   } else if (lowerInput.includes("email") || lowerInput.includes("gmail")) {
  //     if (toolNames.includes("Gmail")) {
  //       return "I'm connecting to Gmail to help you with your email-related request.\n\nIn a fully implemented version, I would be able to read, summarize, draft, or send emails based on your instructions."
  //     } else {
  //       return "I notice you're asking about email. In a fully implemented version with email tools configured, I would be able to help you manage your emails."
  //     }
  //   } else if (lowerInput.includes("code") || lowerInput.includes("github")) {
  //     if (toolNames.includes("GitHub")) {
  //       return "I'm connecting to GitHub to help you with your code-related request.\n\nIn a fully implemented version, I would be able to interact with repositories, create issues, review code, and more."
  //     } else {
  //       return "I notice you're asking about code or GitHub. In a fully implemented version with coding tools configured, I would be able to help you with programming tasks."
  //     }
  //   } else if (lowerInput.includes("weather")) {
  //     if (toolNames.includes("Weather API")) {
  //       return "I'm checking the weather information for you.\n\nIn a fully implemented version, I would connect to a weather API and provide you with current conditions and forecasts for your location."
  //     } else {
  //       return "I notice you're asking about the weather. In a fully implemented version with weather tools configured, I would be able to provide you with weather information."
  //     }
  //   } else if (
  //     lowerInput.includes("calendar") ||
  //     lowerInput.includes("schedule") ||
  //     lowerInput.includes("appointment")
  //   ) {
  //     if (toolNames.includes("Calendar")) {
  //       return "I'm accessing your calendar to help with your scheduling request.\n\nIn a fully implemented version, I would be able to check your availability, create events, and manage your schedule."
  //     } else {
  //       return "I notice you're asking about calendar or scheduling. In a fully implemented version with calendar tools configured, I would be able to help you manage your schedule."
  //     }
  //   } else {
  //     return (
  //       "I understand you're asking about: \"" +
  //       userInput +
  //       '". In a fully implemented version, I would process your request using the configured workflow and provide a helpful response based on the available tools and models.'
  //     )
  //   }
  // }

  // If modal is not open, don't render anything
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Chat with Your Agent</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.role === "system"
                      ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

