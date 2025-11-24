import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * TEST EXECUTION FRAMEWORK
 * Runs 10 test iterations across 10 personas
 * Aggregates results into comprehensive findings report
 */

interface TestResult {
  runNumber: number;
  persona: string;
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  metrics?: Record<string, any>;
}

interface AggregatedFindings {
  totalRuns: number;
  totalTests: number;
  passRate: number;
  failRate: number;
  skipRate: number;
  averageLoadTime: number;
  averageInteractionTime: number;
  findings: Finding[];
  recommendations: string[];
}

interface Finding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedPersonas: string[];
  occurrenceCount: number;
  reproducibility: 'always' | 'frequent' | 'occasional' | 'rare';
}

const RESULTS_DIR = path.join(process.cwd(), 'test-results');
const FINDINGS_FILE = path.join(RESULTS_DIR, 'aggregated-findings.json');
const REPORT_FILE = path.join(RESULTS_DIR, 'comprehensive-test-report.md');

/**
 * Create results directory
 */
function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

/**
 * Run tests with Playwright
 */
async function runPlaywrightTests(testFile: string, runNumber: number): Promise<TestResult[]> {
  const resultsFile = path.join(RESULTS_DIR, `run-${runNumber}-results.json`);

  try {
    const command = `npx playwright test ${testFile} --reporter=json > ${resultsFile}`;
    execSync(command, { stdio: 'inherit' });
  } catch (e) {
    // Playwright test runner exit with non-zero on failures
    // This is expected - we capture the results anyway
  }

  // Parse Playwright JSON report
  if (fs.existsSync(resultsFile)) {
    const reportContent = fs.readFileSync(resultsFile, 'utf-8');
    return parsePlaywrightReport(reportContent, runNumber);
  }

  return [];
}

/**
 * Parse Playwright JSON report
 */
function parsePlaywrightReport(content: string, runNumber: number): TestResult[] {
  try {
    const report = JSON.parse(content);
    const results: TestResult[] = [];

    for (const suite of report.suites || []) {
      for (const spec of suite.specs || []) {
        results.push({
          runNumber,
          persona: suite.title || 'Unknown',
          testName: spec.title || 'Unknown',
          status: spec.ok ? 'pass' : 'fail',
          duration: spec.duration || 0,
          error: spec.error?.message
        });
      }
    }

    return results;
  } catch (e) {
    console.error('Failed to parse Playwright report:', e);
    return [];
  }
}

/**
 * Aggregate results across all runs
 */
function aggregateResults(allResults: TestResult[]): AggregatedFindings {
  const personas = new Set(allResults.map(r => r.persona));
  const categories = new Set(allResults.map(r => r.testName));

  const totalTests = allResults.length;
  const passCount = allResults.filter(r => r.status === 'pass').length;
  const failCount = allResults.filter(r => r.status === 'fail').length;
  const skipCount = allResults.filter(r => r.status === 'skip').length;

  const averageLoadTime = calculateAverageLoadTime(allResults);
  const averageInteractionTime = calculateAverageInteractionTime(allResults);

  const findings = extractFindings(allResults);
  const recommendations = generateRecommendations(findings);

  return {
    totalRuns: 10,
    totalTests,
    passRate: (passCount / totalTests) * 100,
    failRate: (failCount / totalTests) * 100,
    skipRate: (skipCount / totalTests) * 100,
    averageLoadTime,
    averageInteractionTime,
    findings,
    recommendations
  };
}

/**
 * Calculate average load time from results
 */
function calculateAverageLoadTime(results: TestResult[]): number {
  const loadTests = results.filter(r => r.testName.includes('load'));
  if (loadTests.length === 0) return 0;

  const total = loadTests.reduce((sum, r) => sum + r.duration, 0);
  return Math.round(total / loadTests.length);
}

/**
 * Calculate average interaction time
 */
function calculateAverageInteractionTime(results: TestResult[]): number {
  const interactionTests = results.filter(r => r.testName.includes('click') || r.testName.includes('interact'));
  if (interactionTests.length === 0) return 0;

  const total = interactionTests.reduce((sum, r) => sum + r.duration, 0);
  return Math.round(total / interactionTests.length);
}

/**
 * Extract key findings from test results
 */
function extractFindings(results: TestResult[]): Finding[] {
  const findings: Finding[] = [];
  const failedTests = results.filter(r => r.status === 'fail');

  // Group failures by type
  const failureGroups: Record<string, TestResult[]> = {};

  for (const failure of failedTests) {
    const key = failure.testName;
    if (!failureGroups[key]) {
      failureGroups[key] = [];
    }
    failureGroups[key].push(failure);
  }

  // Create findings
  for (const [testName, failures] of Object.entries(failureGroups)) {
    const affectedPersonas = failures.map(f => f.persona);
    const reproducibility = getReproducibility(failures.length / results.length);

    findings.push({
      category: extractCategory(testName),
      severity: extractSeverity(testName),
      description: `${testName} failed in ${failures.length} out of ${results.length} test runs`,
      affectedPersonas,
      occurrenceCount: failures.length,
      reproducibility
    });
  }

  // Add performance findings
  const slowTests = results.filter(r => r.duration > 3000);
  if (slowTests.length > 0) {
    findings.push({
      category: 'Performance',
      severity: 'high',
      description: `${slowTests.length} tests took longer than 3 seconds to execute`,
      affectedPersonas: [...new Set(slowTests.map(t => t.persona))],
      occurrenceCount: slowTests.length,
      reproducibility: 'frequent'
    });
  }

  return findings;
}

