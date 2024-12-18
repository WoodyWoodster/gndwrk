import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    const client = await clerkClient()

    console.log('Creating organization:', name)

    const organization = await client.organizations.createOrganization({
      name: name,
      createdBy: userId,
    })

    console.log('Organization created:', organization)

    return NextResponse.json({ 
      message: 'Organization created successfully', 
      organizationId: organization.id 
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}

