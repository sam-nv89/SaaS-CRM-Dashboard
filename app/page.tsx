"use client"

import { useState } from "react"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { DashboardView } from "@/components/views/dashboard-view"
import { CalendarView } from "@/components/views/calendar-view"
import { ClientsView } from "@/components/views/clients-view"
import { ServicesView } from "@/components/views/services-view"
import { SettingsView } from "@/components/views/settings-view"
import { NewBookingDialog } from "@/components/dialogs/new-booking-dialog"
import { Toaster } from "@/components/ui/sonner"

export type TabId = "dashboard" | "calendar" | "clients" | "services" | "settings"

export interface Appointment {
  id: string
  time: string
  endTime: string
  clientName: string
  service: string
  duration: string
  status: "confirmed" | "pending" | "canceled"
  master: string
  masterColor: string
}

export default function BeautyFlowApp() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      time: "09:00",
      endTime: "10:00",
      clientName: "Sarah Johnson",
      service: "Hair Coloring",
      duration: "1h",
      status: "confirmed",
      master: "Emma",
      masterColor: "bg-chart-1",
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
      masterColor: "bg-chart-2",
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
      masterColor: "bg-chart-3",
    },
    {
      id: "4",
      time: "12:30",
      endTime: "13:00",
      clientName: "James Wilson",
      service: "Beard Trim",
      duration: "30m",
      status: "confirmed",
      master: "Emma",
      masterColor: "bg-chart-1",
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
      masterColor: "bg-chart-2",
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
      masterColor: "bg-chart-3",
    },
    {
      id: "7",
      time: "16:30",
      endTime: "18:30",
      clientName: "Jennifer Lee",
      service: "Balayage",
      duration: "2h",
      status: "confirmed",
      master: "Emma",
      masterColor: "bg-chart-1",
    },
  ])

  const addAppointment = (apt: Appointment) => {
    setAppointments((prev) => [...prev, apt].sort((a, b) => a.time.localeCompare(b.time)))
  }

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onViewCalendar={() => setActiveTab("calendar")} />
      case "calendar":
        return <CalendarView appointments={appointments} onNewBooking={() => setBookingDialogOpen(true)} />
      case "clients":
        return <ClientsView />
      case "services":
        return <ServicesView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView onViewCalendar={() => setActiveTab("calendar")} />
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader activeTab={activeTab} onBookClick={() => setBookingDialogOpen(true)} />
      <main className="px-4 py-4">{renderView()}</main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <NewBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onBookingCreated={addAppointment}
      />

      <Toaster position="top-center" richColors />
    </div>
  )
}
