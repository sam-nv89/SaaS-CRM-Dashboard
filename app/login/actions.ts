'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: signUpData, error } = await supabase.auth.signUp(data)

    if (error) {
        return redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
    }

    // Check if email confirmation is required
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        return redirect('/login?message=User already exists&type=error')
    }

    // If user needs to confirm email
    if (signUpData.user && !signUpData.session) {
        return redirect('/login?message=Check your email to confirm your account&type=success')
    }

    // If auto-confirmed (no email confirmation required)
    revalidatePath('/', 'layout')
    redirect('/')
}
