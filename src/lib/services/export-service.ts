import type { ProjectionResult, PricingScenario } from '../types';

/**
 * Export projection data as a CSV file download.
 */
export function exportToCSV(
    data: ProjectionResult[],
    scenarioName: string = 'projection'
): void {
    const headers = [
        'Month',
        'Total Cost ($)',
        'Credit Balance',
        'Credits Consumed',
        'Cost Per Credit ($)',
        'Wasted Credits',
        'Savings vs Alternative ($)',
    ];

    const rows = data.map(d => [
        d.month,
        d.totalCost.toFixed(2),
        d.creditBalance,
        d.creditsConsumed,
        d.costPerCredit.toFixed(4),
        d.wastedCredits,
        d.savingsVsAlternative.toFixed(2),
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
    ].join('\n');

    downloadFile(csv, `${sanitizeFilename(scenarioName)}_projection.csv`, 'text/csv');
}

/**
 * Export multiple scenarios as a comparative CSV.
 */
export function exportMultiScenarioCSV(
    scenarios: PricingScenario[],
    projections: ProjectionResult[][],
    horizon: number
): void {
    const headers = ['Month'];
    scenarios.forEach(s => {
        headers.push(`${s.name} - Cost ($)`);
        headers.push(`${s.name} - Balance`);
        headers.push(`${s.name} - $/Credit`);
    });

    const rows: string[][] = [];
    for (let i = 0; i < horizon; i++) {
        const row: string[] = [`${i + 1}`];
        projections.forEach(proj => {
            const p = proj[i];
            if (p) {
                row.push(p.totalCost.toFixed(2));
                row.push(`${p.creditBalance}`);
                row.push(p.costPerCredit.toFixed(4));
            } else {
                row.push('', '', '');
            }
        });
        rows.push(row);
    }

    const csv = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
    ].join('\n');

    downloadFile(csv, `scenario_comparison_${horizon}m.csv`, 'text/csv');
}

/**
 * Export scenario configuration as JSON (for sharing/importing).
 */
export function exportScenarioJSON(scenario: PricingScenario): void {
    const json = JSON.stringify(scenario, null, 2);
    downloadFile(json, `${sanitizeFilename(scenario.name)}_scenario.json`, 'application/json');
}

/**
 * Trigger a file download in the browser.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Sanitize a string for use as a filename.
 */
function sanitizeFilename(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_\-]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 64);
}
