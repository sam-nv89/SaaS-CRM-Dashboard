"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type AppointmentStatus = "confirmed" | "pending" | "canceled"

interface Appointment {
  id: string
  time: string
  endTime: string
  clientName: string
  clientAvatar?: string
  service: string
  duration: string
  status: AppointmentStatus
  master: string
}

const appointments: Appointment[] = [
  {
    id: "1",
    time: "09:00",
    endTime: "10:00",
    clientName: "Sarah Johnson",
    service: "Hair Coloring",
    duration: "1h",
    status: "confirmed",
    master: "Emma",
  },
  {
    id: "2",
    time: "10:30",
    endTime: "11:30",
    clientName: "Michael Chen",
    service: "Haircut & Styling",
    duration: "1h",
    status: "confirmed",
    master: "Sophia",
  },
  {
    id: "3",
    time: "11:00",
    endTime: "12:00",
    clientName: "Emily Davis",
    service: "Manicure & Pedicure",
    duration: "1h",
    status: "pending",
    master: "Olivia",
  },
  {
    id: "4",
    time: "12:30",
    endTime: "13:30",
    clientName: "James Wilson",
    service: "Beard Trim",
    duration: "30m",
    status: "confirmed",
    master: "Emma",
  },
  {
    id: "5",
    time: "14:00",
    endTime: "15:30",
    clientName: "Lisa Anderson",
    service: "Full Hair Treatment",
    duration: "1.5h",
    status: "pending",
    master: "Sophia",
  },
  {
    id: "6",
    time: "15:00",
    endTime: "16:00",
    clientName: "David Brown",
    service: "Haircut",
    duration: "45m",
    status: "canceled",
    master: "Olivia",
  },
  {
    id: "7",
    time: "16:30",
    endTime: "17:30",
    clientName: "Jennifer Lee",
    service: "Balayage",
    duration: "2h",
    status: "confirmed",
    master: "Emma",
  },
]

const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: "bg-confirmed/10 text-confirmed border-confirmed/20",
  pending: "bg-pending/10 text-pending border-pending/20",
  canceled: "bg-canceled/10 text-canceled border-canceled/20 line-through",
}

const filters = ["All", "Confirmed", "Pending", "Canceled"] as const

export function AppointmentList() {
  const [activeFilter, setActiveFilter] = useState<string>("All")

  const filteredAppointments = appointments.filter((apt) => {
    if (activeFilter === "All") return true
    return apt.status === activeFilter.toLowerCase()
  })

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
        <span className="text-sm text-muted-foreground">{appointments.length} bookings</span>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            className={`rounded-full shrink-0 ${
              activeFilter === filter ? "bg-primary text-primary-foreground" : "bg-card text-foreground border-border"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Appointment Cards */}
      <div className="space-y-3">
        {filteredAppointments.map((appointment) => (
          <Card
            key={appointment.id}
            className="border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardContent className="p-0">
              <div className="flex">
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
                        <AvatarImage src={appointment.clientAvatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {appointment.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">{appointment.clientName}</p>
                        <p className="text-xs text-muted-foreground">with {appointment.master}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize ${statusStyles[appointment.status]}`}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{appointment.service}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No appointments found</p>
        </div>
      )}
    </section>
  )
}
