'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UserInfoFormProps {
    updateFormData: (step: string, data: any) => void
    initialData: {
        name: string
        email: string
        password: string
    }
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
    updateFormData,
    initialData
}) => {
    const [name, setName] = useState(initialData.name)
    const [email, setEmail] = useState(initialData.email)
    const [password, setPassword] = useState(initialData.password)

    const handleInputChange = (field: string, value: string) => {
        if (field === 'name') setName(value)
        if (field === 'email') setEmail(value)
        if (field === 'password') setPassword(value)
        updateFormData('userInfo', { [field]: value })
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                        handleInputChange('password', e.target.value)
                    }
                    required
                />
            </div>
        </div>
    )
}

export default UserInfoForm
