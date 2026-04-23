# PlanTune — Implementation Plan

> **Version:** 1.0 · **Date:** 2026-04-23 · **Status:** APPROVED

---

## 1 · Executive Summary

PlanTune is a new addition to the App Suite — the **definitive authority on AI Credits/Token economics**. It helps users understand, model, compare, and optimise their credit consumption across AI providers, starting with **NanoBanana Gemini Tokens**. The app recommends optimal Purchase & Pricing Strategies, provides a Research Centre of Excellence, and offers interactive tuning tools — all anchored in hard numbers with rich graphical presentation.

---

## 2 · Architecture Overview

### 2.1 Tech Stack (mirrors PromptTool)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.x (shared design tokens) |
| Auth | Firebase Auth (Google sign-in, shared across suite) |
| Database | Firestore `plantune-db-0` |
| Identity Store | Firestore `prompttool-db-0` (read-only for entitlements) |
| Payments | Stripe (shared account, API version `2023-10-16`) |
| Charts | Recharts (already used in PromptTool) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Validation | Zod |

### 2.2 Project Structure

```
PlanTune/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css
│   │   ├── dashboard/page.tsx          # Main dashboard
│   │   ├── modeller/page.tsx           # Strategy modelling
│   │   ├── research/page.tsx           # CoE Research hub
│   │   ├── recommendations/page.tsx    # Plan recommendations
│   │   ├── tuner/page.tsx              # Interactive tuner
│   │   ├── arbitrage/page.tsx          # Market analysis
│   │   ├── pricing/page.tsx            # Subscription & packs
│   │   ├── settings/page.tsx           # Account settings
│   │   ├── admin/page.tsx              # Admin panel
│   │   └── api/
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts
│   │       │   ├── verify-session/route.ts
│   │       │   └── webhook/route.ts
│   │       ├── research/route.ts
│   │       └── recommendations/route.ts
│   ├── components/
│   │   ├── ui/                         # Shared UI primitives
│   │   ├── charts/                     # Chart components
│   │   ├── modeller/                   # Modelling widgets
│   │   ├── tuner/                      # Interactive sliders
│   │   └── research/                   # Research components
│   ├── lib/
│   │   ├── firebase.ts                 # Client SDK (plantune-db-0)
│   │   ├── firebase-admin.ts           # Admin SDK (plantune-db-0 + cross-db)
│   │   ├── stripe.ts                   # Stripe SDK init
│   │   ├── entitlements.ts             # Suite entitlement checks
│   │   ├── auth-context.tsx            # Auth provider
│   │   ├── types.ts                    # Shared types
│   │   ├── credit-models.ts            # Credit calculation engine
│   │   ├── projection-engine.ts        # Future cost projections
│   │   └── config-helper.ts            # Env/config helpers
│   └── hooks/
│       ├── useModeller.ts
│       ├── useTuner.ts
│       ├── useResearch.ts
│       └── useRecommendations.ts
├── .env.local
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

### 2.3 Database Schema (plantune-db-0)

```
plantune-db-0/
├── users/{uid}                         # Mirrors suite pattern
│   ├── subscription: SubscriptionTier
│   ├── role: UserRole
│   └── settings: { isAdmin, preferences... }
│
├── scenarios/{scenarioId}              # User-created pricing scenarios
│   ├── userId: string
│   ├── name: string
│   ├── useCase: string                 # e.g. "creator-saas"
│   ├── providers: ProviderConfig[]
│   ├── revenueStreams: RevenueStream[]
│   ├── projections: Projection[]
│   ├── isPublic: boolean
│   ├── createdAt / updatedAt
│   └── snapshots/{snapshotId}          # Version history
│
├── research/{articleId}                # Centre of Excellence
│   ├── userId: string
│   ├── title, content, summary
│   ├── sources: Source[]
│   ├── tags: string[]
│   ├── visibility: 'private' | 'published'
│   ├── version: number
│   └── history/{versionId}
│
├── market-data/{providerId}            # Arbitrage / market intel
│   ├── provider: string
│   ├── currentPricing: PricingSnapshot
│   ├── historicalPricing: PricingSnapshot[]
│   └── lastUpdated: Timestamp
│
├── credit-packs/{packId}               # Available credit packs
│   ├── name, credits, price
│   ├── stripePriceId
│   └── isActive: boolean
│
└── system/config                       # App-level config
```

---

## 3 · Stripe Integration (Aligned with Suite)

### 3.1 Existing Tiers (DO NOT MODIFY)

| Tier | Price | Daily Credits | Monthly Bonus | Stripe Price ID |
|------|-------|---------------|---------------|-----------------|
| Free | $0 | 5 | 0 | — |
| Standard | $9.99/mo | 15 | 100 | `price_1SydTg8u0kAcEZ9TIAyXm550` |
| Pro | $29.99/mo | 50 | 500 | `price_1SydU68u0kAcEZ9TtsBpLH2C` |

### 3.2 PlanTune Feature Gating by Tier

| Feature | Free | Standard | Pro |
|---------|------|----------|-----|
| Dashboard & basic tracking | ✓ | ✓ | ✓ |
| 1 scenario at a time | ✓ | — | — |
| Up to 5 scenarios | — | ✓ | — |
| Unlimited scenarios | — | — | ✓ |
| Basic recommendations | ✓ | ✓ | ✓ |
| Advanced projections (12+ months) | — | ✓ | ✓ |
| Research: read published | ✓ | ✓ | ✓ |
| Research: create & publish | — | ✓ | ✓ |
| Deep Research integration | — | — | ✓ |
| Interactive tuner | — | ✓ | ✓ |
| Arbitrage alerts | — | — | ✓ |
| Export (PDF/CSV) | — | ✓ | ✓ |
| Admin panel | — | — | Admin only |

### 3.3 New Supplementary Stripe Products (Credit Packs)

These are **new Stripe Products** created under the same Stripe account. They use `mode: 'payment'` (one-time), NOT `mode: 'subscription'`.

| Pack | Credits | Price | Stripe Product Metadata |
|------|---------|-------|------------------------|
| Starter Pack | 100 | $4.99 | `suite_access: "plantune"` |
| Growth Pack | 500 | $19.99 | `suite_access: "plantune"` |
| Power Pack | 1,000 | $34.99 | `suite_access: "plantune"` |
| Enterprise Pack | 5,000 | $149.99 | `suite_access: "plantune"` |

### 3.4 Webhook Dual-Sync Pattern

PlanTune's webhook must replicate the PromptResources pattern — syncing subscription state across databases:

```typescript
// firebase-admin.ts exports (PlanTune version)
export const adminDb = getFirestore(app, 'plantune-db-0');        // Own DB
export const identityDb = getFirestore(app, 'prompttool-db-0');   // Identity store (read + sync)
export const resourcesDb = getFirestore(app, 'promptresources-db-0');
export const masterDb = getFirestore(app, 'promptmaster-spa-db-0');
```

On `checkout.session.completed` for **credit pack purchases**:
1. Increment user's credit balance in `plantune-db-0`
2. Record transaction in `creditHistory` subcollection
3. No tier change (packs are supplementary)

For **subscription changes**, defer to the existing PromptResources webhook which already syncs across all databases. PlanTune reads entitlements, it doesn't write them.

### 3.5 Suite Entitlement Registration

```typescript
// entitlements.ts
type AppSuiteType = 'resources' | 'studio' | 'prompttool' | 'registry' | 'plantune';
```

The Stripe Product for suite subscriptions must add `plantune` to `suite_access` metadata:
- Current: `suite_access: "resources,studio,registry,prompttool"`
- Updated: `suite_access: "resources,studio,registry,prompttool,plantune"`

### 3.6 Shared Stripe Credentials

```env
# Same Stripe account across all apps
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRwq9...
STRIPE_SECRET_KEY=sk_test_51SRwq9...
STRIPE_WEBHOOK_SECRET=whsec_<plantune-specific-endpoint-secret>
```

---

## 4 · Revenue Architecture

### 4.1 Income Sources

| # | Source | Model | Description |
|---|--------|-------|-------------|
| 1 | **Subscriptions** | Recurring | Existing Free/Standard/Pro tiers gate PlanTune features |
| 2 | **Credit Packs** | One-time | Bulk credit purchases (§3.3) |
| 3 | **Pay-As-You-Go** | Metered | Per-analysis charges for deep research queries |
| 4 | **Advisory Reports** | One-time | AI-generated custom optimisation reports ($9.99 each) |
| 5 | **API Access** | Recurring add-on | Third-party integration for credit analytics |
| 6 | **White-Label Dashboards** | Enterprise | Branded analytics for SaaS platforms to offer their users |
| 7 | **Referral Credits** | Incentive | Earn credits for referring new users (both parties get bonus) |

### 4.2 Free-Tier Credit Management Services

| Service | Free Users | Standard | Pro |
|---------|-----------|----------|-----|
| Credit balance tracking | ✓ | ✓ | ✓ |
| Daily usage summary | ✓ | ✓ | ✓ |
| Burn-rate calculation | — | ✓ | ✓ |
| Expiry reminders | — | ✓ | ✓ |
| Optimisation tips | — | ✓ | ✓ |
| Predictive depletion alerts | — | — | ✓ |
| Auto-purchase triggers | — | — | ✓ |
| Google Account free-tier sync | ✓ | ✓ | ✓ |

**Upsell strategy**: Free users see their burn rate as "?" with a prompt to upgrade. Standard users see the number but not predictive alerts. Pro sees everything.

---

## 5 · Modelling & Projection Engine

### 5.1 Core Capabilities

- **Side-by-side comparison** of up to 4 pricing strategies simultaneously
- **Time projections**: 1 month, 3 months, 6 months, 1 year, 2 years, 5 years
- **Scenario variables**: monthly usage, growth rate, seasonality, tier changes
- **Break-even analysis**: at what usage does Standard beat Free? Pro beat Standard?

### 5.2 Calculation Engine (`credit-models.ts`)

```typescript
interface PricingScenario {
  name: string;
  tier: SubscriptionTier;
  monthlyUsage: number;           // credits consumed per month
  growthRate: number;              // monthly growth % (0-100)
  creditPackStrategy: 'none' | 'as-needed' | 'bulk-quarterly' | 'custom';
  customPacks: { packId: string; frequency: 'monthly' | 'quarterly' | 'yearly' }[];
}

