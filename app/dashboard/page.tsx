
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Edit } from "lucide-react"
import Header from "@/components/header"
import { stacksAPI } from "@/lib/api"

interface Stack {
  id: string
  name: string
  description: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stacks, setStacks] = useState<Stack[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newStack, setNewStack] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.accessToken) {
      fetchStacks()
    }
  }, [status, router, session])

  const fetchStacks = async () => {
    setIsLoading(true)
    try {
      if (session?.accessToken) {
        const stacksData = await stacksAPI.getStacks(session.accessToken as string)
        setStacks(stacksData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stacks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStack = async () => {
    if (!newStack.name) {
      toast({
        title: "Error",
        description: "Please provide a name for your stack",
        variant: "destructive",
      })
      return
    }

    try {
      if (session?.accessToken) {
        const stackData = {
          name: newStack.name,
          description: newStack.description || "",
          nodes: [],
          edges: [],
        }

        const createdStack = await stacksAPI.createStack(stackData, session.accessToken as string)

        setStacks([...stacks, createdStack])
        setIsCreateDialogOpen(false)
        setNewStack({ name: "", description: "" })

        toast({
          title: "Success",
          description: "Stack created successfully",
        })

        // Redirect to the builder page
        router.push(`/builder/${createdStack.id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create stack",
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
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Stacks</h1>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Stack
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stacks.length > 0 ? (
              stacks.map((stack) => (
                <Card key={stack.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <h2 className="text-xl font-bold">{stack.name}</h2>
                      <p className="mt-2 text-sm text-gray-500">{stack.description}</p>
                    </div>
                    <div className="flex items-center justify-end border-t p-4">
                      <Link href={`/builder/${stack.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" /> Edit Stack
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <h3 className="text-lg font-medium">No stacks found</h3>
                <p className="mt-2 text-sm text-gray-500">Create your first stack to get started</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create Stack
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Stack Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Stack</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newStack.name}
                onChange={(e) => setNewStack({ ...newStack, name: e.target.value })}
                placeholder="My Stack"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newStack.description}
                onChange={(e) => setNewStack({ ...newStack, description: e.target.value })}
                placeholder="Describe your stack"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStack}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

