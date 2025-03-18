import { API_URL } from "@/lib/constants"

// Helper function to handle API requests
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "An error occurred")
  }

  return data
}

// Authentication API
export const authAPI = {
  register: async (userData: { name: string; email: string; password: string }) => {
    return fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },
}

// Stacks API
export const stacksAPI = {
  getStacks: async (token: string) => {
    return fetchAPI("/stacks", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  getStack: async (id: string, token: string) => {
    return fetchAPI(`/stacks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  createStack: async (stackData: any, token: string) => {
    return fetchAPI("/stacks", {
      method: "POST",
      body: JSON.stringify(stackData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  updateStack: async (id: string, stackData: any, token: string) => {
    return fetchAPI(`/stacks/${id}`, {
      method: "PUT",
      body: JSON.stringify(stackData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  deleteStack: async (id: string, token: string) => {
    return fetchAPI(`/stacks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

// Chat API
export const chatAPI = {
  createSession: async (stackId: string, token: string) => {
    return fetchAPI("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ stack_id: stackId }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  getSessions: async (token: string, stackId?: string) => {
    const endpoint = stackId ? `/chat/sessions?stack_id=${stackId}` : "/chat/sessions"
    return fetchAPI(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  getSession: async (sessionId: string, token: string) => {
    return fetchAPI(`/chat/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  sendMessage: async (sessionId: string, message: string, token: string) => {
    return fetchAPI("/chat/message", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  deleteSession: async (sessionId: string, token: string) => {
    return fetchAPI(`/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

// LLMs API
export const llmsAPI = {
  getLLMs: async (token: string) => {
    return fetchAPI("/llms", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  createLLM: async (llmData: any, token: string) => {
    return fetchAPI("/llms", {
      method: "POST",
      body: JSON.stringify(llmData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  updateLLM: async (id: string, llmData: any, token: string) => {
    return fetchAPI(`/llms/${id}`, {
      method: "PUT",
      body: JSON.stringify(llmData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  deleteLLM: async (id: string, token: string) => {
    return fetchAPI(`/llms/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

// Agents API
export const agentsAPI = {
  getAgents: async (token: string) => {
    return fetchAPI("/agents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  createAgent: async (agentData: any, token: string) => {
    return fetchAPI("/agents", {
      method: "POST",
      body: JSON.stringify(agentData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  updateAgent: async (id: string, agentData: any, token: string) => {
    return fetchAPI(`/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(agentData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  deleteAgent: async (id: string, token: string) => {
    return fetchAPI(`/agents/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

// Tools API
export const toolsAPI = {
  getTools: async (token: string) => {
    return fetchAPI("/tools", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  createTool: async (toolData: any, token: string) => {
    return fetchAPI("/tools", {
      method: "POST",
      body: JSON.stringify(toolData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  updateTool: async (id: string, toolData: any, token: string) => {
    return fetchAPI(`/tools/${id}`, {
      method: "PUT",
      body: JSON.stringify(toolData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  deleteTool: async (id: string, token: string) => {
    return fetchAPI(`/tools/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

