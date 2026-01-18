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
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
    const [selectedStylistId, setSelectedStylistId] = useState<string>("")
    const [status, setStatus] = useState<string>("confirmed")
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [availableSlots, setAvailableSlots] = useState<string[]>([])

    // Load available slots
    useEffect(() => {
        const fetchSlots = async () => {
            if (date && selectedStylistId && selectedServiceIds.length > 0) {
                const { getAvailableTimeSlots } = await import("@/lib/db")
                // Calculate total duration from all selected services
                let totalDurationMin = 0
                for (const svcId of selectedServiceIds) {
                    const svc = services.find(s => s.id === svcId)
                    if (svc) {
                        const dur = svc.duration.toLowerCase()
                        if (dur.includes('min') && !dur.includes('h')) {
                            const matches = dur.match(/(\d+)/)
                            if (matches) totalDurationMin += parseInt(matches[0])
                        } else if (dur.includes('h')) {
                            if (dur.includes('.')) totalDurationMin += parseFloat(dur) * 60
                            else totalDurationMin += parseInt(dur) * 60
                        } else {
                            totalDurationMin += 60
                        }
                    }
                }

                const slots = await getAvailableTimeSlots(selectedStylistId, date, totalDurationMin, appointment?.id)
                setAvailableSlots(slots)
            }
        }
        fetchSlots()
    }, [date, selectedStylistId, selectedServiceIds, services, appointment])

    useEffect(() => {
        if (open) {
            loadData()
            if (appointment) {
                // Initialize form with appointment data
                setDate(parseISO(appointment.date))
                setSelectedTime(appointment.time)
                setStatus(appointment.status)

                // Parse service IDs from notes JSON prefix if exists
                const notes = (appointment as any).notes || ''
                const serviceIdsMatch = notes.match(/__SERVICE_IDS__:([\[\]"\w,-]+)/)
                if (serviceIdsMatch) {
                    try {
                        const ids = JSON.parse(serviceIdsMatch[1])
                        setSelectedServiceIds(ids)
                    } catch {
                        // Fallback to single service
                        if ((appointment as any).serviceId) setSelectedServiceIds([(appointment as any).serviceId])
                        else if ((appointment as any).service_id) setSelectedServiceIds([(appointment as any).service_id])
                    }
                } else {
                    // Legacy: single service
                    if ((appointment as any).serviceId) setSelectedServiceIds([(appointment as any).serviceId])
                    else if ((appointment as any).service_id) setSelectedServiceIds([(appointment as any).service_id])
                }

                if ((appointment as any).stylistId) setSelectedStylistId((appointment as any).stylistId)
                else if ((appointment as any).stylist_id) setSelectedStylistId((appointment as any).stylist_id)
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
        if (!appointment || !date || !selectedTime || selectedServiceIds.length === 0 || !selectedStylistId) return

        setIsLoading(true)
        try {
            const primaryService = services.find(s => s.id === selectedServiceIds[0])
            const selectedStylist = stylists.find(s => s.id === selectedStylistId)

            if (!primaryService) throw new Error("Service not found")

            // Calculate total duration from all selected services
            let totalDurationMin = 0
            for (const svcId of selectedServiceIds) {
                const svc = services.find(s => s.id === svcId)
                if (svc) {
                    const dur = svc.duration.toLowerCase()
                    const hourMatch = dur.match(/(\d+(?:\.\d+)?)\s*h/)
                    const minMatch = dur.match(/(\d+)\s*min/)
                    if (hourMatch) totalDurationMin += parseFloat(hourMatch[1]) * 60
                    if (minMatch) totalDurationMin += parseInt(minMatch[1], 10)
                    if (!hourMatch && !minMatch) totalDurationMin += parseInt(dur, 10) || 60
                }
            }

            // Calculate new end time
            const calculateEndTime = (startTime: string, durationMins: number) => {
                const [hours, minutes] = startTime.split(':').map(Number)
                const totalMinutes = hours * 60 + minutes + durationMins
                const endHours = Math.floor(totalMinutes / 60) % 24
                const endMinutes = totalMinutes % 60
                return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
            }
            const endTime = calculateEndTime(selectedTime, totalDurationMin)

            // Validate Availability
            if (selectedStylistId) {
                try {
                    const isAvailable = await checkAvailability(
                        selectedStylistId,
                        format(date, "yyyy-MM-dd"),
                        selectedTime,
                        endTime,
                        appointment.id
                    )

                    if (!isAvailable) {
                        toast.error("This stylist is already booked for this time.")
                        setIsLoading(false)
                        return
                    }
                } catch (error) {
                    console.error("Validation failed", error)
                }
            }

            // Store service IDs as JSON in notes
            const serviceIdsJson = JSON.stringify(selectedServiceIds)
            const notesPrefix = `__SERVICE_IDS__:${serviceIdsJson}\n`
            const allServiceNames = selectedServiceIds.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ')
            const userNotes = selectedServiceIds.length > 1 ? `Services: ${allServiceNames}` : ''

            const dbAppointment: AppointmentUpdate = {
                id: appointment.id,
                date: format(date, "yyyy-MM-dd"),
                time: selectedTime,
                end_time: endTime,
                duration: `${totalDurationMin} min`,
                status: status as any,
                service_id: selectedServiceIds[0],
                stylist_id: selectedStylistId,
                master_name: selectedStylist ? selectedStylist.name : undefined,
                master_color: selectedStylist ? selectedStylist.color : undefined,
                notes: notesPrefix + userNotes,
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

                    {/* Service Selection - Multi-select */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Services ({selectedServiceIds.length} selected)</Label>
                        <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                            {services.map(s => {
                                const isSelected = selectedServiceIds.includes(s.id)
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedServiceIds(prev => prev.filter(id => id !== s.id))
                                            } else {
                                                setSelectedServiceIds(prev => [...prev, s.id])
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-all ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-secondary/50'}`}
                                    >
                                        <span>{s.name} ({s.duration} - ${s.price})</span>
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                )
                            })}
                        </div>
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
