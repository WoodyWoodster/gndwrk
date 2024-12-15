import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart2, Users, Layers, Zap } from 'lucide-react'
import PricingInfo from './components/PricingInfo'

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-background border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-primary">
                        Gndwrk
                    </Link>
                    <nav>
                        <ul className="flex space-x-4">
                            <li>
                                <Link
                                    href="#features"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#pricing"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </nav>
                    <div className="hidden sm:block">
                        <Button asChild>
                            <Link href="/onboarding">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                <section className="bg-background py-20">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Streamline Your Business with Gndwrk
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Empower your organization with our comprehensive
                            Enterprise Resource Planning solution. Boost
                            efficiency, reduce costs, and make data-driven
                            decisions.
                        </p>
                        <Button size="lg" asChild>
                            <Link href="/onboarding">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </section>

                <section id="features" className="py-20 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            Key Features
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: BarChart2,
                                    title: 'Advanced Analytics',
                                    description:
                                        'Gain insights with powerful reporting tools'
                                },
                                {
                                    icon: Users,
                                    title: 'Human Resources',
                                    description:
                                        'Streamline HR processes and employee management'
                                },
                                {
                                    icon: Layers,
                                    title: 'Inventory Management',
                                    description:
                                        'Optimize stock levels and supply chain'
                                },
                                {
                                    icon: Zap,
                                    title: 'Automation',
                                    description:
                                        'Automate repetitive tasks and workflows'
                                }
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-background p-6 rounded-lg shadow-md"
                                >
                                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="py-20 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            Pricing
                        </h2>
                        <PricingInfo />
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-6">
                            Ready to Transform Your Business?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join companies that trust Gndwrk to
                            drive their business forward.
                        </p>
                        <Button size="lg" asChild>
                            <Link href="/onboarding">
                                Get Started Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="bg-muted py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Integrations
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        FAQ
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Careers
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Partners
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        News
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Resources</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Community
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Support
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Cookie Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        Security
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-muted-foreground/20 text-center text-muted-foreground">
                        <p>&copy; 2024 Gndwrk. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
