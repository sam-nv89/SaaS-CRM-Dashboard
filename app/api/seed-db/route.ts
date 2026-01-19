import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { startOfWeek, addDays, format, parse, addMinutes } from 'date-fns'

export async function GET() {
    try {
        const supabase = await createClient()

        // 0. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Get reference data
        const { data: services, error: servicesError } = await supabase.from('services').select('*')
        const { data: clients, error: clientsError } = await supabase.from('clients').select('*')
        const { data: stylists, error: stylistsError } = await supabase.from('stylists').select('*').eq('active', true)

        if (servicesError) throw servicesError
        if (clientsError) throw clientsError
        if (stylistsError) throw stylistsError

        if (!services?.length || !clients?.length || !stylists?.length) {
            return NextResponse.json({
                error: 'Missing reference data. Ensure you have Services, Clients, and Stylists in the database.'
            }, { status: 400 })
        }

        // 2. Generate 50 appointments
        const newAppointments = []
        const now = new Date()
        const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday start

        for (let i = 0; i < 50; i++) {
            // Random day in current week (Mon-Sun)
            const dayOffset = Math.floor(Math.random() * 7)
            const dateDate = addDays(start, dayOffset)
            const dateStr = format(dateDate, 'yyyy-MM-dd')

            // Random time (9:00 - 18:00)
            const hour = 9 + Math.floor(Math.random() * 9)
            const minute = Math.random() > 0.5 ? 0 : 30
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

            const service = services[Math.floor(Math.random() * services.length)]
            const client = clients[Math.floor(Math.random() * clients.length)]
            const stylist = stylists[Math.floor(Math.random() * stylists.length)]

            // Calculate end time
            let durationMin = 60
            const dur = service.duration.toLowerCase()
            if (dur.includes('min') && !dur.includes('h')) {
                const matches = dur.match(/(\d+)/)
                if (matches) durationMin = parseInt(matches[0])
            } else if (dur.includes('h')) {
                if (dur.includes('.')) durationMin = parseFloat(dur) * 60
                else durationMin = parseInt(dur) * 60
            }

            const startTime = parse(timeStr, 'HH:mm', new Date())
            const endTimeDate = addMinutes(startTime, durationMin)
            const endTimeStr = format(endTimeDate, 'HH:mm')

            const statusRandom = Math.random()
            let status = 'confirmed'
            if (statusRandom > 0.9) status = 'canceled'
            else if (statusRandom > 0.8) status = 'pending'

            newAppointments.push({
                user_id: user.id, // Explicitly set user_id
                client_id: client.id,
                service_id: service.id,
                stylist_id: stylist.id,
                master_name: stylist.name,
                master_color: stylist.color,
                date: dateStr,
                time: timeStr,
                end_time: endTimeStr,
                duration: service.duration,
                status: status,
                notes: 'Seeded test data'
            })
        }

        const { error } = await supabase.from('appointments').insert(newAppointments)

        if (error) {
            console.error("Supabase Insert Error:", error)
            return NextResponse.json({ error: error.message || JSON.stringify(error), details: error }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: newAppointments.length, message: "Added 50 test appointments" })
    } catch (error: any) {
        console.error("Seed error:", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