/**
 * Determine reproducibility based on occurrence rate
 */
function getReproducibility(rate: number): 'always' | 'frequent' | 'occasional' | 'rare' {
  if (rate >= 0.8) return 'always';
  if (rate >= 0.5) return 'frequent';
  if (rate >= 0.2) return 'occasional';
  return 'rare';
}

/**
 * Extract category from test name
 */
function extractCategory(testName: string): string {
  if (testName.includes('load')) return 'Loading';
  if (testName.includes('performance')) return 'Performance';
  if (testName.includes('accessibility')) return 'Accessibility';
  if (testName.includes('responsive')) return 'Responsiveness';
  if (testName.includes('security')) return 'Security';
  if (testName.includes('error')) return 'Error Handling';
  if (testName.includes('widget')) return 'Widget Management';
  if (testName.includes('navigation')) return 'Navigation';
  if (testName.includes('theme')) return 'Theme';
  return 'General';
}

/**
 * Extract severity based on test category
 */
function extractSeverity(testName: string): 'critical' | 'high' | 'medium' | 'low' {
  if (testName.includes('security')) return 'critical';
  if (testName.includes('load') || testName.includes('crash')) return 'critical';
  if (testName.includes('performance')) return 'high';
  if (testName.includes('error')) return 'high';
  if (testName.includes('accessibility')) return 'medium';
  if (testName.includes('theme') || testName.includes('ui')) return 'low';
  return 'medium';
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(findings: Finding[]): string[] {
  const recommendations: string[] = [];

  // Critical issues
  const criticalFindings = findings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > 0) {
    recommendations.push('🚨 URGENT: Address all critical severity findings before production deployment');
    recommendations.push(`- Critical issues found: ${criticalFindings.map(f => f.category).join(', ')}`);
  }

  // Performance issues
  const perfFindings = findings.filter(f => f.category === 'Performance');
  if (perfFindings.length > 0) {
    recommendations.push('⚡ Performance Optimization Needed:');
    recommendations.push('- Implement lazy loading for widgets');
    recommendations.push('- Consider code splitting for large bundles');
    recommendations.push('- Add service worker for offline capability');
  }

  // Accessibility issues
  const a11yFindings = findings.filter(f => f.category === 'Accessibility');
  if (a11yFindings.length > 0) {
    recommendations.push('♿ Accessibility Improvements:');
    recommendations.push('- Add ARIA labels to interactive elements');
    recommendations.push('- Ensure sufficient color contrast (WCAG AA minimum)');
    recommendations.push('- Test with screen readers (NVDA, JAWS)');
  }

  // Mobile issues
  const mobileFindings = findings.filter(f => f.affectedPersonas.includes('Robert (Mobile User)'));
  if (mobileFindings.length > 0) {
    recommendations.push('📱 Mobile Experience:');
    recommendations.push('- Increase touch target sizes to minimum 44x44px');
    recommendations.push('- Test on real devices in addition to emulation');
    recommendations.push('- Optimize images for mobile networks');
  }

  // General
  if (findings.length === 0) {
    recommendations.push('✅ All tests passed! Consider:');
    recommendations.push('- Expanding test coverage');
    recommendations.push('- Adding more edge case scenarios');
    recommendations.push('- Performance monitoring in production');
  }

  return recommendations;
}

/**
 * Generate markdown report
 */
