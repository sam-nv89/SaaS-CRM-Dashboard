"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddClientSheet } from "@/components/dialogs/add-client-sheet"

type ClientStatus = "new" | "regular" | "vip"

interface Client {
  id: string
  name: string
  phone: string
  email: string
  lastVisit: string
  status: ClientStatus
  totalVisits: number
}

const initialClients: Client[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    phone: "+1 234-567-8901",
    email: "sarah@email.com",
    lastVisit: "2024-01-15",
    status: "vip",
    totalVisits: 24,
  },
  {
    id: "2",
    name: "Michael Chen",
    phone: "+1 234-567-8902",
    email: "michael@email.com",
    lastVisit: "2024-01-14",
    status: "regular",
    totalVisits: 12,
  },
  {
    id: "3",
    name: "Emily Davis",
    phone: "+1 234-567-8903",
    email: "emily@email.com",
    lastVisit: "2024-01-13",
    status: "new",
    totalVisits: 2,
  },
  {
    id: "4",
    name: "James Wilson",
    phone: "+1 234-567-8904",
    email: "james@email.com",
    lastVisit: "2024-01-12",
    status: "regular",
    totalVisits: 8,
  },
  {
    id: "5",
    name: "Lisa Anderson",
    phone: "+1 234-567-8905",
    email: "lisa@email.com",
    lastVisit: "2024-01-10",
    status: "vip",
    totalVisits: 30,
  },
  {
    id: "6",
    name: "David Brown",
    phone: "+1 234-567-8906",
    email: "david@email.com",
    lastVisit: "2024-01-08",
    status: "new",
    totalVisits: 1,
  },
  {
    id: "7",
    name: "Jennifer Lee",
    phone: "+1 234-567-8907",
    email: "jennifer@email.com",
    lastVisit: "2024-01-05",
    status: "regular",
    totalVisits: 15,
  },
]

const statusStyles: Record<ClientStatus, string> = {
  new: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  regular: "bg-primary/10 text-primary border-primary/20",
  vip: "bg-chart-5/10 text-chart-5 border-chart-5/20",
}

export function ClientsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState(initialClients)
  const [addSheetOpen, setAddSheetOpen] = useState(false)

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleAddClient = (newClient: { id: string; name: string; phone: string; email: string }) => {
    const client: Client = {
      ...newClient,
      lastVisit: new Date().toISOString().split("T")[0],
      status: "new",
      totalVisits: 0,
    }
    setClients((prev) => [client, ...prev])
  }

  return (
    <div className="space-y-4">
      {/* Search & Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card border border-border focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Button
          size="icon"
          className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          onClick={() => setAddSheetOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

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
                    <p className="text-xs text-muted-foreground">{client.totalVisits} visits</p>
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
                      <DropdownMenuItem className="cursor-pointer">View Profile</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Book Appointment</DropdownMenuItem>
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
                <span className="text-muted-foreground text-xs">Last: {formatDate(client.lastVisit)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found</p>
        </div>
      )}

      <AddClientSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} onClientAdded={handleAddClient} />
    </div>
  )
}
