"use client"

import { useState, useEffect } from "react"
import { Check, ChevronRight, Clock, Loader2, Search, Plus, User, Calendar as CalendarIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getClients, getServices, createAppointment, getStylists, createClient, getCategories } from "@/lib/db"
import type { Client, Service, AppointmentInsert, Stylist } from "@/types/database"
import type { Appointment } from "@/app/page"
import { ClientSheet } from "@/components/dialogs/client-sheet"
import { AddServiceDialog } from "./add-service-dialog"
import { AddStylistDialog } from "./add-stylist-dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingCreated: () => void
  /** Начальная дата для создания записи (из календаря) */
  initialDate?: Date
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
]

type Step = 1 | 2 | 3

export function NewBookingDialog({ open, onOpenChange, onBookingCreated, initialDate }: NewBookingDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [date, setDate] = useState<Date | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Dialog States
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false)
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [isAddStylistOpen, setIsAddStylistOpen] = useState(false)

  // Load clients and services when dialog opens
  useEffect(() => {
    if (open) {
      loadData()
      if (initialDate) {
        setDate(initialDate)
      } else {
        setDate(undefined)
      }
      setStep(1)
      setSelectedClient(null)
      setSelectedService(null)
      setSelectedStylist(null)
      setSelectedTime("")
      setClientSearch("")
    }
  }, [open, initialDate])

  const loadData = async () => {
    try {
      setIsLoadingData(true)
      const [clientsData, servicesData, stylistsData, categoriesData] = await Promise.all([
        getClients(),
        getServices(),
        getStylists(),
        getCategories()
      ])
      setClients(clientsData)
      setServices(servicesData.filter(s => s.active))
      setStylists(stylistsData.filter(s => s.active))
      setCategories(categoriesData)
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

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep(1)
      setSelectedClient(null)
      setSelectedService(null)
      setSelectedStylist(null)
      setSelectedTime("")
      setClientSearch("")
      setDate(undefined)
    }
    onOpenChange(open)
  }

  const handleClientSaved = (client: Client) => {
    setClients(prev => [...prev, client])
    setSelectedClient(client)
    setIsClientSheetOpen(false)
  }

  const handleServiceCreated = (service: Service) => {
    setServices(prev => [...prev, service])
    setSelectedService(service)
    setIsAddServiceOpen(false)
  }

  const handleStylistCreated = (stylist: Stylist) => {
    setStylists(prev => [...prev, stylist])
    setSelectedStylist(stylist)
    setIsAddStylistOpen(false)
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
    if (!selectedClient || !selectedService || !selectedStylist || !selectedTime || !date) return

    setIsLoading(true)

    try {
      const endTime = calculateEndTime(selectedTime, selectedService.duration)

      // Create appointment in Supabase
      const dbAppointment: AppointmentInsert = {
        client_id: selectedClient.id,
        service_id: selectedService.id,
        stylist_id: selectedStylist.id,
        service_name: selectedService.name,
        client_name: selectedClient.name,
        master_name: selectedStylist.name,
        master_color: selectedStylist.color,
        date: date.toISOString().split("T")[0],
        time: selectedTime,
        end_time: endTime,
        status: "confirmed",
        price: selectedService.price,
      }

      await createAppointment(dbAppointment)

      onBookingCreated()
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
    if (step === 3) return !!selectedStylist && !!selectedTime && !!date
    return false
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-4 rounded-xl p-0 overflow-hidden h-[600px] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-border shrink-0">
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

          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingData ? (
              <div className="flex items-center justify-center h-full">
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
                    <div className="space-y-2">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            selectedClient?.id === client.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:bg-secondary/50",
                          )}
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {client.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{client.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                          </div>
                          {selectedClient?.id === client.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                        </button>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="text-center py-8">
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">Select Service</Label>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:text-primary/80" onClick={() => setIsAddServiceOpen(true)}>
                        <Plus className="h-3 w-3 mr-1" /> New Service
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                            selectedService?.id === service.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:bg-secondary/50",
                          )}
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.duration} • ${service.price}</p>
                          </div>
                          {selectedService?.id === service.id && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                      {services.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-sm mb-2">No services found</p>
                          <Button variant="outline" size="sm" onClick={() => setIsAddServiceOpen(true)}>
                            Add Service
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Date, Time & Stylist */}
                {step === 3 && (
                  <div className="space-y-6">
                    {/* Date Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Stylist Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground">Stylist</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:text-primary/80" onClick={() => setIsAddStylistOpen(true)}>
                          <Plus className="h-3 w-3 mr-1" /> New Stylist
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {stylists.map((stylist) => (
                          <button
                            key={stylist.id}
                            onClick={() => setSelectedStylist(stylist)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border transition-all",
                              selectedStylist?.id === stylist.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:bg-secondary/50",
                            )}
                          >
                            <div className={`h-6 w-6 rounded-full shrink-0 ${stylist.color}`} />
                            <span className="text-sm font-medium truncate">{stylist.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>


                    {/* Time Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Time</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 shrink-0 flex-row gap-2 sm:justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)} className="flex-1 sm:flex-none">
                Back
              </Button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canProceed() || isLoadingData}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={!canProceed() || isLoading}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientSheet
        open={isClientSheetOpen}
        onOpenChange={setIsClientSheetOpen}
        onClientSaved={handleClientSaved}
      />

      <AddServiceDialog
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        onServiceCreated={handleServiceCreated}
        existingCategories={categories}
      />

      <AddStylistDialog
        open={isAddStylistOpen}
        onOpenChange={setIsAddStylistOpen}
        onStylistCreated={handleStylistCreated}
      />
    </>
  )
}
