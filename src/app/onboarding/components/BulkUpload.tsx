'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BulkUploadProps {
  updateFormData: (step: string, data: any) => void
  initialData: File | null
}

export default function BulkUpload({
  updateFormData,
  initialData
}: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(initialData)

  useEffect(() => {
    setFile(initialData)
  }, [initialData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    updateFormData('bulkUpload', selectedFile)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="csvUpload" className="text-sm font-medium">
          Upload CSV (Optional)
        </Label>
        <Input
          id="csvUpload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full"
        />
      </div>
      {file && (
        <div className="text-sm text-muted-foreground">
          Selected file: {file.name}
        </div>
      )}
      <div className="text-sm text-muted-foreground">
        You can skip this step if you don&apos;t want to bulk upload users now.
      </div>
    </div>
  )
}
