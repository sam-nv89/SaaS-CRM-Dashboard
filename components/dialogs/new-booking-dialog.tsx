"use client"

import { useState, useEffect } from "react"
import { Check, ChevronRight, Clock, Loader2, Search, Plus, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getClients, getServices, createAppointment, getStylists, createClient } from "@/lib/db"
import type { Client, Service, AppointmentInsert, Stylist } from "@/types/database"
import type { Appointment } from "@/app/page"
import { ClientSheet } from "@/components/dialogs/client-sheet"

interface NewBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingCreated: (appointment: Appointment) => void
  /** Начальная дата для создания записи (из календаря) */
  initialDate?: Date
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
]

type Step = 1 | 2 | 3

const formatDateToISO = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

export function NewBookingDialog({ open, onOpenChange, onBookingCreated, initialDate }: NewBookingDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(formatDateToISO(initialDate ?? new Date()))

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Client Sheet State
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false)

  // Load clients and services when dialog opens
  useEffect(() => {
    if (open) {
      loadData()
      // Обновляем дату при открытии диалога
      if (initialDate) {
        setSelectedDate(formatDateToISO(initialDate))
      }
    }
  }, [open, initialDate])

  const loadData = async () => {
    try {
      setIsLoadingData(true)
      const [clientsData, servicesData, stylistsData] = await Promise.all([
        getClients(),
        getServices(),
        getStylists()
      ])
      setClients(clientsData)
      setServices(servicesData.filter(s => s.active))
      setStylists(stylistsData.filter(s => s.active))
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoadingData(false)
    }
  }

  const filteredClients = clients.filter(
    (c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch),
  )

  const resetForm = () => {
    setStep(1)
    setClientSearch("")
    setSelectedClient(null)
    setSelectedService(null)
    setSelectedStylist(null)
    setSelectedTime(null)
    setSelectedDate(new Date().toISOString().split("T")[0])
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleClientSaved = async (clientData: { name: string; phone: string; email: string; notes?: string }) => {
    try {
      const newClient = await createClient({
        ...clientData,
        status: 'new',
        total_visits: 0
      })
      setClients(prev => [...prev, newClient])
      setSelectedClient(newClient)
      toast.success("Client created")
      // No need to close sheet here as ClientSheet handles it, or we close it via prop
    } catch (e) {
      console.error(e)
      throw e // Let sheet handle error
    }
  }

  /**
   * Парсит строку duration и вычисляет время окончания.
   * Поддерживает форматы: "45 min", "1h", "1.5h", "2h", "2h 30min"
   */
  const calculateEndTime = (startTime: string, duration: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number)

    let durationMinutes = 0

    // Парсим различные форматы duration
    const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*h/)
    const minMatch = duration.match(/(\d+)\s*min/)

    if (hourMatch) {
      durationMinutes += parseFloat(hourMatch[1]) * 60
    }
    if (minMatch) {
      durationMinutes += parseInt(minMatch[1], 10)
    }

    // Если ничего не распарсилось, пробуем как чистое число минут
    if (durationMinutes === 0) {
      const pureNumber = parseInt(duration, 10)
      if (!isNaN(pureNumber)) {
        durationMinutes = pureNumber
      }
    }

    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const handleConfirm = async () => {
    if (!selectedClient || !selectedService || !selectedStylist || !selectedTime) return

    setIsLoading(true)

    try {
      const endTime = calculateEndTime(selectedTime, selectedService.duration)

      // Create appointment in Supabase
      const dbAppointment: AppointmentInsert = {
        client_id: selectedClient.id,
        service_id: selectedService.id,
        stylist_id: selectedStylist.id,
        master_name: selectedStylist.name, // Fallback purely for backward compatibility if needed, else redundant
        master_color: selectedStylist.color, // Fallback
        date: selectedDate,
        time: selectedTime,
        end_time: endTime,
        duration: selectedService.duration,
        status: "confirmed",
      }

      const created = await createAppointment(dbAppointment)

      // Create UI-friendly version for immediate display
      const uiAppointment: Appointment = {
        id: created.id,
        date: selectedDate,
        time: selectedTime,
        endTime: endTime,
        clientName: selectedClient.name,
        service: selectedService.name,
        duration: selectedService.duration,
        status: "confirmed",
        master: selectedStylist.name,
        masterColor: selectedStylist.color,
      }

      onBookingCreated(uiAppointment)
      handleClose(false)

      toast.success("Appointment booked!", {
        description: `${selectedClient.name} - ${selectedService.name} at ${selectedTime}`,
      })
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Failed to create appointment')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return !!selectedClient
    if (step === 2) return !!selectedService
    if (step === 3) return !!selectedStylist && !!selectedTime
    return false
  }

  return (

    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-4 rounded-xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-border">
            <DialogTitle className="text-lg font-semibold">Create Appointment</DialogTitle>
            {/* Step indicators */}
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn("flex-1 h-1 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-secondary")}
                />
              ))}
            </div>
          </DialogHeader>

          <div className="p-4 min-h-[320px]">
            {isLoadingData ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Step 1: Select Client */}
                {step === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">Select Client</Label>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:text-primary/80" onClick={() => setIsClientSheetOpen(true)}>
                        <Plus className="h-3 w-3 mr-1" /> New Client
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or phone..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                            selectedClient?.id === client.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {client.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground text-sm">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.phone}</p>
                          </div>
                          {selectedClient?.id === client.id && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm mb-2">No clients found</p>
                          <Button variant="outline" size="sm" onClick={() => setIsClientSheetOpen(true)}>
                            Create "{clientSearch}"
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Select Service */}
                {step === 2 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Select Service</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                            selectedService?.id === service.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <div className="text-left">
                            <p className="font-medium text-foreground text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" /> {service.duration}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">${service.price}</span>
                            {selectedService?.id === service.id && <Check className="h-5 w-5 text-primary" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Select Stylist & Time */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Select Stylist</Label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {stylists.map((stylist) => (
                          <button
                            key={stylist.id}
                            onClick={() => setSelectedStylist(stylist)}
                            className={cn(
                              "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all min-w-[80px]",
                              selectedStylist?.id === stylist.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border hover:bg-secondary",
                            )}
                          >
                            <div
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium",
                                stylist.color,
                              )}
                            >
                              {stylist.name[0]}
                            </div>
                            <span className="text-xs font-medium">{stylist.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Select Date</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Select Time</Label>
                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                              selectedTime === time
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-secondary/80",
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 pt-2 border-t border-border flex gap-2">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as Step)} className="flex-1">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canProceed() || isLoadingData}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={!canProceed() || isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ClientSheet
        open={isClientSheetOpen}
        onOpenChange={setIsClientSheetOpen}
        onClientSaved={handleClientSaved}
      />
    </>
  )
}
