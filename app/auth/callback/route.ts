import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/'

    // Handle PKCE flow (code exchange)
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Handle email confirmation with token_hash (implicit flow)
    if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'email' | 'signup' | 'recovery' | 'invite',
        })

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return to login with error if something went wrong
    return NextResponse.redirect(`${origin}/login?message=Could not verify email&type=error`)
}
