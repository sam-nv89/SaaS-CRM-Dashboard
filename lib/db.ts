import { supabase } from './supabase'
import type {
    Client,
    ClientInsert,
    ClientUpdate,
    Service,
    ServiceInsert,
    ServiceUpdate,
    Appointment,
    AppointmentInsert,
    AppointmentUpdate,
    BusinessSettings
} from '@/types/database'

// ============ CLIENTS ============

export async function getClients(): Promise<Client[]> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

export async function getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export async function createClient(client: ClientInsert): Promise<Client> {
    const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateClient(client: ClientUpdate): Promise<Client> {
    const { id, ...updates } = client
    const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteClient(id: string): Promise<void> {
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============ SERVICES ============

export async function getServices(): Promise<Service[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })

    if (error) throw error
    return data || []
}

export async function createService(service: ServiceInsert): Promise<Service> {
    const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateService(service: ServiceUpdate): Promise<Service> {
    const { id, ...updates } = service
    const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteService(id: string): Promise<void> {
    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============ APPOINTMENTS ============

export async function getAppointments(date?: string): Promise<Appointment[]> {
    let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })

    if (date) {
        query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
}

export async function createAppointment(appointment: AppointmentInsert): Promise<Appointment> {
    const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateAppointment(appointment: AppointmentUpdate): Promise<Appointment> {
    const { id, ...updates } = appointment
    const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============ SETTINGS ============

export async function getSettings(): Promise<BusinessSettings | null> {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

export async function updateSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .single()

    if (existing) {
        const { data, error } = await supabase
            .from('settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) throw error
        return data
    } else {
        const { data, error } = await supabase
            .from('settings')
            .insert(settings)
            .select()
            .single()

        if (error) throw error
        return data
    }
}
