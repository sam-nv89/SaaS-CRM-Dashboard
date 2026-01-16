"use client"

import { useState, useEffect } from "react"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { DashboardView } from "@/components/views/dashboard-view"
import { CalendarView } from "@/components/views/calendar-view"
import { ClientsView } from "@/components/views/clients-view"
import { ServicesView } from "@/components/views/services-view"
import { SettingsView } from "@/components/views/settings-view"
import { NewBookingDialog } from "@/components/dialogs/new-booking-dialog"
import { Toaster } from "@/components/ui/sonner"
import { getAppointments, createAppointment } from "@/lib/db"
import type { Appointment as DbAppointment, AppointmentInsert } from "@/types/database"
import { toast } from "sonner"

export type TabId = "dashboard" | "calendar" | "clients" | "services" | "settings"

// UI-friendly appointment type (for calendar display)
export interface Appointment {
  id: string
  date: string // YYYY-MM-DD
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
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState("")

  // Reset search when tab changes
  useEffect(() => {
    setGlobalSearch("")
  }, [activeTab])

  // Load appointments from Supabase on mount
  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      const dbAppointments = await getAppointments()

      // Transform DB appointments to UI format
      const uiAppointments: Appointment[] = dbAppointments.map((apt) => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        endTime: apt.end_time,
        clientName: apt.master_name, // TODO: fetch client name from client_id
        service: apt.duration, // TODO: fetch service name from service_id
        duration: apt.duration,
        status: apt.status,
        master: apt.master_name,
        masterColor: apt.master_color,
      }))

      setAppointments(uiAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
      // Fall back to empty array if DB fails
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

  const addAppointment = async (apt: Appointment) => {
    // Add to UI immediately (optimistic update)
    setAppointments((prev) => [...prev, apt].sort((a, b) => a.time.localeCompare(b.time)))

    // Save to Supabase
    try {
      const dbAppointment: AppointmentInsert = {
        client_id: apt.id, // This should be actual client_id from selection
        service_id: apt.id, // This should be actual service_id from selection
        master_name: apt.master,
        master_color: apt.masterColor,
        date: new Date().toISOString().split('T')[0], // Today
        time: apt.time,
        end_time: apt.endTime,
        duration: apt.duration,
        status: apt.status,
      }
      await createAppointment(dbAppointment)
    } catch (error) {
      console.error('Error saving appointment:', error)
      toast.error('Failed to save appointment')
    }
  }

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onViewCalendar={() => setActiveTab("calendar")} />
      case "calendar":
        return <CalendarView appointments={appointments} onNewBooking={() => setBookingDialogOpen(true)} isLoading={isLoading} />
      case "clients":
        return <ClientsView searchQuery={globalSearch} />
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
      <MobileHeader
        activeTab={activeTab}
        onBookClick={() => setBookingDialogOpen(true)}
        onSearch={setGlobalSearch}
        searchValue={globalSearch}
      />
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
