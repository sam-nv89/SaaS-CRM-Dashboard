"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Calendar as CalendarIcon, X, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    deleteAppointment,
    updateAppointment,
    getServices,
    getStylists,
    checkAvailability,
} from "@/lib/db"
import type { Service, Stylist, AppointmentUpdate } from "@/types/database"
import type { Appointment } from "@/app/page"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface EditBookingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAppointmentUpdated: () => void
    appointment: Appointment | null
}

const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
]

const statuses = [
    { value: "confirmed", label: "Confirmed", color: "text-green-600" },
    { value: "pending", label: "Pending", color: "text-orange-500" },
    { value: "canceled", label: "Canceled", color: "text-red-500" },
]

export function EditBookingDialog({ open, onOpenChange, onAppointmentUpdated, appointment }: EditBookingDialogProps) {
    const [services, setServices] = useState<Service[]>([])
    const [stylists, setStylists] = useState<Stylist[]>([])

    const [date, setDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string>("")
    const [selectedServiceId, setSelectedServiceId] = useState<string>("")
    const [selectedStylistId, setSelectedStylistId] = useState<string>("")
    const [status, setStatus] = useState<string>("confirmed")
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [availableSlots, setAvailableSlots] = useState<string[]>([])

    // Load available slots
    useEffect(() => {
        const fetchSlots = async () => {
            if (date && selectedStylistId && selectedServiceId) {
                const { getAvailableTimeSlots } = await import("@/lib/db")
                const selectedService = services.find(s => s.id === selectedServiceId)
                let durationMin = 60

                if (selectedService) {
                    const dur = selectedService.duration.toLowerCase()
                    if (dur.includes('min') && !dur.includes('h')) {
                        const matches = dur.match(/(\d+)/)
                        if (matches) durationMin = parseInt(matches[0])
                    } else if (dur.includes('h')) {
                        if (dur.includes('.')) durationMin = parseFloat(dur) * 60
                        else durationMin = parseInt(dur) * 60
                    }
                }

                const slots = await getAvailableTimeSlots(selectedStylistId, date, durationMin, appointment?.id)
                setAvailableSlots(slots)
            }
        }
        fetchSlots()
    }, [date, selectedStylistId, selectedServiceId, services, appointment])

    useEffect(() => {
        if (open) {
            loadData()
            if (appointment) {
                // Initialize form with appointment data
                setDate(parseISO(appointment.date))
                setSelectedTime(appointment.time)
                setStatus(appointment.status)
                // Note: appointment prop from CalendarView currently doesn't have IDs for service/stylist? 
                // Need to check Appointment interface in page.tsx vs AppointmentWithDetails in db.ts
                // The Appointment interface in page.tsx lacks service_id and stylist_id.
                // We might need to refactor passing data or duplicate logic.
                // For now, I'll rely on matching names if needed, but ideally I should pass IDs.
                // Wait, CalendarView receives Appointment[], which comes from loadAppointments in page.tsx
                // uiAppointments in page.tsx currently maps from DB but MISSES IDs.
                // I need to update page.tsx to include IDs first. 
                // Assuming page.tsx is updated (I will do that next), I can access IDs.
                if ((appointment as any).serviceId) setSelectedServiceId((appointment as any).serviceId)
                if ((appointment as any).stylistId) setSelectedStylistId((appointment as any).stylistId)
            }
        }
    }, [open, appointment])

    const loadData = async () => {
        try {
            const [servicesData, stylistsData] = await Promise.all([
                getServices(),
                getStylists(),
            ])
            setServices(servicesData.filter(s => s.active))
            setStylists(stylistsData.filter(s => s.active))
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Failed to load services/stylists')
        }
    }

    const handleClose = (open: boolean) => {
        onOpenChange(open)
    }

    const handleSave = async () => {
        if (!appointment || !date || !selectedTime || !selectedServiceId || !selectedStylistId) return

        setIsLoading(true)
        try {
            const selectedService = services.find(s => s.id === selectedServiceId)
            const selectedStylist = stylists.find(s => s.id === selectedStylistId)

            if (!selectedService) throw new Error("Service not found")

            // Calculate new end time
            const duration = selectedService.duration
            // Helper to calculation end time
            const calculateEndTime = (startTime: string, duration: string) => {
                const [hours, minutes] = startTime.split(':').map(Number)

                // Parse duration
                let durationMinutes = 0
                if (duration.includes('h')) {
                    const parts = duration.split('h')
                    durationMinutes += parseInt(parts[0]) * 60
                    if (parts[1] && parts[1].includes('min')) {
                        durationMinutes += parseInt(parts[1])
                    }
                } else {
                    durationMinutes = parseInt(duration)
                }

                const totalMinutes = hours * 60 + minutes + durationMinutes
                const endHours = Math.floor(totalMinutes / 60) % 24
                const endMinutes = totalMinutes % 60
                return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
            }

            const endTime = calculateEndTime(selectedTime, duration)

            // Validate Availability
            if (selectedStylistId) {
                try {
                    const isAvailable = await checkAvailability(
                        selectedStylistId,
                        format(date, "yyyy-MM-dd"),
                        selectedTime,
                        endTime,
                        appointment.id // Exclude current appointment
                    )

                    if (!isAvailable) {
                        toast.error("This stylist is already booked for this time.")
                        setIsLoading(false)
                        return
                    }
                } catch (error) {
                    console.error("Validation failed", error)
                    toast.error("Failed to validate availability")
                    setIsLoading(false)
                    return
                }
            }

            const dbAppointment: AppointmentUpdate = {
                id: appointment.id,
                date: format(date, "yyyy-MM-dd"),
                time: selectedTime,
                status: status as any,
                service_id: selectedServiceId,
                stylist_id: selectedStylistId,
                // Update denormalized/cached fields if they exist in schema?
                // Let's assume schema mainly uses IDs now, but if we have master_name, update it.
                master_name: selectedStylist ? selectedStylist.name : undefined,
                master_color: selectedStylist ? selectedStylist.color : undefined,
            }

            await updateAppointment(dbAppointment)
            onAppointmentUpdated()
            handleClose(false)
            toast.success("Appointment updated")
        } catch (error: any) {
            console.error('Error updating appointment:', error)
            toast.error(`Failed to update: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!appointment) return
        setIsDeleting(true)
        try {
            await deleteAppointment(appointment.id)
            onAppointmentUpdated()
            handleClose(false)
            toast.success("Appointment deleted")
        } catch (error) {
            console.error("Error deleting appointment:", error)
            toast.error("Failed to delete appointment")
        } finally {
            setIsDeleting(false)
        }
    }

    if (!appointment) return null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md mx-4 rounded-xl p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-border bg-muted/20">
                    <DialogTitle>Edit Appointment</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Change date, time, stylist, or status of the booking.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 space-y-4">
                    {/* Client Info (Read Only) */}
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {appointment.clientName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium">{appointment.clientName}</p>
                            <p className="text-xs text-muted-foreground">Client</p>
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map(s => (
                                    <SelectItem key={s.value} value={s.value} className={s.color}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Service</Label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select Service" />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({s.duration} - ${s.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stylist Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Stylist</Label>
                        <Select value={selectedStylistId} onValueChange={setSelectedStylistId}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select Stylist" />
                            </SelectTrigger>
                            <SelectContent>
                                {stylists.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${s.color}`} />
                                            {s.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Date</Label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal h-10">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "MMM d, yyyy") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(newDate) => {
                                            setDate(newDate)
                                            setIsCalendarOpen(false)
                                        }}
                                        weekStartsOn={1}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Time</Label>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder={availableSlots.length > 0 ? "Select time" : "No slots"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSlots.length > 0 ? (
                                        availableSlots.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No slots available
                                        </div>
                                    )}
                                    {/* Include current time if it's not in availableSlots (to avoid hidden value) */}
                                    {selectedTime && !availableSlots.includes(selectedTime) && (
                                        <SelectItem key={selectedTime} value={selectedTime}>
                                            {selectedTime} (Current)
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                </div>

                <DialogFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between">

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the appointment.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