interface ProjectionResult {
  month: number;
  totalCost: number;
  creditBalance: number;
  creditsConsumed: number;
  costPerCredit: number;
  wastedCredits: number;          // Unused daily allowance
  savingsVsAlternative: number;
}
```

### 5.3 Presentation Philosophy

| Context | Format |
|---------|--------|
| Comparison tables | Raw numbers with colour-coded deltas |
| Cost projections | Interactive line charts (Recharts) |
| Break-even | Annotated area charts |
| Credit flow | Sankey diagrams |
| Plan summaries | Metric cards with sparklines |
| Exports | PDF reports + CSV raw data |

**Rule**: Every chart has a "View Data" toggle that shows the underlying numbers in a sortable table.

---

## 6 · Visualisation Components

### 6.1 Chart Library (Recharts — already in PromptTool)

| Component | Use Case |
|-----------|----------|
| `<ProjectionChart>` | Multi-line cost projection over time |
| `<BreakEvenChart>` | Annotated area chart showing tier crossover points |
| `<CreditFlowSankey>` | Sankey diagram: income sources → credit pools → consumption |
| `<ComparisonBar>` | Grouped bar chart for side-by-side plan comparison |
| `<BurnRateGauge>` | Radial gauge showing current burn rate vs capacity |
| `<ScenarioHeatmap>` | Heat map grid: usage × tier → cost per credit |
| `<SparklineCard>` | Compact metric card with inline trend line |
| `<ROIWaterfall>` | Waterfall chart: revenue streams → costs → net benefit |

### 6.2 Interactive Tuner Components

| Component | Behaviour |
|-----------|-----------|
| `<UsageSlider>` | Drag to adjust monthly usage, charts update live |
| `<GrowthDial>` | Rotary knob for growth rate with snap points |
| `<TierToggle>` | Click to swap tiers, instant recalculation |
| `<PackConfigurator>` | Drag-and-drop pack selection with running total |
| `<TimeHorizonScrubber>` | Scrub timeline to see projected state at any month |

---

## 7 · Research Engine — Centre of Excellence

### 7.1 Architecture

```
Research Engine
├── Ingestion Layer
│   ├── Manual: User creates articles in rich-text editor
│   ├── Import: URL scraping + summarisation (Gemini)
│   └── Deep Research: Gemini Deep Research API for comprehensive reports
├── Storage Layer
│   ├── Firestore `research/` collection
│   ├── Version history in subcollection
│   └── Full-text search via indexed keywords
├── Discovery Layer
│   ├── Tag-based browsing
│   ├── Search with relevance ranking
│   └── "Related research" suggestions
└── Publishing Layer
    ├── Private (default) — user-only
    ├── Published — visible to all authenticated users
    └── Featured — admin-curated highlights
