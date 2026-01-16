"use client"

import { useState } from "react"
import { ChevronRight, Plus, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Appointment } from "@/app/page"

type AppointmentStatus = "confirmed" | "pending" | "canceled"

interface CalendarViewProps {
  appointments: Appointment[]
  onNewBooking: () => void
  isLoading?: boolean
}

const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: "bg-confirmed/10 text-confirmed border-confirmed/20",
  pending: "bg-pending/10 text-pending border-pending/20",
  canceled: "bg-canceled/10 text-canceled border-canceled/20",
}

const filters = ["All", "Confirmed", "Pending", "Canceled"] as const
const viewModes = ["Day", "Week"] as const

export function CalendarView({ appointments, onNewBooking, isLoading }: CalendarViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All")
  const [viewMode, setViewMode] = useState<string>("Day")

  const filteredAppointments = appointments.filter((apt) => {
    if (activeFilter === "All") return true
    return apt.status === activeFilter.toLowerCase()
  })

  return (
    <div className="space-y-4">
      {/* View Mode & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {viewModes.map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              className={`h-8 px-4 rounded-md transition-all ${viewMode === mode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          onClick={onNewBooking}
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            className={`rounded-full shrink-0 transition-all ${activeFilter === filter
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card text-foreground border-border hover:bg-secondary"
              }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Appointments Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Appointments</h2>
        <span className="text-sm text-muted-foreground">{filteredAppointments.length} bookings</span>
      </div>

      {/* Vertical Card List sorted by time */}
      <div className="space-y-3">
        {filteredAppointments.map((appointment) => (
          <Card
            key={appointment.id}
            className={`border-border bg-card overflow-hidden shadow-sm card-hover ${appointment.status === "canceled" ? "opacity-60" : ""
              }`}
          >
            <CardContent className="p-0">
              <div className="flex">
                {/* Color accent bar for master */}
                <div className={`w-1 ${appointment.masterColor}`} />

                {/* Time Column */}
                <div className="w-20 shrink-0 bg-secondary/50 p-3 flex flex-col items-center justify-center border-r border-border">
                  <span className="text-lg font-bold text-foreground">{appointment.time}</span>
                  <span className="text-xs text-muted-foreground">{appointment.duration}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {appointment.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className={`font-medium text-foreground text-sm ${appointment.status === "canceled" ? "line-through" : ""}`}
                        >
                          {appointment.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground">with {appointment.master}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize ${statusStyles[appointment.status]}`}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{appointment.service}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary transition-colors">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && filteredAppointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No appointments found</p>
        </div>
      )}
    </div>
  )
}
