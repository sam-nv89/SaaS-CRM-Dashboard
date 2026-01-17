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
    AppointmentWithDetails,
    BusinessSettings,
    Category,
    Stylist
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


// ============ CATEGORIES ============

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (error) throw error
    return data || []
}

/**
 * Create a new category
 */
export async function createCategory(name: string): Promise<Category> {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Rename a category (updates all services with that category automatically via FK cascade)
 */
export async function renameCategory(oldName: string, newName: string): Promise<void> {
    const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName)

    if (error) throw error
}

/**
 * Delete a category (moves services to 'Other')
 */
export async function deleteCategory(categoryName: string): Promise<void> {
    // 1. Move services to 'Other'
    if (categoryName !== 'Other') {
        const { error: moveError } = await supabase
            .from('services')
            .update({ category: 'Other' })
            .eq('category', categoryName)

        if (moveError) throw moveError
    }

    // 2. Delete the category
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName)

    if (error) throw error
}

// ============ STYLISTS ============

export async function getStylists(): Promise<Stylist[]> {
    const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .order('name')
    if (error) throw error
    return data || []
}

export async function createStylist(stylist: { name: string, color: string }): Promise<Stylist> {
    const { data, error } = await supabase
        .from('stylists')
        .insert(stylist)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateStylist(id: string, updates: Partial<Stylist>): Promise<Stylist> {
    const { data, error } = await supabase
        .from('stylists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteStylist(id: string): Promise<void> {
    const { error } = await supabase
        .from('stylists')
        .delete()
        .eq('id', id)
    if (error) throw error
}

// ============ APPOINTMENTS ============

/**
 * Получить записи с данными клиента и услуги (JOIN).
 * Используется для отображения в календаре.
 */
export async function getAppointmentsWithDetails(date?: string): Promise<AppointmentWithDetails[]> {
    let query = supabase
        .from('appointments')
        .select(`
            *,
            client:clients(name),
            service:services(name),
            stylist:stylists(name, color)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

    if (date) {
        query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) throw error
    return (data as AppointmentWithDetails[]) || []
}

/**
 * Получить записи без JOIN (для внутреннего использования).
 */
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

// ============ DASHBOARD ANALYTICS ============

export interface DashboardStats {
    revenue: number
    previousRevenue: number
    appointmentCount: number
    avgCheck: number
    previousAvgCheck: number
    noShowRate: number
    confirmedCount: number
    canceledCount: number
    pendingCount: number
}

export interface RevenueDataPoint {
    name: string
    revenue: number
}

export interface ServiceBreakdownItem {
    name: string
    value: number
    color: string
}

export interface PeakHourData {
    hour: string
    bookings: number
}

export interface StaffStatusItem {
    name: string
    status: 'busy' | 'free' | 'break'
    client: string | null
    service: string | null
}

/**
 * Get dashboard statistics for a given date range
 */
export async function getDashboardStats(
    startDate: string,
    endDate: string,
    masterFilter?: string[],
    serviceFilter?: string[]
): Promise<DashboardStats> {
    // Get appointments with service prices
    let query = supabase
        .from('appointments')
        .select(`
            id,
            status,
            master_name,
            service:services(price, name, category)
        `)
        .gte('date', startDate)
        .lte('date', endDate)

    if (masterFilter && masterFilter.length > 0 && !masterFilter.includes('All Masters')) {
        query = query.in('master_name', masterFilter)
    }

    const { data: appointments, error } = await query

    if (error) throw error

    // Calculate stats
    const confirmedAppointments = (appointments || []).filter((apt: { status: string }) => apt.status === 'confirmed')
    const canceledAppointments = (appointments || []).filter((apt: { status: string }) => apt.status === 'canceled')
    const pendingAppointments = (appointments || []).filter((apt: { status: string }) => apt.status === 'pending')

    // Calculate revenue from confirmed appointments
    let revenue = 0
    confirmedAppointments.forEach((apt: unknown) => {
        const appointment = apt as { service: { price: number } | { price: number }[] | null }
        const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service
        if (service?.price) {
            revenue += Number(service.price)
        }
    })

    // Calculate average check
    const avgCheck = confirmedAppointments.length > 0 ? revenue / confirmedAppointments.length : 0

    // Calculate no-show rate
    const totalAppointments = (appointments || []).length
    const noShowRate = totalAppointments > 0
        ? (canceledAppointments.length / totalAppointments) * 100
        : 0

    // Get previous period revenue for comparison (simplified)
    const previousRevenue = revenue * (0.85 + Math.random() * 0.3) // Mock for now
    const previousAvgCheck = avgCheck * (0.9 + Math.random() * 0.2)

    return {
        revenue,
        previousRevenue,
        appointmentCount: confirmedAppointments.length,
        avgCheck,
        previousAvgCheck,
        noShowRate,
        confirmedCount: confirmedAppointments.length,
        canceledCount: canceledAppointments.length,
        pendingCount: pendingAppointments.length,
    }
}

/**
 * Get revenue data for chart
 */
export async function getRevenueByPeriod(
    period: 'today' | 'week' | 'month' | 'year',
    startDate: string,
    endDate: string
): Promise<RevenueDataPoint[]> {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            date,
            time,
            status,
            service:services(price)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'confirmed')

    if (error) throw error

    // Group revenue by period
    const revenueMap = new Map<string, number>()

        ; (appointments || []).forEach((apt: unknown) => {
            const a = apt as { date: string; time: string; service: { price: number } | { price: number }[] | null }
            const service = Array.isArray(a.service) ? a.service[0] : a.service
            let key: string
            const date = new Date(a.date)

            if (period === 'today') {
                // Group by hour
                const hour = a.time.split(':')[0]
                key = `${parseInt(hour) > 12 ? parseInt(hour) - 12 : hour}${parseInt(hour) >= 12 ? 'pm' : 'am'}`
            } else if (period === 'week') {
                // Group by day name
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                key = days[date.getDay()]
            } else if (period === 'month') {
                // Group by week
                const weekNum = Math.ceil(date.getDate() / 7)
                key = `W${weekNum}`
            } else {
                // Group by month
                const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
                key = months[date.getMonth()]
            }

            const currentRevenue = revenueMap.get(key) || 0
            revenueMap.set(key, currentRevenue + (service?.price ? Number(service.price) : 0))
        })

    // Convert to array in proper order
    const labels = {
        today: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'],
        week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        month: ['W1', 'W2', 'W3', 'W4'],
        year: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    }

    return labels[period].map((name) => ({
        name,
        revenue: revenueMap.get(name) || 0,
    }))
}

/**
 * Get service breakdown by category
 */
export async function getServiceBreakdown(
    startDate: string,
    endDate: string
): Promise<ServiceBreakdownItem[]> {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            service:services(category, price)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'confirmed')

    if (error) throw error

    // Group by category
    const categoryMap = new Map<string, number>()
    let total = 0

        ; (appointments || []).forEach((apt: unknown) => {
            const a = apt as { service: { category: string; price: number } | { category: string; price: number }[] | null }
            const service = Array.isArray(a.service) ? a.service[0] : a.service
            if (service?.category) {
                const current = categoryMap.get(service.category) || 0
                const price = Number(service.price) || 0
                categoryMap.set(service.category, current + price)
                total += price
            }
        })

    const colors: Record<string, string> = {
        'Hair': '#14b8a6',
        'Nail': '#8b5cf6',
        'Skin': '#f59e0b',
        'Massage': '#ec4899',
        'Makeup': '#3b82f6',
        'Other': '#6b7280',
    }

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        color: colors[name] || colors['Other'],
    }))
}

/**
 * Get peak hours data
 */
export async function getPeakHours(date: string): Promise<PeakHourData[]> {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('time')
        .eq('date', date)
        .in('status', ['confirmed', 'pending'])

    if (error) throw error

    // Group by hour
    const hourMap = new Map<string, number>()
    const hours = ['9', '10', '11', '12', '1', '2', '3', '4', '5']
    hours.forEach(h => hourMap.set(h, 0))

        ; (appointments || []).forEach((apt: { time: string }) => {
            let hour = parseInt(apt.time.split(':')[0])
            if (hour > 12) hour -= 12
            const hourStr = hour.toString()
            if (hourMap.has(hourStr)) {
                hourMap.set(hourStr, (hourMap.get(hourStr) || 0) + 1)
            }
        })

    return hours.map(hour => ({
        hour,
        bookings: hourMap.get(hour) || 0,
    }))
}

/**
 * Get current staff status
 */
export async function getStaffStatus(): Promise<StaffStatusItem[]> {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // 1. Get all active stylists (Source of Truth)
    const activeStylists = await getStylists().then(data => data.filter(s => s.active))

    // 2. Get today's appointments for these stylists
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            stylist_id,
            master_name,
            time,
            end_time,
            status,
            client:clients(name),
            service:services(name)
        `)
        .eq('date', today)
        .eq('status', 'confirmed')

    if (error) throw error

    // 3. Map each stylist to their current status
    return activeStylists.map(stylist => {
        // Find if this stylist has an active appointment RIGHT NOW
        const currentAppointment = (appointments || []).find((apt: any) => {
            // Priority: Match by stylist_id
            if (apt.stylist_id === stylist.id) {
                return apt.time <= currentTime && apt.end_time > currentTime
            }
            // Fallback: Match by name (legacy support)
            // Only if stylist_id is null/missing in appointment
            if (!apt.stylist_id && apt.master_name === stylist.name) {
                return apt.time <= currentTime && apt.end_time > currentTime
            }
            return false
        }) as any

        if (currentAppointment) {
            return {
                name: stylist.name,
                status: 'busy' as const,
                client: currentAppointment.client?.name || null,
                service: currentAppointment.service?.name || null,
            }
        }

        return {
            name: stylist.name,
            status: 'free' as const,
            client: null,
            service: null,
        }
    })
}

/**
 * Get list of masters for filter
 */
export async function getMasters(): Promise<string[]> {
    const { data, error } = await supabase
        .from('appointments')
        .select('master_name')

    if (error) throw error

    const mastersSet = new Set<string>()
        ; (data || []).forEach((apt: { master_name: string }) => mastersSet.add(apt.master_name))

    return ['All Masters', ...Array.from(mastersSet)]
}
