
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function LoginPage(props: {
    searchParams: Promise<{ message?: string }>
}) {
    const searchParams = await props.searchParams

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <form>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button formAction={login} className="w-full">Sign In</Button>
                        <Button formAction={signup} variant="outline" className="w-full">Sign Up</Button>
                        {searchParams?.message && (
                            <p className="text-destructive text-center text-sm">{searchParams.message}</p>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
