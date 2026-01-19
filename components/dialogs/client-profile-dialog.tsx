"use client"

import { useState, useEffect } from "react"
import { User, Phone, Mail, Calendar, Clock, FileText, Star, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import type { Client } from "@/types/database"

interface ClientProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client: Client | null
}

interface AppointmentHistory {
    id: string
    date: string
    time: string
    status: string
    service: { name: string } | null
    master_name: string
}

type ClientStatus = "new" | "regular" | "vip"

const statusStyles: Record<ClientStatus, string> = {
    new: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    regular: "bg-primary/10 text-primary border-primary/20",
    vip: "bg-chart-5/10 text-chart-5 border-chart-5/20",
}

export function ClientProfileDialog({ open, onOpenChange, client }: ClientProfileDialogProps) {
    const [appointments, setAppointments] = useState<AppointmentHistory[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && client) {
            loadAppointmentHistory()
        }
    }, [open, client])

    const loadAppointmentHistory = async () => {
        if (!client) return

        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          id,
          date,
          time,
          status,
          master_name,
          service:services(name)
        `)
                .eq('client_id', client.id)
                .order('date', { ascending: false })
                .order('time', { ascending: false })
                .limit(10)

            if (error) throw error

            // Transform data to match our interface (Supabase returns single object for 1:1 relations)
            const transformed: AppointmentHistory[] = (data || []).map((item: unknown) => {
                const apt = item as Record<string, unknown>
                return {
                    id: apt.id as string,
                    date: apt.date as string,
                    time: apt.time as string,
                    status: apt.status as string,
                    master_name: apt.master_name as string,
                    service: apt.service as { name: string } | null,
                }
            })
            setAppointments(transformed)
        } catch (error) {
            console.error('Error loading appointment history:', error)
            setAppointments([])
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    if (!client) return null

    const initials = client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md mx-4 rounded-xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-lg">Client Profile</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        View client details and appointment history.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {/* Header with Avatar */}
                    <div className="flex items-center gap-4 py-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-xs capitalize ${statusStyles[client.status]}`}>
                                    {client.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {client.total_visits} visits
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Info */}
                    <div className="py-4 space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Contact Information
                        </h4>
                        <div className="space-y-2 pl-6">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{client.phone}</span>
                            </div>
                            {client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{client.email}</span>
                                </div>
                            )}
                            {client.notes && (
                                <div className="flex items-start gap-2 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <span className="text-muted-foreground">{client.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Appointment History */}
                    <div className="py-4 space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Recent Appointments
                        </h4>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : appointments.length === 0 ? (
                            <p className="text-sm text-muted-foreground pl-6">No appointments found</p>
                        ) : (
                            <div className="space-y-2 pl-6">
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{apt.service?.name || "Unknown Service"}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{formatDate(apt.date)}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {apt.time}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs capitalize ${apt.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
                                                    apt.status === 'pending' ? 'bg-pending/10 text-pending' :
                                                        'bg-canceled/10 text-canceled'
                                                    }`}
                                            >
                                                {apt.status}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">with {apt.master_name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
