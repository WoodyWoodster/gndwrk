import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

interface OrganizationFormProps {
  onSubmit: (orgName: string) => Promise<void>
}

export function OrganizationForm({ onSubmit }: OrganizationFormProps) {
  const [orgName, setOrgName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await onSubmit(orgName)
    } catch (err) {
      setError('Failed to create organization. Please try again.')
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full sm:w-96">
      <CardHeader>
        <CardTitle>Set up your organization</CardTitle>
        <CardDescription>Enter your organization details</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Create Organization'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

