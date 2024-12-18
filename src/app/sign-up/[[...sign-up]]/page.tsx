'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { SignUpForm } from '@/components/SignUpForm'
import { VerificationForm } from '@/components/VerificationForm'

export default function SignUpPage() {
  const [step, setStep] = useState<'signUp' | 'verification'>('signUp')
  const [emailAddress, setEmailAddress] = useState('')
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  if (!isLoaded) {
    return null
  }

  const handleSignUpSubmit = async (email: string, password: string) => {
    if (!signUp) return

    try {
      await signUp.create({
        emailAddress: email,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      
      setEmailAddress(email)
      setStep('verification')
    } catch (err) {
      console.error('Error during sign up:', err)
    }
  }

  const handleVerificationSubmit = async (code: string) => {
    if (!signUp) return

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2))
      }

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push('/onboarding')
      }
    } catch (err) {
      console.error('Error during verification:', err)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      
      {step === 'signUp' && <SignUpForm onSubmit={handleSignUpSubmit} />}
      {step === 'verification' && (
        <VerificationForm onSubmit={handleVerificationSubmit} emailAddress={emailAddress} />
      )}
    </div>
  )
}

