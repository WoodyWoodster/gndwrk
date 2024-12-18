'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { OrganizationForm } from '@/components/OrganizationForm'

interface OrganizationDetails {
  name: string
  website: string
  industry: string
  size: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const handleCreateOrganization = async (orgDetails: OrganizationDetails) => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgDetails),
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

  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <OrganizationForm onSubmit={handleCreateOrganization} />
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}

