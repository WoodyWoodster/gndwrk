'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { OrganizationForm } from '@/components/OrganizationForm'

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useUser()

  const handleCreateOrganization = async (orgName: string) => {
    setError(null)
    try {
      const response = await fetch('/api/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: orgName }),
      })

      if (!response.ok) {
        throw new Error('Failed to create organization')
      }

      const data = await response.json()
      router.push(`/dashboard?org=${data.organizationId}`)
    } catch (err) {
      console.error('Error creating organization:', err)
      setError('Failed to create organization. Please try again.')
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <OrganizationForm onSubmit={handleCreateOrganization} />
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}

