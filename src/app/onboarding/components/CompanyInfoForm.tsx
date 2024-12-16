'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CompanyInfoFormProps {
  updateFormData: (step: string, data: any) => void
  initialData: { companyName: string }
}

export default function CompanyInfoForm({
  updateFormData,
  initialData
}: CompanyInfoFormProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName)

  useEffect(() => {
    setCompanyName(initialData.companyName)
  }, [initialData])

  const handleInputChange = (value: string) => {
    setCompanyName(value)
    updateFormData('companyInfo', { companyName: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => handleInputChange(e.target.value)}
          required
        />
      </div>
    </div>
  )
}
