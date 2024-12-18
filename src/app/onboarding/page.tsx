'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationForm } from '@/components/OrganizationForm'

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateOrganization = async (orgName: string, address: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: orgName, address }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      router.push('/')
    } catch (err) {
      console.error('Error creating organization:', err)
      setError('Failed to create organization. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <OrganizationForm 
        onSubmit={handleCreateOrganization}
      />
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}

