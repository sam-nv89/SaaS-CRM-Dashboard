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
  /** Callback for creating booking with preset time/stylist from Grid View */
  onNewBookingWithPreset?: (preset: { time: string; stylistId: string }) => void
}

const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: "bg-confirmed/10 text-confirmed border-confirmed/20",
  pending: "bg-pending/10 text-pending border-pending/20",
  canceled: "bg-canceled/10 text-canceled border-canceled/20",
}

const filters = ["All", "Confirmed", "Pending", "Canceled"] as const
const viewModes = ["Day", "Week", "Grid"] as const

export function CalendarView({
  appointments,
  onNewBooking,
  isLoading,
  currentDate,
  onPrevDay,
  onNextDay,
  onToday,
  onDataChange,
  onNewBookingWithPreset
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

  // Grid View: Generate time slots (30-min intervals)
  const generateTimeSlots = (startHour = 9, endHour = 21): string[] => {
    const slots: string[] = []
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`)
      slots.push(`${h.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const gridTimeSlots = useMemo(() => generateTimeSlots(), [])

  // Parse duration string to minutes
  const parseDurationToMinutes = (duration: string): number => {
    let mins = 0
    const dur = duration.toLowerCase()
    const hourMatch = dur.match(/(\d+(?:\.\d+)?)\s*h/)
    const minMatch = dur.match(/(\d+)\s*min/)
    if (hourMatch) mins += parseFloat(hourMatch[1]) * 60
    if (minMatch) mins += parseInt(minMatch[1], 10)
    if (mins === 0) mins = parseInt(dur, 10) || 60
    return mins
  }

  // Find appointment that occupies a specific slot (time + stylist)
  const findAppointmentAtSlot = (slotTime: string, stylistId: string): Appointment | null => {
    const dayAppointments = getAppointmentsForDay(currentDate)

    for (const apt of dayAppointments) {
      if (apt.stylistId !== stylistId) continue

      // Check if this slot falls within appointment's time range
      const aptStartMins = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1])
      const aptDurationMins = parseDurationToMinutes(apt.duration)
      const aptEndMins = aptStartMins + aptDurationMins

      const slotMins = parseInt(slotTime.split(':')[0]) * 60 + parseInt(slotTime.split(':')[1])

      if (slotMins >= aptStartMins && slotMins < aptEndMins) {
        return apt
      }
    }
    return null
  }

  // Check if this slot is the START of an appointment (for rendering the card)
  const isAppointmentStart = (slotTime: string, stylistId: string): boolean => {
    const apt = findAppointmentAtSlot(slotTime, stylistId)
    return apt !== null && apt.time === slotTime
  }

  // Calculate how many 30-min slots an appointment spans (based on time/endTime, not stored duration)
  const getAppointmentSpan = (apt: Appointment): number => {
    // Parse start time
    const [startH, startM] = apt.time.split(':').map(Number)
    const startMins = startH * 60 + startM

    // Parse end time
    const endTimeParts = apt.endTime.split(':').map(Number)
    const endMins = endTimeParts[0] * 60 + endTimeParts[1]

    // Calculate actual duration in minutes
    const durationMins = endMins - startMins

    // Return at least 1 slot (30-min increments, rounded up)
    return Math.max(1, Math.ceil(durationMins / 30))
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

      {/* Grid View - Staff Workload Table */}
      {viewMode === "Grid" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Staff Schedule</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">{format(currentDate, "MMM d, yyyy")}</span>
            </div>
          </div>

          {stylists.length === 0 ? (
            <div className="text-center py-12 border rounded-xl border-dashed bg-muted/20">
              <p className="text-muted-foreground">No stylists available</p>
            </div>
          ) : (
            <div className="border rounded-xl shadow-sm bg-card overflow-hidden flex flex-col max-h-[75vh]">
              {/* Fixed Header Row - Stylists */}
              <div
                className="grid bg-background border-b-2 border-border shadow-sm flex-shrink-0"
                style={{ gridTemplateColumns: `60px repeat(${stylists.length}, 1fr)` }}
              >
                <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center border-r border-border/50 bg-background">
                  Time
                </div>
                {stylists.map((stylist) => (
                  <div
                    key={stylist.id}
                    className="p-3 flex items-center justify-center gap-2 border-r border-border/50 last:border-r-0 hover:bg-muted/30 transition-colors bg-background"
                  >
                    <Avatar className="h-6 w-6 border border-border">
                      <AvatarFallback className={`text-[10px] ${stylist.color} bg-opacity-20 text-foreground`}>
                        {stylist.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{stylist.name}</span>
                  </div>
                ))}
              </div>

              {/* Scrollable Time Slots Grid */}
              <div className="overflow-auto flex-1">
                <div className="min-w-[600px]">
                  {/* Time Slots Grid */}
                  <div className="bg-muted/5">
                    {gridTimeSlots.map((timeSlot) => {
                      return (
                        <div
                          key={timeSlot}
                          className="grid group hover:bg-muted/10 transition-colors border-b border-border/40 last:border-0"
                          style={{ gridTemplateColumns: `60px repeat(${stylists.length}, 1fr)` }}
                        >
                          {/* Time Label */}
                          <div className={`
                            py-2 px-1 text-[11px] font-medium text-center border-r border-border/50 
                            flex items-start justify-center pt-2 sticky left-0 z-10 
                            bg-background/95 backdrop-blur border-r-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]
                            ${timeSlot.endsWith(':00') ? 'text-primary font-bold' : 'text-muted-foreground'}
                          `}>
                            {timeSlot}
                          </div>

                          {/* Stylist Cells */}
                          {stylists.map((stylist) => {
                            const apt = findAppointmentAtSlot(timeSlot, stylist.id)
                            const isStart = apt && apt.time === timeSlot
                            const isOccupiedByPrevious = apt !== null && !isStart

                            // For occupied/empty slots, use a fixed height to ensure grid alignment
                            // Standard row height: 48px (increased for readability)
                            const ROW_H = 48

                            if (isOccupiedByPrevious) {
                              // Occupied by a previous row's appointment - make transparent so card shows through
                              return <div key={stylist.id} style={{ height: `${ROW_H}px` }} className={`border-r border-border/30 last:border-r-0 bg-transparent pointer-events-none`} />
                            }

                            if (isStart && apt) {
                              // Calculate PRECISE height based on actual minutes, not rounded slots
                              const [startH, startM] = apt.time.split(':').map(Number)
                              const startMins = startH * 60 + startM
                              const endTimeParts = apt.endTime.split(':').map(Number)
                              const endMins = endTimeParts[0] * 60 + endTimeParts[1]
                              const durationMins = endMins - startMins

                              // Each 30-min slot = ROW_H pixels, so 1 minute = ROW_H/30 pixels
                              const pixelsPerMinute = ROW_H / 30
                              const heightPx = Math.max(ROW_H, durationMins * pixelsPerMinute)

                              return (
                                <div
                                  key={stylist.id}
                                  className={`relative border-r border-border/30 last:border-r-0 p-0.5 z-10 overflow-visible`}
                                  style={{ height: `${ROW_H}px` }}
                                >
                                  {/* Appointment Card - Precise Height */}
                                  <div
                                    className={`
                                      absolute top-0 left-0 right-0 z-10 m-[3px] rounded-lg shadow-sm border
                                      flex flex-col cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md
                                      ${statusStyles[apt.status]}
                                      bg-card overflow-hidden
                                    `}
                                    style={{
                                      height: `calc(${heightPx}px - 7px)`,
                                      borderLeftWidth: '4px',
                                      borderLeftColor: apt.masterColor?.includes('bg-') ? undefined : apt.masterColor
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEdit(apt)
                                    }}
                                  >
                                    {/* Header: Time + Price */}
                                    <div className="flex justify-between items-center px-2 pt-1.5">
                                      <span className="text-xs font-mono font-medium text-foreground/70 leading-none min-w-0 truncate">
                                        {apt.time} - {apt.endTime}
                                      </span>
                                      {apt.price && (
                                        <span className="text-xs font-bold text-primary leading-none bg-primary/10 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                                          ${apt.price}
                                        </span>
                                      )}
                                    </div>

                                    {/* Body: Content */}
                                    <div className="px-2 flex flex-col justify-start flex-1 min-h-0 pb-1">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        {/* Status Dot */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${apt.status === 'confirmed' ? 'bg-confirmed' :
                                          apt.status === 'pending' ? 'bg-pending' : 'bg-canceled'
                                          }`} />
                                        <span className="font-bold text-sm text-foreground truncate leading-tight">
                                          {apt.clientName}
                                        </span>
                                      </div>

                                      <span className="text-xs text-muted-foreground truncate leading-snug opacity-90 pl-3.5">
                                        {apt.service}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }

                            // Empty slot
                            return (
                              <div
                                key={stylist.id}
                                className={`border-r border-border/30 last:border-r-0 relative cursor-pointer group/cell`}
                                style={{ height: `${ROW_H}px` }}
                                onClick={() => {
                                  if (onNewBookingWithPreset) {
                                    onNewBookingWithPreset({ time: timeSlot, stylistId: stylist.id })
                                  } else {
                                    onNewBooking()
                                  }
                                }}
                              >
                                {/* Hover effect fills the cell */}
                                <div className="absolute inset-0 m-px rounded opacity-0 group-hover/cell:opacity-100 bg-primary/5 transition-opacity flex items-center justify-center">
                                  <Plus className="h-3 w-3 text-primary opacity-40" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
