"use client"

import { useState, useEffect } from "react"
import { addDays, subDays } from "date-fns"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"
import { DashboardView } from "@/components/views/dashboard-view"
import { CalendarView } from "@/components/views/calendar-view"
import { ClientsView } from "@/components/views/clients-view"
import { ServicesView } from "@/components/views/services-view"
import { SettingsView } from "@/components/views/settings-view"
import { NewBookingDialog } from "@/components/dialogs/new-booking-dialog"
import { Toaster } from "@/components/ui/sonner"
import { getAppointmentsWithDetails, createAppointment } from "@/lib/db"
import type { AppointmentInsert, AppointmentWithDetails } from "@/types/database"
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
  serviceId?: string // Added ID
  duration: string
  status: "confirmed" | "pending" | "canceled"
  master: string
  stylistId?: string // Added ID
  masterColor: string
}

export default function BeautyFlowApp() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Date navigation handlers
  const handlePrevDay = () => setCurrentDate((prev) => subDays(prev, 1))
  const handleNextDay = () => setCurrentDate((prev) => addDays(prev, 1))
  const handleToday = () => setCurrentDate(new Date())

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
      const dbAppointments = await getAppointmentsWithDetails()

      // Transform DB appointments to UI format
      const uiAppointments: Appointment[] = dbAppointments.map((apt: AppointmentWithDetails) => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        endTime: apt.end_time,
        clientName: apt.client?.name ?? 'Unknown Client',
        service: apt.service?.name ?? 'Unknown Service',
        serviceId: apt.service_id, // Map service_id
        duration: apt.duration,
        status: apt.status,
        // Logic to handle "Deleted Stylist" vs "Legacy Record"
        // If stylist_id exists but stylist object is null, it means the stylist was deleted.
        master: apt.stylist?.name ?? (apt.stylist_id ? 'Deleted Stylist' : apt.master_name),
        stylistId: apt.stylist_id,
        masterColor: apt.stylist?.color ?? (apt.stylist_id ? 'bg-gray-400' : apt.master_color),
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

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onViewCalendar={() => setActiveTab("calendar")} />
      case "calendar":
        return (
          <CalendarView
            appointments={appointments}
            onNewBooking={() => setBookingDialogOpen(true)}
            isLoading={isLoading}
            currentDate={currentDate}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onToday={handleToday}
            onDataChange={loadAppointments}
          />
        )
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
        currentDate={currentDate}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
      />
      <main className="px-4 py-4">{renderView()}</main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <NewBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onBookingCreated={loadAppointments}
        initialDate={currentDate}
      />

      <Toaster position="top-center" richColors />
    </div>
  )
}
