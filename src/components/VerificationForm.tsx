import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

interface VerificationFormProps {
  onSubmit: (code: string) => Promise<void>
  emailAddress: string
}

export function VerificationForm({ onSubmit, emailAddress }: VerificationFormProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(code)
    } catch (error) {
      console.error('Verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full sm:w-96">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>Enter the code sent to {emailAddress}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Verify'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

