
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export default async function LoginPage(props: {
    searchParams: Promise<{ message?: string }>
}) {
    const searchParams = await props.searchParams

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg border-border/50">
                <CardHeader className="space-y-1 flex flex-col items-center text-center pt-8">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <form>
                    <CardContent className="space-y-5 pb-8">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <span className="text-xs text-muted-foreground cursor-pointer hover:underline">Forgot password?</span>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-background"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 bg-muted/20 pt-6 pb-8 border-t">
                        <Button formAction={login} className="w-full shadow-sm hover:shadow-md transition-all">Sign In</Button>
                        <Button formAction={signup} variant="outline" className="w-full bg-background">Create an account</Button>
                        {searchParams?.message && (
                            <p className="text-destructive text-center text-sm mt-2 bg-destructive/10 p-2 rounded-md w-full border border-destructive/20">
                                {searchParams.message}
                            </p>
                        )}
                    </CardFooter>
                </form>
                <div className="pb-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">Ver: 1.2 (Debug)</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                        URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 12)}...` : 'MISSING'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                        Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'MISSING'}
                    </p>
                </div>
            </Card>
        </div>
    )
}
