'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const company = formData.get('company') as string || ''
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Sign up with user metadata
    const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                company: company,
                full_name: `${firstName} ${lastName}`,
            }
        }
    })

    if (error) {
        return redirect(`/signup?message=${encodeURIComponent(error.message)}&type=error`)
    }

    // Check if user already exists
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        return redirect('/signup?message=User already exists&type=error')
    }

    // If email confirmation is required
    if (signUpData.user && !signUpData.session) {
        return redirect('/login?message=Check your email to confirm your account&type=success')
    }

    // If auto-confirmed, also save to profiles table
    if (signUpData.user && signUpData.session) {
        await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            first_name: firstName,
            last_name: lastName,
            company: company,
            email: email,
        })
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
