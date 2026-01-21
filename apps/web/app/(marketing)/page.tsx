import Link from "next/link";
import {
  LogoMark,
  BucketIcon,
  TrustScoreIcon,
  CoachIcon,
  ChoreIcon,
  LoanIcon,
  CardIcon,
  CheckIcon,
  StarIcon,
} from "@/components/icons";
import {
  SignUpIllustration,
  AddKidsIllustration,
  ConfigureIllustration,
  GrowthIllustration,
} from "@/components/icons/illustrations";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-elevation-2">
            <LogoMark size={28} />
          </div>
          <span className="text-xl font-bold text-gray-900">Gndwrk</span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-gray-600 hover:text-gray-900">
            Features
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
            How It Works
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-gray-600 hover:text-gray-900"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
          Teach Your Kids{" "}
          <span className="text-primary">Real Financial Skills</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
          The family banking app that builds financial habits from age 6 to 18,
          then transitions to adult banking with earned advantages.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary-600"
          >
            Start Free Trial
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 hover:border-gray-400"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything Your Family Needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            A complete financial education platform disguised as a banking app.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:shadow-elevation-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-bucket-spend-100 to-bucket-invest-100">
                <BucketIcon size={28} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                4-Bucket System
              </h3>
              <p className="mt-2 text-gray-600">
                Spend, Save, Give, Invest. Kids learn to allocate money wisely
                across four purpose-driven accounts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:shadow-elevation-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-100 to-accent-100">
                <TrustScoreIcon size={28} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Trust Score
              </h3>
              <p className="mt-2 text-gray-600">
                Kids build a financial reputation through responsible behavior.
                At 18, it converts to real banking benefits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:shadow-elevation-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100">
                <CoachIcon size={28} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                AI Money Coach
              </h3>
              <p className="mt-2 text-gray-600">
                A friendly AI assistant that answers questions, provides
                guidance, and teaches financial concepts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:shadow-elevation-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-bucket-spend-100 to-accent-100">
                <ChoreIcon size={28} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Chore Marketplace
              </h3>
              <p className="mt-2 text-gray-600">
                Parents create paid chores, kids claim and complete them. Real
                work, real rewards.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:shadow-elevation-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-bucket-save-100">
                <LoanIcon size={28} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Kid Loans
              </h3>
              <p className="mt-2 text-gray-600">
                Safe, educational loans from parents to kids. Learn about
                interest, repayment, and responsibility.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:shadow-elevation-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100">
                <CardIcon size={28} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Real Debit Cards
              </h3>
              <p className="mt-2 text-gray-600">
                Kids get their own cards with parent-controlled spending limits
                and real-time notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Get your family started in just a few simple steps.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="group relative flex flex-col items-center">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-elevation-2">
                  1
                </span>
              </div>
              <div className="w-full rounded-2xl bg-white p-6 pt-8 shadow-elevation-2 transition-all group-hover:shadow-elevation-3">
                <div className="flex justify-center">
                  <SignUpIllustration size={100} />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                  Parent Signs Up
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Create your family account in minutes. Link your bank for easy
                  transfers.
                </p>
              </div>
              {/* Connector (hidden on mobile) */}
              <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:block">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none" aria-hidden="true">
                  <path d="M0 8h28" stroke="#D8DDE2" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M24 4l6 4-6 4" stroke="#D8DDE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative flex flex-col items-center">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-elevation-2">
                  2
                </span>
              </div>
              <div className="w-full rounded-2xl bg-white p-6 pt-8 shadow-elevation-2 transition-all group-hover:shadow-elevation-3">
                <div className="flex justify-center">
                  <AddKidsIllustration size={100} />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                  Add Your Kids
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Create profiles for each child with age-appropriate settings
                  and permissions.
                </p>
              </div>
              {/* Connector */}
              <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:block">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none" aria-hidden="true">
                  <path d="M0 8h28" stroke="#D8DDE2" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M24 4l6 4-6 4" stroke="#D8DDE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative flex flex-col items-center">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-elevation-2">
                  3
                </span>
              </div>
              <div className="w-full rounded-2xl bg-white p-6 pt-8 shadow-elevation-2 transition-all group-hover:shadow-elevation-3">
                <div className="flex justify-center">
                  <ConfigureIllustration size={100} />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                  Fund & Configure
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Set up allowances, bucket splits, and order optional debit
                  cards.
                </p>
              </div>
              {/* Connector */}
              <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:block">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none" aria-hidden="true">
                  <path d="M0 8h28" stroke="#D8DDE2" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M24 4l6 4-6 4" stroke="#D8DDE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group relative flex flex-col items-center">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white shadow-elevation-2">
                  4
                </span>
              </div>
              <div className="w-full rounded-2xl bg-white p-6 pt-8 shadow-elevation-2 transition-all group-hover:shadow-elevation-3">
                <div className="flex justify-center">
                  <GrowthIllustration size={100} />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                  Watch Them Grow
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Track progress as they build their Trust Score and learn
                  money skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Simple Family Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Choose the plan that fits your family. No hidden fees.
          </p>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
            {/* Starter Plan */}
            <div className="flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-8 md:order-1">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Get started with the basics
                </p>
              </div>

              <ul className="mt-8 flex-1 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">1 child account</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">2 buckets (Spend & Save)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">1 debit card ($5 shipping)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Basic chore tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Basic Trust Score</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Parent dashboard</span>
                </li>
              </ul>

              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg border-2 border-gray-300 py-3 text-center font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                Get Started Free
              </Link>
            </div>

            {/* Family Plan - Recommended */}
            <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-white p-8 shadow-elevation-3 md:order-2">
              {/* Recommended badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                  <StarIcon size={14} className="text-accent" />
                  Recommended
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Family</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">$7.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Everything for growing families
                </p>
              </div>

              <ul className="mt-8 flex-1 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">
                    <strong>Up to 5</strong> kids
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">
                    All <strong>4 buckets</strong> (Spend, Save, Give, Invest)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Debit cards included, free shipping</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">AI Money Coach</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Full Trust Score system</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Kid loans with interest lessons</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Advanced chore marketplace</span>
                </li>
              </ul>

              <Link
                href="/sign-up?plan=family"
                className="mt-8 block w-full rounded-lg bg-primary py-3 text-center font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Family+ Plan */}
            <div className="relative flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-8 md:order-3">
              {/* Best Value badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-4 py-1 text-sm font-semibold text-white">
                  Best Value
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Family+</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">$12.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Premium features for large families
                </p>
              </div>

              <ul className="mt-8 flex-1 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">
                    <strong>Unlimited</strong> kids
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Everything in Family</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Investment simulation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Premium card designs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon size={20} className="mt-0.5 shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>

              <Link
                href="/sign-up?plan=familyplus"
                className="mt-8 block w-full rounded-lg border-2 border-secondary bg-secondary py-3 text-center font-semibold text-white transition-colors hover:bg-secondary-600"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-gray-500">
              14-day free trial on paid plans. Cancel anytime.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                FDIC insured through partner bank
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Bank-level encryption
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No hidden fees
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to Build Your Family's Financial Future?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-100">
            Join thousands of families teaching real financial skills. Start
            your free trial today.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-primary hover:bg-gray-100"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-elevation-1">
                <LogoMark size={22} />
              </div>
              <span className="font-bold text-gray-900">Gndwrk</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Gndwrk. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
