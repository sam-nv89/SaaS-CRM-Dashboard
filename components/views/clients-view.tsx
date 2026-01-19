"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Phone, Loader2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ClientSheet } from "@/components/dialogs/client-sheet"
import { ClientProfileDialog } from "@/components/dialogs/client-profile-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { getClients, createClient, updateClient, deleteClient } from "@/lib/db"
import type { Client } from "@/types/database"
import { toast } from "sonner"

type ClientStatus = "new" | "regular" | "vip"

const statusStyles: Record<ClientStatus, string> = {
  new: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  regular: "bg-primary/10 text-primary border-primary/20",
  vip: "bg-chart-5/10 text-chart-5 border-chart-5/20",
}

interface ClientsViewProps {
  searchQuery?: string
}

export function ClientsView({ searchQuery: externalSearchQuery }: ClientsViewProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState("")
  const searchQuery = externalSearchQuery ?? internalSearchQuery

  const [clients, setClients] = useState<Client[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [clientToView, setClientToView] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load clients from Supabase on mount
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "No visits"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleSaveClient = async (data: { name: string; phone: string; email: string; notes?: string }) => {
    try {
      if (clientToEdit) {
        // Update
        const updated = await updateClient({
          id: clientToEdit.id,
          ...data
        })
        setClients((prev) => prev.map(c => c.id === updated.id ? updated : c))
        toast.success("Client updated")
      } else {
        // Create
        const created = await createClient({
          name: data.name,
          phone: data.phone,
          email: data.email,
          notes: data.notes,
          status: "new",
          total_visits: 0,
        })
        setClients((prev) => [created, ...prev])
        toast.success("Client added")
      }
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error('Failed to save client')
      throw error // Re-throw to let the sheet handle loading state if needed
    }
  }

  const openAddSheet = () => {
    setClientToEdit(undefined)
    setSheetOpen(true)
  }

  const openEditSheet = (client: Client) => {
    setClientToEdit(client)
    setSheetOpen(true)
  }

  const confirmDelete = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const openProfileDialog = (client: Client) => {
    setClientToView(client)
    setProfileDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      await deleteClient(clientToDelete.id)
      setClients((prev) => prev.filter(c => c.id !== clientToDelete.id))
      toast.success("Client deleted")
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    } finally {
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Add */}
      {!externalSearchQuery && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-card border border-border focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <Button
            size="icon"
            className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            onClick={openAddSheet}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}

      {externalSearchQuery && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={openAddSheet}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Client
          </Button>
        </div>
      )}

      {/* Client Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Clients</h2>
        <span className="text-sm text-muted-foreground">{filteredClients.length} clients</span>
      </div>

      {/* Client Cards */}
      <div className="space-y-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="border-border bg-card shadow-sm card-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.total_visits} visits</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs capitalize ${statusStyles[client.status]}`}>
                    {client.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openEditSheet(client)}>
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => openProfileDialog(client)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => confirmDelete(client)}
                      >
                        Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {client.phone}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">Last: {formatDate(client.last_visit)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found</p>
        </div>
      )}

      <ClientSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onClientSaved={handleSaveClient}
        clientToEdit={clientToEdit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              {clientToDelete && <strong> {clientToDelete.name} </strong>}
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClientProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        client={clientToView}
      />
    </div>
  )
}
