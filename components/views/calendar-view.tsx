"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ChevronLeft, Plus, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns"
import type { Appointment } from "@/app/page"

type AppointmentStatus = "confirmed" | "pending" | "canceled"

import { EditBookingDialog } from "@/components/dialogs/edit-booking-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect } from "react"
import type { Stylist } from "@/types/database"

interface CalendarViewProps {
  appointments: Appointment[]
  onNewBooking: () => void
  isLoading?: boolean
  currentDate: Date
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
  onDataChange?: () => void
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
  onDataChange
}: CalendarViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All")
  const [viewMode, setViewMode] = useState<string>("Day")

  // Edit State
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt)
    setIsEditOpen(true)
  }

  const handleEditClosed = (open: boolean) => {
    setIsEditOpen(open)
    if (!open) {
      setEditingAppointment(null)
    }
  }

  const handleUpdated = () => {
    if (onDataChange) onDataChange()
  }

  const [stylists, setStylists] = useState<Stylist[]>([])
  const [selectedStylistId, setSelectedStylistId] = useState<string>("all")

  useEffect(() => {
    const loadStylists = async () => {
      const { getStylists } = await import("@/lib/db")
      const data = await getStylists()
      setStylists(data.filter(s => s.active))
    }
    loadStylists()
  }, [])

  const formattedDate = format(currentDate, "EEEE, MMMM d")

  // Week view calculations
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date): Appointment[] => {
    return appointments.filter((apt) => {
      try {
        return isSameDay(parseISO(apt.date), day)
      } catch {
        return false
      }
    })
  }

  const filteredAppointments = appointments.filter((apt) => {
    // Date filter - only for Day view
    if (viewMode === "Day") {
      try {
        if (!isSameDay(parseISO(apt.date), currentDate)) return false
      } catch {
        return false
      }
    }

    // Status filter
    if (activeFilter !== "All" && apt.status !== activeFilter.toLowerCase()) return false

    // Stylist filter
    if (selectedStylistId !== "all") {
      // console.log(`[DEBUG] Filtering: ${apt.id} StylistID: ${apt.stylistId} vs Selected: ${selectedStylistId}`)
      // Note: apt.stylistId might be undefined if not mapped correctly in page.tsx
      // Let's debug this specific field
      if (apt.stylistId !== selectedStylistId) return false
    }

    return true
  })

  // Sort by time
  const sortedAppointments = [...filteredAppointments].sort((a, b) =>
    a.time.localeCompare(b.time)
  )

  // Debug: Log first filtered appointment to check structure
  /*
  useEffect(() => {
    if (filteredAppointments.length > 0) {
        console.log('[DEBUG] Calendar Filtered Apt Sample:', filteredAppointments[0])
    }
  }, [filteredAppointments])
  */

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
      <div className="flex flex-col gap-2">
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

        {/* Stylist Filter */}
        <Select value={selectedStylistId} onValueChange={setSelectedStylistId}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="All Spectialists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialists</SelectItem>
            {stylists.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Week View */}
      {viewMode === "Week" && (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDay(day)
              const dayIsToday = isToday(day)
              const isSelected = isSameDay(day, currentDate)

              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-lg p-2 min-h-[120px] transition-colors cursor-pointer ${dayIsToday ? 'bg-primary/10 border-2 border-primary' :
                    isSelected ? 'bg-secondary' : 'bg-card border border-border'
                    }`}
                  onClick={() => {
                    // Navigate to this day
                    const diff = day.getTime() - currentDate.getTime()
                    const daysDiff = Math.round(diff / (1000 * 60 * 60 * 24))
                    if (daysDiff > 0) {
                      for (let i = 0; i < daysDiff; i++) onNextDay()
                    } else if (daysDiff < 0) {
                      for (let i = 0; i < Math.abs(daysDiff); i++) onPrevDay()
                    }
                  }}
                >
                  <div className="text-center mb-2">
                    <p className={`text-[10px] uppercase ${dayIsToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-lg font-semibold ${dayIsToday ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-[9px] p-1 rounded ${apt.masterColor} bg-opacity-20 truncate cursor-pointer hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(apt)
                        }}
                      >
                        <span className="font-medium">{apt.time}</span>
                        <span className="ml-1 text-muted-foreground">{apt.clientName.split(' ')[0]}</span>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <p className="text-[9px] text-muted-foreground text-center">
                        +{dayAppointments.length - 3} more
                      </p>
                    )}
                    {dayAppointments.length === 0 && (
                      <p className="text-[9px] text-muted-foreground text-center">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "Day" && (
        <>
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
                className={`border-border bg-card overflow-hidden shadow-sm card-hover cursor-pointer transition-all hover:bg-secondary/20 ${appointment.status === "canceled" ? "opacity-60" : ""
                  }`}
                onClick={() => handleEdit(appointment)}
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
        </>
      )}

      {/* Edit Dialog */}
      <EditBookingDialog
        open={isEditOpen}
        onOpenChange={handleEditClosed}
        onAppointmentUpdated={handleUpdated}
        appointment={editingAppointment}
      />
    </div>
  )
}
