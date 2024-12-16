'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreditCard, ShoppingCartIcon as Paypal, Building } from 'lucide-react'

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'paypal', name: 'PayPal', icon: Paypal },
  { id: 'bank', name: 'Bank Transfer', icon: Building }
]

interface CheckoutProps {
  formData: {
    companyInfo: { companyName: string }
    userInfo: { name: string; email: string; password: string }
    bulkUpload: File | null
    subscription: string | null
  }
}

export default function Checkout({ formData }: CheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Here you would typically send the formData to your server
    // and initiate the checkout process based on the selected payment method
    console.log('Submitting form data:', { ...formData, paymentMethod })

    // Simulating an API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    alert('Checkout complete! (This is a simulation)')
  }

  const renderPaymentFields = () => {
    switch (paymentMethod) {
    case 'card':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName" className="text-sm font-medium">
                Name on Card
            </Label>
            <Input
              id="cardName"
              placeholder="John Doe"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-sm font-medium">
                Card Number
            </Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              required
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry" className="text-sm font-medium">
                  Expiry Date
              </Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc" className="text-sm font-medium">
                  CVC
              </Label>
              <Input id="cvc" placeholder="123" required className="w-full" />
            </div>
          </div>
        </div>
      )
    case 'paypal':
      return (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
              You will be redirected to PayPal to complete your payment.
          </p>
        </div>
      )
    case 'bank':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-sm font-medium">
                Account Name
            </Label>
            <Input
              id="accountName"
              placeholder="John Doe"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="text-sm font-medium">
                Account Number
            </Label>
            <Input
              id="accountNumber"
              placeholder="123456789"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="routingNumber" className="text-sm font-medium">
                Routing Number
            </Label>
            <Input
              id="routingNumber"
              placeholder="987654321"
              required
              className="w-full"
            />
          </div>
        </div>
      )
    default:
      return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Payment Method</CardTitle>
          <CardDescription>
            Choose your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id}>
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={method.id}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <method.icon className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">{method.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
          <CardDescription>
            Enter your payment information below
          </CardDescription>
        </CardHeader>
        <CardContent>{renderPaymentFields()}</CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? 'Processing...'
              : `Pay with ${
                paymentMethod === 'card'
                  ? 'Card'
                  : paymentMethod === 'paypal'
                    ? 'PayPal'
                    : 'Bank Transfer'
              }`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
