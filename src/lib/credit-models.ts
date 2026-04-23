// ============================================
// PlanTune — Credit Calculation Engine
// ============================================

import {
    SubscriptionTier,
    SUBSCRIPTION_PLANS,
    CREDIT_PACKS,
    DAILY_ALLOWANCE,
    type PricingScenario,
    type ProjectionResult,
    type CreditPack,
} from './types';

/**
 * Calculate monthly cost for a given tier (subscription only).
 */
export function getMonthlyCost(tier: SubscriptionTier): number {
    return SUBSCRIPTION_PLANS[tier].price / 100;
}

/**
 * Calculate the effective daily credits available (allowance + bonus spread).
 */
export function getEffectiveDailyCredits(tier: SubscriptionTier): number {
    const plan = SUBSCRIPTION_PLANS[tier];
    const dailyFromAllowance = plan.dailyAllowance;
    const dailyFromBonus = plan.creditsPerMonth / 30;
    return dailyFromAllowance + dailyFromBonus;
}

/**
 * Calculate monthly credits from daily allowance (assuming full usage).
 */
export function getMonthlyCreditsFromAllowance(tier: SubscriptionTier): number {
    return DAILY_ALLOWANCE[tier] * 30;
}

/**
 * Calculate total monthly credits available (allowance + bonus).
 */
export function getTotalMonthlyCredits(tier: SubscriptionTier): number {
    const plan = SUBSCRIPTION_PLANS[tier];
    return getMonthlyCreditsFromAllowance(tier) + plan.creditsPerMonth;
}

/**
 * Calculate cost per credit for a given tier at a given usage level.
 */
export function getCostPerCredit(tier: SubscriptionTier, monthlyUsage: number): number {
    const monthlyCost = getMonthlyCost(tier);
    if (monthlyCost === 0 && monthlyUsage === 0) return 0;
    if (monthlyCost === 0) return 0; // Free tier — no cost per credit
    return monthlyCost / Math.max(monthlyUsage, 1);
}

/**
 * Calculate wasted credits per month (daily allowance not used).
 */
export function getWastedCredits(tier: SubscriptionTier, monthlyUsage: number): number {
    const totalAvailable = getTotalMonthlyCredits(tier);
    return Math.max(0, totalAvailable - monthlyUsage);
}

/**
 * Calculate credit pack cost for a strategy.
 */
export function getPackMonthlyCost(
    packId: string,
    frequency: 'monthly' | 'quarterly' | 'yearly'
): number {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) return 0;
    const priceInDollars = pack.price / 100;
    switch (frequency) {
        case 'monthly': return priceInDollars;
        case 'quarterly': return priceInDollars / 3;
        case 'yearly': return priceInDollars / 12;
    }
}

/**
 * Calculate credits from packs per month.
 */
export function getPackMonthlyCredits(
    packId: string,
    frequency: 'monthly' | 'quarterly' | 'yearly'
): number {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) return 0;
    switch (frequency) {
        case 'monthly': return pack.credits;
        case 'quarterly': return pack.credits / 3;
        case 'yearly': return pack.credits / 12;
    }
}

/**
 * Find the optimal credit pack for a given credit deficit.
 */
export function findOptimalPack(creditDeficit: number): CreditPack | null {
    if (creditDeficit <= 0) return null;
    const sorted = [...CREDIT_PACKS]
        .filter(p => p.isActive)
        .sort((a, b) => (a.price / a.credits) - (b.price / b.credits));

    // Find smallest pack that covers the deficit, or the best value one
    const covering = sorted.find(p => p.credits >= creditDeficit);
    return covering || sorted[sorted.length - 1] || null;
}

/**
 * Generate a multi-month projection for a pricing scenario.
 */
