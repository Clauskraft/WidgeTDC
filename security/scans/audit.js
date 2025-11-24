const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      summary: {},
    };
  }

  runNpmAudit() {
    try {
      const output = execSync('npm audit --json', { encoding: 'utf-8' });
      const auditData = JSON.parse(output);

      this.results.vulnerabilities.push(...auditData.vulnerabilities);
      this.results.summary.npm = {
        total: auditData.metadata.vulnerabilities.total,
        critical: auditData.metadata.vulnerabilities.critical,
        high: auditData.metadata.vulnerabilities.high,
        moderate: auditData.metadata.vulnerabilities.moderate,
        low: auditData.metadata.vulnerabilities.low,
      };
    } catch (error) {
      console.error('npm audit failed:', error.message);
    }
  }

  checkSecurityHeaders() {
    const required = ['helmet', 'express-rate-limit', 'csurf', 'sanitize-html'];

    const packageJson = require('../../package.json');
    const missing = required.filter(
      pkg => !packageJson.dependencies[pkg] && !packageJson.devDependencies[pkg]
    );

    this.results.summary.securityPackages = {
      required,
      missing,
      installed: required.length - missing.length,
    };
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../reports/audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('Security Audit Report:');
    console.log(JSON.stringify(this.results.summary, null, 2));

    return this.results;
  }

  run() {
    console.log('Running security audit...');
    this.runNpmAudit();
    this.checkSecurityHeaders();
    return this.generateReport();
  }
}

if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run();
}

module.exports = SecurityAuditor;
