import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import Link from 'next/link'
import { Mountain } from 'lucide-react'

interface SignUpFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
}

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await onSubmit(email, password)
    setIsLoading(false)
  }

  return (
    <Card className="w-full sm:w-96">
      <CardHeader>
        <div className="flex flex-col items-center space-y-2 mb-4">
          <Mountain className="w-12 h-12 text-primary" />
          <CardTitle className="text-2xl font-bold">Gndwrk</CardTitle>
        </div>
        <CardDescription className="text-center">Create an account to get started</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <div id="clerk-captcha"></div>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Sign Up'
            )}
          </Button>
          <Button variant="link" asChild className="w-full">
            <Link href="/sign-in">Already have an account? Sign in</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

