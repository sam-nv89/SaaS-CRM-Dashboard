import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { startOfWeek, addDays, format, parse, addMinutes } from 'date-fns'

export async function GET() {
    try {
        // 1. Get reference data
        const { data: services } = await supabase.from('services').select('*')
        const { data: clients } = await supabase.from('clients').select('*')

        // Masters hardcoded list (since we don't have a masters table yet)
        const masterList = [
            { master_name: 'Sarah Johnson', master_color: '#F472B6' },
            { master_name: 'Michael Chen', master_color: '#60A5FA' },
            { master_name: 'Emily Davis', master_color: '#34D399' },
            { master_name: 'James Wilson', master_color: '#FBBF24' }
        ]

        if (!services || !clients || services.length === 0 || clients.length === 0) {
            // Create dummy if needed? No, let's report error
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
            // Parse duration: "45 min", "1h", "1.5h"
            let durationMin = 60
            const dur = service.duration.toLowerCase()
            if (dur.includes('min') && !dur.includes('h')) {
                const matches = dur.match(/(\d+)/)
                if (matches) durationMin = parseInt(matches[0])
            } else if (dur.includes('h')) {
                if (dur.includes('.')) durationMin = parseFloat(dur) * 60
                else durationMin = parseInt(dur) * 60
                if (dur.includes('min')) {
                    // complex case like "1h 30min", assume simplified for seed
                    // Or re-use calculateEndTime logic but I don't import component functions here.
                }
            }

            // Simple end time calc
            const startTime = parse(timeStr, 'HH:mm', new Date())
            const endTimeDate = addMinutes(startTime, durationMin)
            const endTimeStr = format(endTimeDate, 'HH:mm')

            newAppointments.push({
                client_id: client.id,
                service_id: service.id,
                master_name: master.master_name,
                master_color: master.master_color,
                date: dateStr,
                time: timeStr,
                end_time: endTimeStr,
                duration: service.duration,
                status: Math.random() > 0.85 ? (Math.random() > 0.5 ? 'cancelled' : 'no_show') : 'confirmed',
                notes: 'Seeded test data'
            })
        }

        const { error } = await supabase.from('appointments').insert(newAppointments)

        if (error) throw error

        return NextResponse.json({ success: true, count: newAppointments.length, message: "Added 50 test appointments" })
    } catch (error) {
        console.error("Seed error:", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
