import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { startOfWeek, addDays, format, parse, addMinutes } from 'date-fns'

export async function GET() {
    try {
        // 1. Get reference data
        const { data: services, error: servicesError } = await supabase.from('services').select('*')
        const { data: clients, error: clientsError } = await supabase.from('clients').select('*')

        if (servicesError) throw servicesError
        if (clientsError) throw clientsError

        // Masters hardcoded list
        const masterList = [
            { master_name: 'Sarah Johnson', master_color: '#F472B6' },
            { master_name: 'Michael Chen', master_color: '#60A5FA' },
            { master_name: 'Emily Davis', master_color: '#34D399' },
            { master_name: 'James Wilson', master_color: '#FBBF24' }
        ]

        if (!services || !clients || services.length === 0 || clients.length === 0) {
            return NextResponse.json({ error: 'No services or clients found. Create them first.' }, { status: 400 })
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
            const master = masterList[Math.floor(Math.random() * masterList.length)]

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

            // Fix status: use 'canceled' (single l) matching typings. 
            // If DB accepts 'no_show', we can try it, but let's stick to known types first to fix the error.
            // Actually, let's try to map 'no-show' to 'canceled' for now to be safe, 
            // OR rely on the fact that if it fails, we will now see the error message.
            // I will use 'canceled' strictly for now.
            const statusRandom = Math.random()
            let status = 'confirmed'
            if (statusRandom > 0.9) status = 'canceled'
            else if (statusRandom > 0.8) status = 'pending'

            newAppointments.push({
                client_id: client.id,
                service_id: service.id,
                master_name: master.master_name,
                master_color: master.master_color,
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
            // Return full error object
            return NextResponse.json({ error: error.message || JSON.stringify(error), details: error }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: newAppointments.length, message: "Added 50 test appointments" })
    } catch (error: any) {
        console.error("Seed error:", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
