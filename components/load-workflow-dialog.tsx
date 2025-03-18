"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Workflow {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

interface LoadWorkflowDialogProps {
  isOpen: boolean
  onClose: () => void
  onLoad: (workflowId: string) => void
}

export default function LoadWorkflowDialog({ isOpen, onClose, onLoad }: LoadWorkflowDialogProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Fetch workflows when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      fetch("/api/workflows")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch workflows")
          }
          return response.json()
        })
        .then((data) => {
          setWorkflows(data)
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, toast])

  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Load Workflow</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-workflows">Search</Label>
            <Input
              id="search-workflows"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search workflows..."
            />
          </div>

          <div className="h-64 overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                {searchTerm ? "No matching workflows found" : "No workflows saved yet"}
              </div>
            ) : (
              <ul className="divide-y">
                {filteredWorkflows.map((workflow) => (
                  <li key={workflow.id} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <button className="w-full text-left" onClick={() => onLoad(workflow.id)}>
                      <div className="font-medium">{workflow.name}</div>
                      {workflow.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {workflow.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Updated: {new Date(workflow.updatedAt).toLocaleString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

