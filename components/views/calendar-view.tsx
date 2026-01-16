"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, Plus, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format, isSameDay, parseISO } from "date-fns"
import type { Appointment } from "@/app/page"

type AppointmentStatus = "confirmed" | "pending" | "canceled"

interface CalendarViewProps {
  appointments: Appointment[]
  onNewBooking: () => void
  isLoading?: boolean
  currentDate: Date
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
}

const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: "bg-confirmed/10 text-confirmed border-confirmed/20",
  pending: "bg-pending/10 text-pending border-pending/20",
  canceled: "bg-canceled/10 text-canceled border-canceled/20",
}

const filters = ["All", "Confirmed", "Pending", "Canceled"] as const
const viewModes = ["Day", "Week"] as const

export function CalendarView({
  appointments,
  onNewBooking,
  isLoading,
  currentDate,
  onPrevDay,
  onNextDay,
  onToday,
}: CalendarViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All")
  const [viewMode, setViewMode] = useState<string>("Day")

  const formattedDate = format(currentDate, "EEEE, MMMM d")

  const filteredAppointments = appointments.filter((apt) => {
    // Date filter
    try {
      if (!isSameDay(parseISO(apt.date), currentDate)) return false
    } catch (e) {
      console.warn("Invalid date format:", apt.date)
      return false
    }

    // Status filter
    if (activeFilter === "All") return true
    return apt.status === activeFilter.toLowerCase()
  })

  // Sort by time
  const sortedAppointments = [...filteredAppointments].sort((a, b) =>
    a.time.localeCompare(b.time)
  )

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border shadow-sm">
        <Button variant="ghost" size="icon" onClick={onPrevDay}>
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="flex flex-col items-center cursor-pointer" onClick={onToday}>
          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {formattedDate}
          </span>
          {isSameDay(currentDate, new Date()) && (
            <span className="text-[10px] text-primary font-medium">Today</span>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={onNextDay}>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* View Mode & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {viewModes.map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              className={`h-8 px-4 rounded-md transition-all ${viewMode === mode
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setViewMode(mode)}
              disabled={mode === "Week"} // Week view not implemented yet
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
        <span className="text-sm text-muted-foreground">{sortedAppointments.length} bookings</span>
      </div>

      {/* Vertical Card List */}
      <div className="space-y-3">
        {sortedAppointments.map((appointment) => (
          <Card
            key={appointment.id}
            className={`border-border bg-card overflow-hidden shadow-sm card-hover ${appointment.status === "canceled" ? "opacity-60" : ""
              }`}
          >
            <CardContent className="p-0">
              <div className="flex">
                {/* Color accent bar for master */}
                <div className={`w-1 ${appointment.masterColor}`} />

                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 capitalize ${statusStyles[appointment.status]}`}
                      >
                        {appointment.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${appointment.masterColor}`} />
                        {appointment.master}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{appointment.time}</span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-medium text-foreground">{appointment.clientName}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.service}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground flex justify-between border-t border-border pt-2">
                    <span>Duration: {appointment.duration}</span>
                    <span>Ends: {appointment.endTime}</span>
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

      {!isLoading && sortedAppointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No appointments for {formattedDate}</p>
          <Button variant="link" onClick={onNewBooking} className="mt-2">
            Create Booking
          </Button>
        </div>
      )}
    </div>
  )
}