export function generateProjection(
    scenario: PricingScenario,
    months: number = 12,
    alternativeTier?: SubscriptionTier
): ProjectionResult[] {
    const results: ProjectionResult[] = [];
    let cumulativeCost = 0;
    let cumulativeAlternativeCost = 0;
    let creditBalance = SUBSCRIPTION_PLANS[scenario.tier].creditsPerMonth;

    for (let month = 1; month <= months; month++) {
        // Apply growth rate to usage
        const growthMultiplier = Math.pow(1 + scenario.growthRate / 100, month - 1);
        const monthlyUsage = Math.round(scenario.monthlyUsage * growthMultiplier);

        // Subscription cost
        const subCost = getMonthlyCost(scenario.tier);

        // Credits from daily allowance
        const allowanceCredits = getMonthlyCreditsFromAllowance(scenario.tier);
        const bonusCredits = SUBSCRIPTION_PLANS[scenario.tier].creditsPerMonth;
        const totalBaseCredits = allowanceCredits + bonusCredits;

        // Credit pack cost
        let packCost = 0;
        let packCredits = 0;
        if (scenario.creditPackStrategy === 'custom') {
            for (const cp of scenario.customPacks) {
                packCost += getPackMonthlyCost(cp.packId, cp.frequency);
                packCredits += getPackMonthlyCredits(cp.packId, cp.frequency);
            }
        } else if (scenario.creditPackStrategy === 'as-needed') {
            const deficit = monthlyUsage - totalBaseCredits - creditBalance;
            if (deficit > 0) {
                const bestPack = findOptimalPack(deficit);
                if (bestPack) {
                    packCost = bestPack.price / 100;
                    packCredits = bestPack.credits;
                }
            }
        } else if (scenario.creditPackStrategy === 'bulk-quarterly' && month % 3 === 1) {
            const bestPack = findOptimalPack(scenario.monthlyUsage * 3);
            if (bestPack) {
                packCost = bestPack.price / 100;
                packCredits = bestPack.credits;
            }
        }

        // Calculate balance
        creditBalance += totalBaseCredits + packCredits;
        const consumed = Math.min(monthlyUsage, creditBalance);
        creditBalance -= consumed;
        const wasted = Math.max(0, totalBaseCredits - consumed);

        // Monthly total
        const monthCost = subCost + packCost;
        cumulativeCost += monthCost;

        // Alternative cost (for comparison)
        const altTier = alternativeTier || 'free';
        const altSubCost = getMonthlyCost(altTier);
        cumulativeAlternativeCost += altSubCost;

        results.push({
            month,
            totalCost: cumulativeCost,
            creditBalance: Math.round(creditBalance),
            creditsConsumed: consumed,
            costPerCredit: consumed > 0 ? monthCost / consumed : 0,
            wastedCredits: Math.round(wasted),
            savingsVsAlternative: cumulativeAlternativeCost - cumulativeCost,
        });
    }

    return results;
}

/**
 * Compare multiple scenarios and rank them.
 */
export function compareScenarios(
    scenarios: PricingScenario[],
    months: number = 12
): { scenario: PricingScenario; projection: ProjectionResult[]; rank: number }[] {
    const results = scenarios.map(scenario => ({
        scenario,
        projection: generateProjection(scenario, months),
        rank: 0,
    }));

    // Rank by total cost (lowest first)
    results.sort((a, b) => {
        const aCost = a.projection[a.projection.length - 1]?.totalCost || 0;
        const bCost = b.projection[b.projection.length - 1]?.totalCost || 0;
        return aCost - bCost;
    });

    results.forEach((r, i) => { r.rank = i + 1; });

    return results;
}

/**
 * Find the break-even month between two tiers.
 */
export function findBreakEvenMonth(
    usage: number,
    tierA: SubscriptionTier,
    tierB: SubscriptionTier,
    maxMonths: number = 60
): number | null {
    let costA = 0;
    let costB = 0;

    for (let month = 1; month <= maxMonths; month++) {
        costA += getMonthlyCost(tierA);
        costB += getMonthlyCost(tierB);

        const creditsA = getTotalMonthlyCredits(tierA);
        const creditsB = getTotalMonthlyCredits(tierB);

        // If tier B covers usage better and costs less cumulatively
        if (creditsB >= usage && costB < costA && creditsA < usage) {
            return month;
        }
        // If cheaper tier starts being more economical
        if (costA > costB && creditsA >= usage) {
            return month;
        }
    }

    return null;
}