function generateReport(aggregated: AggregatedFindings): string {
  const timestamp = new Date().toISOString();

  let report = `# WidgeTDC Comprehensive Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;
  report += `- **Total Test Runs:** ${aggregated.totalRuns} iterations × 10 personas\n`;
  report += `- **Total Tests Executed:** ${aggregated.totalTests}\n`;
  report += `- **Pass Rate:** ${aggregated.passRate.toFixed(1)}%\n`;
  report += `- **Fail Rate:** ${aggregated.failRate.toFixed(1)}%\n`;
  report += `- **Skip Rate:** ${aggregated.skipRate.toFixed(1)}%\n\n`;

  // Performance Metrics
  report += `## Performance Metrics\n\n`;
  report += `- **Average Page Load Time:** ${aggregated.averageLoadTime}ms\n`;
  report += `- **Average Interaction Time:** ${aggregated.averageInteractionTime}ms\n\n`;

  // Key Findings
  report += `## Key Findings\n\n`;

  if (aggregated.findings.length === 0) {
    report += `✅ No critical issues found.\n\n`;
  } else {
    // Group by severity
    const bySeverity = {
      critical: aggregated.findings.filter(f => f.severity === 'critical'),
      high: aggregated.findings.filter(f => f.severity === 'high'),
      medium: aggregated.findings.filter(f => f.severity === 'medium'),
      low: aggregated.findings.filter(f => f.severity === 'low')
    };

    if (bySeverity.critical.length > 0) {
      report += `### 🔴 Critical Issues (${bySeverity.critical.length})\n\n`;
      for (const finding of bySeverity.critical) {
        report += `- **${finding.category}**: ${finding.description}\n`;
        report += `  - Affected: ${finding.affectedPersonas.join(', ')}\n`;
        report += `  - Occurrences: ${finding.occurrenceCount}\n`;
        report += `  - Reproducibility: ${finding.reproducibility}\n\n`;
      }
    }

    if (bySeverity.high.length > 0) {
      report += `### 🟠 High Severity Issues (${bySeverity.high.length})\n\n`;
      for (const finding of bySeverity.high) {
        report += `- **${finding.category}**: ${finding.description}\n`;
        report += `  - Occurrences: ${finding.occurrenceCount}\n\n`;
      }
    }

    if (bySeverity.medium.length > 0) {
      report += `### 🟡 Medium Severity Issues (${bySeverity.medium.length})\n\n`;
      for (const finding of bySeverity.medium) {
        report += `- **${finding.category}**: ${finding.description}\n\n`;
      }
    }
  }

  // Recommendations
  report += `## Recommendations\n\n`;
  for (const rec of aggregated.recommendations) {
    report += `${rec}\n`;
  }

  // Test Coverage by Persona
  report += `\n## Test Coverage by Persona\n\n`;
  const personas = [
    'Sarah (Superuser)',
    'Marcus (Power User)',
    'Jamie (End User)',
    'Alex (Inventor)',
    'Nina (Novice)',
    'David (GUI Specialist)',
    'Lisa (Speed Freak)',
    'Chris (Security Officer)',
    'Emma (Edge Case Hunter)',
    'Robert (Mobile User)'
  ];

  for (const persona of personas) {
    const personaTests = aggregated.findings.filter(f => f.affectedPersonas.includes(persona));
    report += `- **${persona}**: ${personaTests.length} issues identified\n`;
  }

  return report;
}

/**
 * Main execution
 */
export async function runFullTestSuite() {
  ensureResultsDir();

  console.log('🚀 Starting WidgeTDC Comprehensive Test Suite');
  console.log('📊 Running 10 iterations across 10 personas\n');

  const allResults: TestResult[] = [];

  // Run tests 10 times
  for (let run = 1; run <= 10; run++) {
    console.log(`\n📍 Test Run ${run}/10`);
    console.log('═'.repeat(50));

    try {
      // Run E2E tests
      console.log('  Running E2E tests...');
      const e2eResults = await runPlaywrightTests('tests/e2e-comprehensive.spec.ts', run);
      allResults.push(...e2eResults);

      // Run Persona tests
      console.log('  Running persona tests...');
      const personaResults = await runPlaywrightTests('tests/persona-tests.spec.ts', run);
      allResults.push(...personaResults);

      console.log(`  ✓ Completed: ${e2eResults.length + personaResults.length} tests`);
    } catch (e) {
      console.error(`  ✗ Error in run ${run}:`, e);
    }
  }

  // Aggregate results
  console.log('\n\n📈 Aggregating results...');
  const aggregated = aggregateResults(allResults);

  // Save findings
  fs.writeFileSync(FINDINGS_FILE, JSON.stringify(aggregated, null, 2));
  console.log(`✓ Findings saved to: ${FINDINGS_FILE}`);

  // Generate and save report
  const report = generateReport(aggregated);
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`✓ Report saved to: ${REPORT_FILE}`);

  // Print summary
  console.log('\n\n' + '═'.repeat(70));
  console.log('COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${aggregated.totalTests}`);
  console.log(`✅ Pass: ${((aggregated.passRate / 100) * aggregated.totalTests).toFixed(0)} (${aggregated.passRate.toFixed(1)}%)`);
  console.log(`❌ Fail: ${((aggregated.failRate / 100) * aggregated.totalTests).toFixed(0)} (${aggregated.failRate.toFixed(1)}%)`);
  console.log(`⏭️ Skip: ${((aggregated.skipRate / 100) * aggregated.totalTests).toFixed(0)} (${aggregated.skipRate.toFixed(1)}%)`);
  console.log(`\n📊 Key Findings: ${aggregated.findings.length}`);

  for (const finding of aggregated.findings.slice(0, 5)) {
    console.log(`  - [${finding.severity.toUpperCase()}] ${finding.category}: ${finding.description}`);
  }

  if (aggregated.findings.length > 5) {
    console.log(`  ... and ${aggregated.findings.length - 5} more findings`);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✨ Test suite complete!');
  console.log('📄 Full report: test-results/comprehensive-test-report.md');
  console.log('📋 JSON findings: test-results/aggregated-findings.json');
}

// Run if executed directly
if (require.main === module) {
  runFullTestSuite().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
