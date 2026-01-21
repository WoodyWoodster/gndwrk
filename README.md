# Gndwrk

Family banking app teaching kids (6-18) financial literacy with Trust Score system that transitions to adult banking with earned advantages.

## Tech Stack

- **Mobile**: Expo 52+ with expo-router
- **Web**: Next.js 15+ with App Router
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **Banking**: Stripe Treasury/Connect/Issuing
- **AI**: Anthropic Claude
- **Styling**: NativeWind v4 / Tailwind CSS

## Project Structure

```
gndwrk/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── web/             # Next.js web app (parent dashboard)
├── packages/
│   ├── ui/              # Shared UI components
│   ├── convex/          # Convex backend
│   └── types/           # Shared TypeScript types
└── package.json         # Turborepo monorepo
```

## Getting Started

### Prerequisites

- Node.js 22 LTS
- pnpm 9+
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   # Copy example env files
   cp apps/mobile/.env.example apps/mobile/.env
   cp apps/web/.env.example apps/web/.env
   cp packages/convex/.env.example packages/convex/.env
   ```

4. Configure your services:
   - Create a [Clerk](https://clerk.com) project
   - Create a [Convex](https://convex.dev) project
   - Set up [Stripe](https://stripe.com) Treasury/Connect/Issuing
   - Get an [Anthropic](https://anthropic.com) API key

5. Initialize Convex:
   ```bash
   cd packages/convex
   npx convex dev
   ```

### Development

Run all apps:
```bash
pnpm dev
```

Run specific app:
```bash
pnpm dev:mobile  # Expo app
pnpm dev:web     # Next.js app
pnpm dev:convex  # Convex backend
```

## Features

### For Kids (Ages 6-18)

- **4-Bucket System**: Spend, Save, Give, Invest accounts
- **Trust Score**: Build financial reputation through responsible behavior
- **Chore Marketplace**: Earn money by completing tasks
- **Kid Loans**: Learn about borrowing responsibly from parents
- **AI Money Coach**: Get personalized financial guidance

### For Parents

- **Family Dashboard**: Monitor all kids' accounts
- **Spending Controls**: Set limits and get notifications
- **Chore Management**: Create and approve chores
- **Loan Management**: Review and approve loan requests
- **Trust Score Monitoring**: Track kids' financial progress

### Trust Score System

Score range: 300-850 (mirrors FICO for familiarity)

Factors:
- Loan Repayment History (25%)
- Savings Consistency (20%)
- Chore Completion (15%)
- Budget Adherence (15%)
- Giving Behavior (10%)
- Account Age (10%)
- Parent Endorsements (5%)

## License

Private - All rights reserved
