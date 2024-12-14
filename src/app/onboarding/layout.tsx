import { ReactNode } from 'react'

export default function OnboardingLayout({
    children
}: {
    children: ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Company Onboarding
                </h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {children}
                </div>
            </div>
        </div>
    )
}
