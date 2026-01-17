// Database types for Supabase tables

export interface Client {
    id: string
    name: string
    phone: string
    email: string
    notes?: string
    status: 'new' | 'regular' | 'vip'
    total_visits: number
    last_visit?: string
    created_at: string
}

export interface Service {
    id: string
    name: string
    duration: string
    price: number
    category: string
    active: boolean
    created_at: string
}

export interface Category {
    id: string
    name: string
    created_at: string
}

export interface Appointment {
    id: string
    client_id: string
    service_id: string
    master_name: string
    master_color: string
    date: string
    time: string
    end_time: string
    duration: string
    status: 'confirmed' | 'pending' | 'canceled'
    notes?: string
    created_at: string
}

/**
 * Appointment с данными связанных таблиц (client, service).
 * Используется для отображения в UI с реальными именами.
 */
export interface AppointmentWithDetails extends Appointment {
    client: { name: string } | null
    service: { name: string } | null
}

export interface BusinessSettings {
    id: string
    salon_name: string
    address: string
    phone: string
    logo_url?: string
    business_hours: BusinessHour[]
    notifications: NotificationSettings
    updated_at: string
}

export interface BusinessHour {
    day: string
    open: string
    close: string
    is_open: boolean
}

export interface NotificationSettings {
    booking_confirmation: boolean
    reminder_before: boolean
    cancel_notification: boolean
    marketing_emails: boolean
}

// Insert types (without id and created_at)
export type ClientInsert = Omit<Client, 'id' | 'created_at'>
export type ServiceInsert = Omit<Service, 'id' | 'created_at'>
export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at'>

// Update types (all fields optional except id)
export type ClientUpdate = Partial<ClientInsert> & { id: string }
export type ServiceUpdate = Partial<ServiceInsert> & { id: string }
export type AppointmentUpdate = Partial<AppointmentInsert> & { id: string }
