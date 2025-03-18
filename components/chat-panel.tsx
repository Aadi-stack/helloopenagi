
"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { X, Send, Loader2 } from "lucide-react"
import { chatAPI } from "@/lib/api"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
}

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
}

export default function ChatPanel({ isOpen, onClose, sessionId }: ChatPanelProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch chat history when component mounts
  useEffect(() => {
    if (session?.accessToken && sessionId) {
      fetchChatHistory()
    }
  }, [session, sessionId])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchChatHistory = async () => {
    try {
      if (session?.accessToken) {
        const chatSession = await chatAPI.getSession(sessionId, session.accessToken as string)
        setMessages(chatSession.messages)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chat history",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !session?.accessToken) return

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send message to API
      const response = await chatAPI.sendMessage(sessionId, input, session.accessToken as string)

      // Add assistant message from API response
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== userMessage.id), // Remove temp message
        {
          id: userMessage.id,
          role: "user",
          content: input,
          created_at: new Date().toISOString(),
        },
        response.message,
      ])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message",
        variant: "destructive",
      })

      // Remove the temporary message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">GenAI Stack Chat</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.role === "system"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-gray-200 text-gray-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800">
                <div className="flex items-center">
                  <span className="mr-2">Thinking...</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
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
              placeholder="Send a message"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

