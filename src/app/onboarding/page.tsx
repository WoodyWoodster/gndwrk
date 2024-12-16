'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import CompanyInfoForm from './components/CompanyInfoForm'
import UserInfoForm from './components/UserInfoForm'
import { Progress } from '@/components/ui/progress'
import BulkUpload from './components/BulkUpload'
import SubscriptionSelection from './components/SubscriptionSelection'
import Checkout from './components/Checkout'

const steps = [
  'Company Info',
  'User Info',
  'Bulk Upload (Optional)',
  'Subscription',
  'Checkout'
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [formData, setFormData] = useState({
    companyInfo: { companyName: '' },
    userInfo: { name: '', email: '', password: '' },
    bulkUpload: null,
    subscription: null
  })

  const handleNext = () => {
    setCompletedSteps((prev) => {
      const newCompleted = [...prev]
      if (!newCompleted.includes(currentStep)) {
        newCompleted.push(currentStep)
      }
      return newCompleted
    })
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const updateFormData = (step: string, data: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [step]: { ...prev[step], ...data } }
      return JSON.stringify(newData) !== JSON.stringify(prev) ? newData : prev
    })
  }

  const isStepComplete = (step: number) => {
    switch (step) {
    case 0:
      return !!formData.companyInfo.companyName
    case 1:
      return (
        !!formData.userInfo.name &&
          !!formData.userInfo.email &&
          !!formData.userInfo.password
      )
    case 2:
      return true // Bulk Upload is always considered complete as it's optional
    case 3:
      return !!formData.subscription
    default:
      return false
    }
  }

  const isNextDisabled = () => {
    return !isStepComplete(currentStep)
  }

  const renderStep = () => {
    switch (currentStep) {
    case 0:
      return (
        <CompanyInfoForm
          updateFormData={updateFormData}
          initialData={formData.companyInfo}
        />
      )
    case 1:
      return (
        <UserInfoForm
          updateFormData={updateFormData}
          initialData={formData.userInfo}
        />
      )
    case 2:
      return (
        <BulkUpload
          updateFormData={updateFormData}
          initialData={formData.bulkUpload}
        />
      )
    case 3:
      return (
        <SubscriptionSelection
          updateFormData={updateFormData}
          initialData={formData.subscription}
        />
      )
    case 4:
      return <Checkout formData={formData} />
    default:
      return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Progress
        value={(currentStep / (steps.length - 1)) * 100}
        className="mb-6"
      />
      <nav className="mb-8">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, index) => (
            <li
              key={step}
              className={`text-sm flex flex-col items-center ${
                index === currentStep ? 'font-bold' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 mb-2 rounded-full border-2 border-primary">
                {completedSteps.includes(index) ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-center">{step}</span>
            </li>
          ))}
        </ol>
      </nav>
      {renderStep()}
      <div className="mt-6 flex justify-between">
        {currentStep > 0 && (
          <Button onClick={handleBack} variant="outline">
            Back
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button
            onClick={handleNext}
            className="ml-auto"
            disabled={isNextDisabled()}
          >
            {currentStep === 2 ? 'Skip' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}
