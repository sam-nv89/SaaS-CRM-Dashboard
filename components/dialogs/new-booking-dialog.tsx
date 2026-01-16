"use client"

import { useState, useEffect } from "react"
import { Check, ChevronRight, Clock, Loader2, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getClients, getServices, createAppointment } from "@/lib/db"
import type { Client, Service, AppointmentInsert } from "@/types/database"
import type { Appointment } from "@/app/page"

interface NewBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingCreated: (appointment: Appointment) => void
}

const masters = [
  { id: "1", name: "Emma", color: "bg-chart-1" },
  { id: "2", name: "Sophia", color: "bg-chart-2" },
  { id: "3", name: "Olivia", color: "bg-chart-3" },
]

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
]

type Step = 1 | 2 | 3

export function NewBookingDialog({ open, onOpenChange, onBookingCreated }: NewBookingDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedMaster, setSelectedMaster] = useState<(typeof masters)[0] | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Load clients and services when dialog opens
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setIsLoadingData(true)
      const [clientsData, servicesData] = await Promise.all([
        getClients(),
        getServices()
      ])
      setClients(clientsData)
      setServices(servicesData.filter(s => s.active))
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
    setSelectedMaster(null)
    setSelectedTime(null)
    setSelectedDate(new Date().toISOString().split("T")[0])
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleConfirm = async () => {
    if (!selectedClient || !selectedService || !selectedMaster || !selectedTime) return

    setIsLoading(true)

    try {
      // Create appointment in Supabase
      const dbAppointment: AppointmentInsert = {
        client_id: selectedClient.id,
        service_id: selectedService.id,
        master_name: selectedMaster.name,
        master_color: selectedMaster.color,
        date: selectedDate,
        time: selectedTime,
        end_time: selectedTime, // TODO: calculate based on duration
        duration: selectedService.duration,
        status: "confirmed",
      }

      const created = await createAppointment(dbAppointment)

      // Create UI-friendly version for immediate display
      const uiAppointment: Appointment = {
        id: created.id,
        time: selectedTime,
        endTime: selectedTime,
        clientName: selectedClient.name,
        service: selectedService.name,
        duration: selectedService.duration,
        status: "confirmed",
        master: selectedMaster.name,
        masterColor: selectedMaster.color,
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
    if (step === 3) return !!selectedMaster && !!selectedTime
    return false
  }

  return (
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
                  <Label className="text-sm font-medium text-muted-foreground">Select Client</Label>
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
                      <p className="text-center text-muted-foreground py-4">No clients found</p>
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

              {/* Step 3: Select Master & Time */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Select Stylist</Label>
                    <div className="flex gap-2">
                      {masters.map((master) => (
                        <button
                          key={master.id}
                          onClick={() => setSelectedMaster(master)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                            selectedMaster?.id === master.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <div
                            className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium",
                              master.color,
                            )}
                          >
                            {master.name[0]}
                          </div>
                          <span className="text-xs font-medium">{master.name}</span>
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
  )
}
