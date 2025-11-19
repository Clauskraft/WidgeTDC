import React, { useState } from 'react';
import { Upload, AlertTriangle, Shield, Code, CheckCircle, FileText } from 'lucide-react';

interface Finding {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  remediation: string;
}

interface AnalysisResult {
  summary: {
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    totalFiles: number;
  };
  findings: Finding[];
  overallScore: number;
}

export const CodeAnalysisWidget: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/commands/sc/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'high':
        return 'bg-warning/20 text-warning border-warning/50';
      case 'medium':
        return 'bg-accent/20 text-accent-foreground border-accent/50';
      default:
        return 'bg-primary/20 text-primary border-primary/50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="group flex flex-col h-full bg-card/5 backdrop-blur-sm rounded-lg border border-border/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hero)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-destructive/5 to-warning/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/20 rounded-lg animate-glow-pulse">
            <Shield className="w-6 h-6" style={{ color: 'hsl(var(--destructive))' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Code Analysis</h3>
            <p className="text-sm text-muted-foreground">Security • Quality • Performance</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-subtle">
        {!result && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/10 mb-6">
              <Code className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--destructive))' }} />
              <h4 className="text-xl font-semibold text-card-foreground mb-2">
                Upload din kode for analyse
              </h4>
              <p className="text-muted-foreground mb-6 max-w-md">
                Få øjeblikkelig feedback på sikkerhedsrisici, kodekvalitet og performance-problemer
              </p>

              <label className="inline-flex items-center gap-2 btn-primary cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>Vælg fil eller mappe</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".js,.ts,.tsx,.jsx,.py,.java,.cs,.go"
                  disabled={isAnalyzing}
                />
              </label>

              {isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 text-muted-foreground animate-fade-in">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--destructive))' }} />
                  <span>Analyserer {selectedFile?.name}...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-destructive/10 backdrop-blur rounded-lg border border-destructive/20 transition-transform hover:scale-105">
                <Shield className="w-8 h-8 mb-2" style={{ color: 'hsl(var(--destructive))' }} />
                <p className="text-sm font-semibold text-card-foreground">Sikkerhed</p>
                <p className="text-xs text-muted-foreground">SQL injection, XSS, CSRF</p>
              </div>
              <div className="p-4 bg-success/10 backdrop-blur rounded-lg border border-success/20 transition-transform hover:scale-105">
                <CheckCircle className="w-8 h-8 mb-2" style={{ color: 'hsl(var(--success))' }} />
                <p className="text-sm font-semibold text-card-foreground">Kvalitet</p>
                <p className="text-xs text-muted-foreground">Best practices, patterns</p>
              </div>
              <div className="p-4 bg-warning/10 backdrop-blur rounded-lg border border-warning/20 transition-transform hover:scale-105">
                <AlertTriangle className="w-8 h-8 mb-2" style={{ color: 'hsl(var(--warning))' }} />
                <p className="text-sm font-semibold text-card-foreground">Performance</p>
                <p className="text-xs text-muted-foreground">Loops, memory leaks</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 text-center transition-transform hover:scale-105">
                <div className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Samlet Score</div>
              </div>
              <div className="p-4 bg-destructive/10 backdrop-blur border border-destructive/30 rounded-lg text-center transition-transform hover:scale-105">
                <div className="text-3xl font-bold text-destructive">{result.summary.criticalIssues}</div>
                <div className="text-sm text-muted-foreground mt-1">Critical</div>
              </div>
              <div className="p-4 bg-warning/10 backdrop-blur border border-warning/30 rounded-lg text-center transition-transform hover:scale-105">
                <div className="text-3xl font-bold text-warning">{result.summary.highIssues}</div>
                <div className="text-sm text-muted-foreground mt-1">High</div>
              </div>
              <div className="p-4 bg-accent/10 backdrop-blur border border-accent/30 rounded-lg text-center transition-transform hover:scale-105">
                <div className="text-3xl font-bold text-accent-foreground">{result.summary.mediumIssues}</div>
                <div className="text-sm text-muted-foreground mt-1">Medium</div>
              </div>
              <div className="p-4 bg-primary/10 backdrop-blur border border-primary/30 rounded-lg text-center transition-transform hover:scale-105">
                <div className="text-3xl font-bold text-primary">{result.summary.lowIssues}</div>
                <div className="text-sm text-muted-foreground mt-1">Low</div>
              </div>
            </div>

            {/* Findings List */}
            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                Findings ({result.findings.length})
              </h4>
              <div className="space-y-3">
                {result.findings.map((finding, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border backdrop-blur-sm transition-all hover:scale-[1.01] ${getSeverityColor(finding.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">{finding.category}</span>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-bold uppercase">
                        {finding.severity}
                      </span>
                    </div>

                    <p className="text-card-foreground mb-2">{finding.description}</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <FileText className="w-4 h-4" />
                      <span>
                        {finding.file}:{finding.line}
                      </span>
                    </div>

                    <div className="p-3 bg-success/10 backdrop-blur rounded border-l-4 border-success">
                      <p className="text-sm font-semibold text-success mb-1">💡 Remediation:</p>
                      <p className="text-sm text-card-foreground">{finding.remediation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                }}
                className="btn-secondary"
              >
                Analyser ny fil
              </button>
              <button
                onClick={() => {
                  const json = JSON.stringify(result, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analysis-${Date.now()}.json`;
                  a.click();
                }}
                className="btn-primary"
              >
                Download rapport
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeAnalysisWidget;
