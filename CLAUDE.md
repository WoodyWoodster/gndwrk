# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start all services (recommended for full development)
make dev              # Starts Convex + ngrok + Stripe webhooks + apps

# Start specific services
pnpm dev              # All apps via Turbo (no tunnels)
pnpm dev:web          # Next.js web app only
pnpm dev:mobile       # Expo mobile app only
pnpm dev:convex       # Convex backend only

# Build, lint, typecheck
pnpm build
pnpm lint
pnpm typecheck

# Service management
make stop             # Stop background services (ngrok, stripe, convex)
make status           # Check service status
make clean            # Clean all build artifacts and node_modules
```

## Project Structure

Turborepo monorepo with pnpm workspaces:

- `apps/mobile` - Expo 52+ React Native app with expo-router (kid-facing)
- `apps/web` - Next.js 15+ with App Router (parent dashboard)
- `packages/ui` - Cross-platform UI components (NativeWind/Tailwind)
- `packages/convex` - Convex backend (schema, queries, mutations, actions)
- `packages/types` - Shared TypeScript type definitions

## Architecture

### Routing Patterns
Both apps use route groups for organization:
- `(auth)` - Sign in/up flows with Clerk
- `(kid)` - Kid user routes (mobile)
- `(parent)` - Parent user routes (mobile)
- `(onboarding)` - Setup wizard
- `(dashboard)` - Parent dashboard (web)
- `(marketing)` - Landing pages (web)

### Data Model (Convex)
Core tables: `users`, `families`, `accounts`, `transactions`, `chores`, `loans`, `loanPayments`, `trustScoreEvents`, `trustScores`, `aiConversations`, `savingsGoals`

**4-Bucket System**: Each user has 4 accounts (spend, save, give, invest) with Stripe Treasury backing.

**Trust Score** (300-850): Event-sourced from `trustScoreEvents`, calculated into `trustScores` snapshots. Factors: loan repayment (25%), savings (20%), chores (15%), budget (15%), giving (10%), age (10%), endorsements (5%).

### External Services
- **Clerk** - Authentication with webhook sync to Convex users
- **Stripe Treasury/Connect/Issuing** - Banking operations, debit cards
- **Anthropic Claude** - AI money coach with age-appropriate responses

### Styling
NativeWind v4 for mobile, Tailwind CSS for web. Shared design tokens in `packages/ui`.

## Key Files

- `packages/convex/convex/schema.ts` - Database schema definition
- `apps/web/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- `packages/convex/convex/trustScore.ts` - Trust score calculation logic
- `packages/convex/convex/ai.ts` - Claude AI integration
