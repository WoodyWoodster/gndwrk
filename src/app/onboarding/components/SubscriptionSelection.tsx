'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    features: ['Up to 10 users', 'Basic reporting', 'Email support'],
    missingFeatures: [
      'Advanced analytics',
      'Priority support',
      'Custom integrations'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    features: [
      'Up to 50 users',
      'Advanced reporting',
      'Priority email support',
      'Basic integrations'
    ],
    missingFeatures: ['Custom integrations']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    features: [
      'Unlimited users',
      'Advanced analytics',
      '24/7 phone support',
      'Custom integrations'
    ],
    missingFeatures: []
  }
]

interface SubscriptionSelectionProps {
  updateFormData: (step: string, data: any) => void
  initialData: string | null
}

export default function SubscriptionSelection({
  updateFormData,
  initialData
}: SubscriptionSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialData)

  useEffect(() => {
    setSelectedPlan(initialData)
  }, [initialData])

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId)
    updateFormData('subscription', planId)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center mb-4">Choose Your Plan</h2>
      <RadioGroup
        onValueChange={handlePlanChange}
        value={selectedPlan || undefined}
      >
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.id === 'pro' ? 'border-primary shadow-md' : ''
              }`}
            >
              {plan.id === 'pro' && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold rounded-bl">
                  Recommended
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>${plan.price}/month</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <h4 className="font-semibold mb-2">Features:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.missingFeatures.length > 0 && (
                  <>
                    <h4 className="font-semibold mt-4 mb-2">Not included:</h4>
                    <ul className="space-y-1">
                      {plan.missingFeatures.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center text-muted-foreground"
                        >
                          <X className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <RadioGroupItem
                  value={plan.id}
                  id={plan.id}
                  className="sr-only"
                />
                <Label
                  htmlFor={plan.id}
                  className="flex items-center justify-center w-full py-2 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  Select {plan.name}
                </Label>
              </CardFooter>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}