```

### 7.2 Deep Research Integration

- Use **Gemini API** (`@google/genai`) for:
  - Summarising imported URLs
  - Generating research reports on credit pricing trends
  - Answering user questions grounded in CoE data
- **Recommendation**: Use Gemini 2.0 Flash for speed on summaries, Gemini 2.5 Pro for deep analysis
- Gate deep research behind Pro tier (cost management)

### 7.3 Evolution Mechanisms

| Mechanism | Description |
|-----------|-------------|
| Version history | Every edit creates a snapshot; users can diff versions |
| Community contributions | Published research can receive comments/suggestions |
| Automated refresh | Scheduled re-check of market pricing data (Cloud Run cron) |
| Trend detection | AI flags when published research contradicts new market data |
| Citation graph | Research articles can reference each other, building a knowledge network |

---

## 8 · Recommendations Engine

### 8.1 How It Works

1. User inputs their **use case profile** (or selects a preset like "Creator-Friendly AI Graphics SaaS")
2. User inputs **expected monthly usage** and **growth trajectory**
3. Engine calculates optimal combination across all dimensions
4. Results presented as ranked recommendations with pros/cons

### 8.2 Output Format

Each recommendation card shows:

```
┌─────────────────────────────────────────────┐
│ ⭐ Recommended: Pro + Growth Pack Quarterly  │
│                                             │
│ Monthly cost:  $29.99 + $6.66 = $36.65      │
│ Credits/month: 50 daily + 500 bonus + 167   │
│ Cost/credit:   $0.051                       │
│ 12-month total: $439.80                     │
│                                             │
│ ✅ Pros:                                     │
│   • Lowest cost per credit at your usage     │
│   • Includes all quality tiers               │
│   • Batch generation included                │
│                                             │
│ ⚠️ Cons:                                     │
│   • Higher upfront monthly commitment        │
│   • 23% of daily credits may go unused       │
│                                             │
│ [View Projection →] [Compare →] [Apply →]   │
└─────────────────────────────────────────────┘
```

---

## 9 · Use Case: Creator-Friendly AI Graphics SaaS

### 9.1 Default Profile

| Parameter | Value |
|-----------|-------|
| Provider | NanoBanana (Gemini) |
| Monthly generations | 500–2,000 |
| Quality mix | 60% standard, 30% high, 10% ultra |
| Growth rate | 15% monthly |
| Revenue model | Subscription + credit packs + freemium |
| Target margin | 40% on credits |

### 9.2 Pre-built Scenarios

1. **Bootstrap** — Free tier, maximise daily allowance, no packs
2. **Growth** — Standard tier + monthly Growth Pack
3. **Scale** — Pro tier + quarterly Power Pack
4. **Enterprise** — Pro tier + Enterprise Pack + API access

---

## 10 · Arbitrage & Market Analysis

### 10.1 Opportunities

| Opportunity | Feasibility | Value |
|-------------|-------------|-------|
| Cross-provider price comparison | High | Show when Gemini tokens are cheaper than GPT-4/Claude equivalents |
| Bulk purchase timing | Medium | Track promotional periods, flag when prices drop |
| Tier arbitrage | High | Show when daily allowance covers usage (don't buy packs) |
| Free-tier stacking | Medium | Multiple Google accounts' free credits (compliance consideration) |
| Resale arbitrage | Low | Buying credits in bulk and redistributing (ToS risk) |

### 10.2 Market Data Collection

- Automated scraping of public pricing pages (scheduled task)
- Manual curator input for unpublished pricing
- Historical trend storage in `market-data/` collection
- Price alert system for Pro users

---

## 11 · Ancillary Revenue Streams

| Product | Model | Notes |
|---------|-------|-------|
| **Custom Optimisation Reports** | $9.99/report | AI-generated PDF with personalised strategy |
| **API Access** | $49/mo add-on | REST API for credit analytics (for SaaS platforms) |
| **White-Label Dashboard** | Enterprise | Branded version for SaaS providers to embed |
| **Consulting Tier** | $199/session | 1:1 video call with AI-assisted strategy review |
| **Credit Marketplace** | Commission | P2P credit trading (future, requires careful ToS) |
| **Certification Programme** | $49 one-time | "Certified Credit Strategist" badge for profiles |
| **Affiliate Programme** | Revenue share | Earn % when referred users subscribe to any suite app |

---

## 12 · Account Settings

### 12.1 Settings Pages

| Section | Features |
|---------|----------|
| **Profile** | Display name, email, avatar, bio |
| **Notifications** | Email preferences, alert thresholds, digest frequency |
| **Preferences** | Default time horizon, preferred chart type, currency |
| **Billing** | Current plan, credit balance, transaction history, manage Stripe subscription |
| **Admin** | Admin designation toggle (for `admin` / `su` roles) |
| **Data** | Export all data, delete account |

### 12.2 Admin Panel

- User management (view all users, grant/revoke admin)
- System config (announcement banner, feature flags)
- Research moderation (approve/reject published research)
- Analytics dashboard (active users, revenue, credit consumption)

---

## 13 · Suite Integration & SaaS Readiness

### 13.1 Cross-App Navigation

Add PlanTune to the suite navigation bar present in all apps:

```typescript
const SUITE_APPS = [
  { name: 'PromptTool', url: 'https://prompttool.app', key: 'prompttool' },
  { name: 'Resources', url: 'https://promptresources.app', key: 'resources' },
  { name: 'Registry', url: 'https://promptmaster.app', key: 'registry' },
  { name: 'Accreditation', url: 'https://accreditation.app', key: 'accreditation' },
  { name: 'PlanTune', url: 'https://plantune.app', key: 'plantune' },  // NEW
];
```

### 13.2 Auth Flow (identical to PromptTool)

1. Google Sign-In via Firebase Auth (popup, `prompt: 'select_account'`)
2. Create/update user doc in `plantune-db-0`
3. Read entitlements from `prompttool-db-0` via `suiteSubscription.activeSuites`
4. Real-time listener on user doc + credits doc
5. Admin detection via `ADMIN_EMAILS` constant

### 13.3 Environment Variables Template

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXrNmotaqXMyESMn1-wXdCjXdAzwQQAJo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=heidless-apps-0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=heidless-apps-0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=heidless-apps-0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=15797328912
NEXT_PUBLIC_FIREBASE_APP_ID=<plantune-specific-app-id>
NEXT_PUBLIC_FIREBASE_DATABASE_ID=plantune-db-0

# Firebase Admin
FIREBASE_PROJECT_ID=heidless-apps-0
FIREBASE_CLIENT_EMAIL=<service-account>@heidless-apps-0.iam.gserviceaccount.com
FIREBASE_DATABASE_ID=plantune-db-0
FIREBASE_PRIVATE_KEY="..."

# Gemini
GEMINI_API_KEY=<key>

# Stripe (shared account)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SRwq9...
STRIPE_SECRET_KEY=sk_test_51SRwq9...
STRIPE_WEBHOOK_SECRET=whsec_<plantune-endpoint-specific>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

---

## 14 · Decisions Log

All clarifying questions resolved on 2026-04-23:

| # | Question | Decision |
|---|----------|----------|
| 1 | Firebase App ID | Configure during dev — no pre-existing registration |
| 2 | Cross-DB webhook sync | **No** — PlanTune reads entitlements from `prompttool-db-0` directly. No changes to PromptResources webhook. |
| 3 | Dev port | **3004** |
| 4 | Stripe credit packs | Create in Stripe test mode during dev with proposed pack sizes/prices |
| 5 | Deep Research cost | **Hybrid** — Free=0 queries/mo, Standard=3/mo included, Pro=unlimited, overflow costs credits |
| 6 | Deployment | Same Cloud Run project (`heidless-apps-0`), separate service |
| 7 | Market data providers | **All 5**: Gemini, OpenAI, Anthropic, Midjourney, Stability AI |
| 8 | Branding | **Teal/emerald** differentiated palette (analytics identity) |

---

## 15 · Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Scaffold Next.js 14 project
- [ ] Firebase config (client + admin) targeting `plantune-db-0`
- [ ] Auth context (mirroring PromptTool pattern)
- [ ] Entitlements integration
- [ ] Stripe setup (subscription gating + credit pack products)
- [ ] Landing page
- [ ] Basic dashboard with credit tracking

### Phase 2: Core Engine (Week 3-4)
- [ ] Credit models & calculation engine
- [ ] Projection engine with time-series output
- [ ] Modeller page with scenario CRUD
- [ ] Side-by-side comparison view
- [ ] Chart components (ProjectionChart, ComparisonBar, BreakEvenChart)
- [ ] Recommendations engine

### Phase 3: Interactive Tuner (Week 5)
- [ ] Usage slider with live chart updates
- [ ] Growth dial
- [ ] Tier toggle with instant recalculation
- [ ] Pack configurator
- [ ] Time horizon scrubber

### Phase 4: Research Engine (Week 6-7)
- [ ] Research CRUD (create, edit, version)
- [ ] Rich text editor
- [ ] URL import + Gemini summarisation
- [ ] Publishing workflow (private → published)
- [ ] Search and discovery
- [ ] Deep Research integration (Pro only)

### Phase 5: Arbitrage & Market (Week 8)
- [ ] Market data collection framework
- [ ] Provider pricing database
- [ ] Cross-provider comparison views
- [ ] Price alert system

### Phase 6: Polish & SaaS (Week 9-10)
- [ ] Account settings pages
- [ ] Admin panel
- [ ] Export (PDF/CSV)
- [ ] Cross-app navigation integration
- [ ] Performance optimisation
- [ ] E2E tests (Playwright)
- [ ] Production deployment

---

## 16 · Verification Plan

### Automated Tests
```bash
npm run test          # Vitest unit tests (calculation engine, projections)
npm run e2e           # Playwright E2E (auth flow, Stripe checkout, modeller)
npm run build         # Next.js build (catches type errors)
```

### Manual Verification
- Stripe test-mode checkout for each credit pack
- Cross-database entitlement check (subscribe in PromptResources → verify access in PlanTune)
- Chart accuracy: manually calculate projections and compare with rendered output
- Responsive design check across breakpoints
