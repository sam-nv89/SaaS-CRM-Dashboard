import { login } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function LoginPage(props: {
    searchParams: Promise<{ message?: string; type?: string }>
}) {
    const searchParams = await props.searchParams
    const isSuccess = searchParams?.type === 'success'

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg border-border/50">
                <CardHeader className="space-y-1 flex flex-col items-center text-center pt-8">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>Sign in or create an account</CardDescription>
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
                                autoComplete="email"
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                autoComplete="current-password"
                                className="bg-background"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 bg-muted/20 pt-6 pb-8 border-t">
                        <Button formAction={login} className="w-full shadow-sm hover:shadow-md transition-all">
                            Sign In
                        </Button>

                        <p className="text-sm text-muted-foreground text-center">
                            Don&apos;t have an account?{' '}
                            <a href="/signup" className="text-primary hover:underline">
                                Create account
                            </a>
                        </p>

                        {searchParams?.message && (
                            <div className={`flex items-center gap-2 text-sm mt-2 p-3 rounded-md w-full border ${isSuccess
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                                }`}>
                                {isSuccess ? (
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                )}
                                <span>{searchParams.message}</span>
                            </div>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
