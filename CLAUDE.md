# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically

### Testing
- `pnpm test` - Run unit tests (Jest)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:e2e` - Run Playwright end-to-end tests
- `pnpm test:e2e:ui` - Run E2E tests with UI
- `pnpm test:e2e:headed` - Run E2E tests in headed mode
- `pnpm test:e2e:debug` - Debug E2E tests

**Testing Configuration**:
- Jest tests target files in `**/__tests__/**/*.test.[jt]s?(x)` pattern
- E2E tests run against `http://localhost:3000` using service worker disabled mode
- E2E tests have 5-minute timeout and run in Chromium by default

### Service Worker Development
- `pnpm start:no-sw` - Start without service worker (useful for debugging)
- `pnpm build:no-sw` - Build without service worker
- Set `NEXT_PUBLIC_DISABLE_SERVICE_WORKER=true` to disable service worker in development

### Version Management
- `pnpm update-version` - Update app version using the custom script

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom components
- **State Management**: Redux Toolkit with persistent slices
- **Web3**: Wagmi + Reown AppKit for wallet connectivity
- **Database**: Supabase (PostgreSQL) with RLS
- **Blockchain**: Base network with custom smart contracts
- **AI**: Google Gemini for meal/screenshot analysis
- **Maps**: Google Maps for route tracking
- **Analytics**: Vercel Analytics + Sentry monitoring
- **PWA**: Full Progressive Web App with service worker

### Project Structure

#### Core Directories
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components
- `lib/` - Core utilities, hooks, and integrations
- `utils/` - Pure utility functions with comprehensive tests
- `config/` - Application configuration
- `constants/` - Application constants and test data

#### Key Architectural Patterns

**State Management (Redux)**
- Centralized store in `lib/redux/store.ts`
- Feature-based slices in `lib/redux/slices/`
- Each slice handles specific domain (activities, meals, profile, etc.)
- Persistent state for offline functionality

**Data Layer (Supabase)**
- Client creation patterns in `lib/supabase/`
- Separate browser and server clients for SSR
- RLS policies for data security
- Database functions in `lib/supabase/sql/`

**Web3 Integration**
- Smart contract interactions via `lib/hooks/useMovinEarn.ts`
- Wallet management through Reown AppKit
- Base network for low gas fees
- MVN token and staking functionality

**API Routes Structure**
- RESTful API in `app/api/`
- Authentication middleware for protected routes
- AI analysis endpoints for meal/screenshot processing
- Admin endpoints for contract interactions

**Component Architecture**
- Page components in `app/[route]/page.tsx`
- Feature components in `app/[route]/components/`
- Shared UI components in `components/ui/`
- Each component exports from `index.ts` for clean imports

### Authentication & Security
- Wallet-based authentication using Web3 signatures
- JWT tokens for API authentication
- Supabase RLS for data access control
- No traditional passwords - crypto wallet signatures only

### AI Integration
- Google Gemini 1.5 Flash for meal analysis
- Screenshot parsing for fitness app data extraction
- Ingredient analysis and nutrition scoring
- Premium feature requiring API key

### Testing Strategy
- Unit tests with Jest for utilities and functions
- E2E tests with Playwright for user flows
- Mocking patterns for external services
- Test data constants in `constants/dataTestIds.mjs`

### Performance Considerations
- Image optimization through Next.js
- Service worker for offline functionality
- Redux state persistence for quick app startup
- Proper caching headers for static assets

### Development Workflow
- Husky pre-commit hooks for code quality
- ESLint + Prettier for code formatting
- TypeScript strict mode for type safety
- Sentry for error monitoring and performance tracking

## Environment Variables Required

```bash
# Core Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key

# Web3 & Blockchain
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_INFURA_ID=your_infura_id
NEXT_PUBLIC_MOVIN_EARN_CONTRACT_ADDRESS=contract_address

# AI & Maps
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional - AdSense (for free tier)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_ID=xxxxxxxxxx

# Development
NEXT_PUBLIC_DISABLE_SERVICE_WORKER=true # for debugging
```

## Key Files to Understand

### Core Hooks
- `lib/hooks/useMovinEarn.ts` - Main smart contract interaction hook
- `lib/hooks/useMovinToken.ts` - Token balance and operations
- `app/contexts/` - React contexts for global state

### Data Models
- `lib/supabase/` - Database interaction patterns
- `lib/redux/slices/` - State management schemas
- `types/` - TypeScript definitions
- `constants/` - Application constants including LocalStorageKeys enum

### Configuration
- `next.config.mjs` - Next.js configuration with Sentry
- `tailwind.config.ts` - Design system configuration
- `tsconfig.json` - TypeScript configuration

## Common Development Patterns

### Adding New Features
1. Create Redux slice if state management needed
2. Add Supabase database functions if data persistence required
3. Create reusable components in appropriate directory
4. Add comprehensive tests for utilities
5. Update types as needed

### Database Changes
- Add SQL migration files to `lib/supabase/sql/`
- Update TypeScript types
- Add corresponding Redux slice updates
- Test with proper RLS policies

### Smart Contract Interactions
- Extend `useMovinEarn.ts` hook for new contract functions
- Handle wallet connection and funding automatically
- Implement proper error handling and user feedback
- Test transaction flows thoroughly

### UI Development
- Use existing design system from `components/ui/`
- Follow mobile-first responsive design
- Implement proper loading and error states
- Ensure PWA compatibility and touch interactions

## Important Development Notes

### Data Handling
- Always sort time-series data chronologically before display (e.g., exercise progress charts)
- Use proper date parsing with `new Date().getTime()` for accurate chronological sorting
- Apply session/index numbering after sorting, not before

### Component Patterns
- Export components from `index.ts` files for clean imports
- Use `useMemo` for expensive data transformations
- Implement proper loading states with skeleton components
- Handle empty states with user-friendly messaging

### Constants and Enums
- Use `LocalStorageKeys` enum from `constants/localStorage.ts` for all localStorage operations
- Reference test IDs from `constants/dataTestIds.mjs` for E2E tests