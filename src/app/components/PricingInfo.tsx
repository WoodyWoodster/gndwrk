'use client'

import { Check, X } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
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

export default function PricingInfo() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <CardTitle className="text-lg">
                                {plan.name}
                            </CardTitle>
                            <CardDescription>
                                ${plan.price}/month
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <h4 className="font-semibold mb-2">Features:</h4>
                            <ul className="space-y-1">
                                {plan.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center"
                                    >
                                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            {plan.missingFeatures.length > 0 && (
                                <>
                                    <h4 className="font-semibold mt-4 mb-2">
                                        Not included:
                                    </h4>
                                    <ul className="space-y-1">
                                        {plan.missingFeatures.map(
                                            (feature, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-center text-muted-foreground"
                                                >
                                                    <X className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
