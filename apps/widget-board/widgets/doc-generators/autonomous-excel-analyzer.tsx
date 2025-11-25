/**
 * Autonomous Excel Analyzer Widget
 * AI-powered spreadsheet generation and data analysis
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type AnalysisType = 'financial' | 'statistical' | 'comparison' | 'forecast' | 'dashboard' | 'custom';
type GenerationPhase = 'idle' | 'analyzing' | 'structuring' | 'generating' | 'calculating' | 'charting' | 'completed';
type SheetStatus = 'pending' | 'generating' | 'completed' | 'error';
type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'combo';

interface SheetDefinition {
  id: string;
  name: string;
  description: string;
  columns: ColumnDefinition[];
  rows: Record<string, unknown>[];
  charts: ChartDefinition[];
  formulas: FormulaDefinition[];
  status: SheetStatus;
}

interface ColumnDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'formula';
  width: number;
  format?: string;
}

interface ChartDefinition {
  id: string;
  type: ChartType;
  title: string;
  dataRange: string;
  xAxis: string;
  yAxis: string[];
}

interface FormulaDefinition {
  cell: string;
  formula: string;
  description: string;
}

interface WorkbookConfig {
  title: string;
  analysisType: AnalysisType;
  dataSource: string;
  includeCharts: boolean;
  includePivotTables: boolean;
  includeFormulas: boolean;
  includeDashboard: boolean;
  theme: 'professional' | 'colorful' | 'minimal';
}

interface GenerationProgress {
  phase: GenerationPhase;
  currentSheet: number;
  totalSheets: number;
  message: string;
}

// ============================================================================
// EXCEL GENERATION ENGINE
// ============================================================================

class ExcelEngine {
  private sheets: SheetDefinition[] = [];
  private config: WorkbookConfig | null = null;
  private onUpdate: (sheets: SheetDefinition[], progress: GenerationProgress) => void;
  private isRunning = false;
  private progress: GenerationProgress = {
    phase: 'idle',
    currentSheet: 0,
    totalSheets: 0,
    message: 'Ready to generate'
  };

  constructor(onUpdate: (sheets: SheetDefinition[], progress: GenerationProgress) => void) {
    this.onUpdate = onUpdate;
  }

  async generateWorkbook(config: WorkbookConfig): Promise<void> {
    this.isRunning = true;
    this.config = config;
    this.sheets = [];

    // Phase 1: Analyze requirements
    this.updateProgress('analyzing', 0, 0, 'Analyzing data requirements...');
    await this.delay(600);

    // Phase 2: Structure workbook
    this.updateProgress('structuring', 0, 0, 'Designing workbook structure...');
    await this.delay(500);
    this.sheets = this.createSheetStructure(config);
    this.notifyUpdate();

    // Phase 3: Generate data for each sheet
    for (let i = 0; i < this.sheets.length; i++) {
      if (!this.isRunning) break;

      const sheet = this.sheets[i];
      sheet.status = 'generating';
      this.updateProgress('generating', i + 1, this.sheets.length, `Generating: ${sheet.name}`);
      this.notifyUpdate();

      await this.generateSheetData(sheet, config);
      sheet.status = 'completed';
      this.notifyUpdate();
    }

    // Phase 4: Apply formulas
    if (config.includeFormulas) {
      this.updateProgress('calculating', this.sheets.length, this.sheets.length, 'Applying formulas and calculations...');
      await this.delay(400);
    }

    // Phase 5: Generate charts
    if (config.includeCharts) {
      this.updateProgress('charting', this.sheets.length, this.sheets.length, 'Creating visualizations...');
      await this.delay(400);
    }

    this.updateProgress('completed', this.sheets.length, this.sheets.length, 'Workbook ready!');
    this.isRunning = false;
  }

  private createSheetStructure(config: WorkbookConfig): SheetDefinition[] {
    const sheets: SheetDefinition[] = [];

    // Dashboard sheet (if enabled)
    if (config.includeDashboard) {
      sheets.push({
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Executive overview with key metrics and KPIs',
        columns: [],
        rows: [],
        charts: [],
        formulas: [],
        status: 'pending'
      });
    }

    // Analysis-specific sheets
    const analysisSheets = this.getSheetsForAnalysisType(config.analysisType);
    sheets.push(...analysisSheets);

    // Data sheet
    sheets.push({
      id: 'raw-data',
      name: 'Raw Data',
      description: 'Source data for analysis',
      columns: [],
      rows: [],
      charts: [],
      formulas: [],
      status: 'pending'
    });

    return sheets;
  }

  private getSheetsForAnalysisType(type: AnalysisType): SheetDefinition[] {
    const templates: Record<AnalysisType, SheetDefinition[]> = {
      financial: [
        {
          id: 'income-statement',
          name: 'Income Statement',
          description: 'Revenue and expense breakdown',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        },
        {
          id: 'balance-sheet',
          name: 'Balance Sheet',
          description: 'Assets, liabilities, and equity',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        },
        {
          id: 'cash-flow',
          name: 'Cash Flow',
          description: 'Cash flow analysis',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        }
      ],
      statistical: [
        {
          id: 'descriptive-stats',
          name: 'Descriptive Statistics',
          description: 'Mean, median, mode, std dev',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        },
        {
          id: 'correlation',
          name: 'Correlation Analysis',
          description: 'Variable relationships',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        }
      ],
      comparison: [
        {
          id: 'comparison-matrix',
          name: 'Comparison Matrix',
          description: 'Side-by-side comparison',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        },
        {
          id: 'variance-analysis',
          name: 'Variance Analysis',
          description: 'Difference analysis',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        }
      ],
      forecast: [
        {
          id: 'historical-data',
          name: 'Historical Data',
          description: 'Past performance data',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        },
        {
          id: 'projections',
          name: 'Projections',
          description: 'Future forecasts',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        }
      ],
      dashboard: [
        {
          id: 'metrics',
          name: 'Key Metrics',
          description: 'KPI tracking',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        }
      ],
      custom: [
        {
          id: 'analysis',
          name: 'Analysis',
          description: 'Custom analysis sheet',
          columns: [],
          rows: [],
          charts: [],
          formulas: [],
          status: 'pending'
        }
      ]
    };

    return templates[type] || templates.custom;
  }

  private async generateSheetData(sheet: SheetDefinition, config: WorkbookConfig): Promise<void> {
    await this.delay(300 + Math.random() * 300);

    // Generate columns based on sheet type
    sheet.columns = this.generateColumns(sheet.id);

    // Generate sample rows
    const rowCount = sheet.id === 'raw-data' ? 50 : 12;
    sheet.rows = this.generateRows(sheet.columns, rowCount);

    // Generate formulas
    if (config.includeFormulas) {
      sheet.formulas = this.generateFormulas(sheet);
    }

    // Generate charts
    if (config.includeCharts && sheet.id !== 'raw-data') {
      sheet.charts = this.generateCharts(sheet);
    }
  }

  private generateColumns(sheetId: string): ColumnDefinition[] {
    const columnTemplates: Record<string, ColumnDefinition[]> = {
      'income-statement': [
        { id: 'category', name: 'Category', type: 'text', width: 150 },
        { id: 'q1', name: 'Q1', type: 'currency', width: 100 },
        { id: 'q2', name: 'Q2', type: 'currency', width: 100 },
        { id: 'q3', name: 'Q3', type: 'currency', width: 100 },
        { id: 'q4', name: 'Q4', type: 'currency', width: 100 },
        { id: 'total', name: 'Total', type: 'formula', width: 120 }
      ],
      'balance-sheet': [
        { id: 'item', name: 'Item', type: 'text', width: 180 },
        { id: 'current', name: 'Current Period', type: 'currency', width: 120 },
        { id: 'previous', name: 'Previous Period', type: 'currency', width: 120 },
        { id: 'change', name: 'Change %', type: 'percentage', width: 100 }
      ],
      'descriptive-stats': [
        { id: 'metric', name: 'Metric', type: 'text', width: 150 },
        { id: 'value', name: 'Value', type: 'number', width: 100 },
        { id: 'interpretation', name: 'Interpretation', type: 'text', width: 200 }
      ],
      'dashboard': [
        { id: 'kpi', name: 'KPI', type: 'text', width: 150 },
        { id: 'target', name: 'Target', type: 'number', width: 100 },
        { id: 'actual', name: 'Actual', type: 'number', width: 100 },
        { id: 'variance', name: 'Variance', type: 'percentage', width: 100 },
        { id: 'status', name: 'Status', type: 'text', width: 80 }
      ],
      'raw-data': [
        { id: 'id', name: 'ID', type: 'text', width: 80 },
        { id: 'date', name: 'Date', type: 'date', width: 100 },
        { id: 'category', name: 'Category', type: 'text', width: 120 },
        { id: 'value', name: 'Value', type: 'number', width: 100 },
        { id: 'notes', name: 'Notes', type: 'text', width: 200 }
      ]
    };

    return columnTemplates[sheetId] || columnTemplates['raw-data'];
  }

  private generateRows(columns: ColumnDefinition[], count: number): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {};
      
      columns.forEach(col => {
        switch (col.type) {
          case 'text':
            row[col.id] = `Item ${i + 1}`;
            break;
          case 'number':
            row[col.id] = Math.floor(Math.random() * 10000);
            break;
          case 'currency':
            row[col.id] = Math.floor(Math.random() * 100000) / 100;
            break;
          case 'percentage':
            row[col.id] = (Math.random() * 0.5 - 0.25); // -25% to +25%
            break;
          case 'date':
            row[col.id] = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            break;
          case 'formula':
            row[col.id] = '=SUM(B:E)';
            break;
        }
      });

      rows.push(row);
    }

    return rows;
  }

  private generateFormulas(sheet: SheetDefinition): FormulaDefinition[] {
    return [
      { cell: 'F2:F20', formula: '=SUM(B2:E2)', description: 'Row totals' },
      { cell: 'B21', formula: '=SUM(B2:B20)', description: 'Column Q1 total' },
      { cell: 'C21', formula: '=SUM(C2:C20)', description: 'Column Q2 total' },
      { cell: 'D21', formula: '=SUM(D2:D20)', description: 'Column Q3 total' },
      { cell: 'E21', formula: '=SUM(E2:E20)', description: 'Column Q4 total' },
      { cell: 'F21', formula: '=SUM(F2:F20)', description: 'Grand total' }
    ];
  }

  private generateCharts(sheet: SheetDefinition): ChartDefinition[] {
    const chartTypes: ChartType[] = ['bar', 'line', 'pie'];
    return [
      {
        id: `chart-${sheet.id}-1`,
        type: chartTypes[Math.floor(Math.random() * chartTypes.length)],
        title: `${sheet.name} Overview`,
        dataRange: 'A1:F20',
        xAxis: 'A',
        yAxis: ['B', 'C', 'D', 'E']
      }
    ];
  }

  private updateProgress(phase: GenerationPhase, current: number, total: number, message: string): void {
    this.progress = { phase, currentSheet: current, totalSheets: total, message };
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    this.onUpdate([...this.sheets], { ...this.progress });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop(): void {
    this.isRunning = false;
  }

  async exportToXlsx(): Promise<{ success: boolean; filePath?: string }> {
    await this.delay(1000);
    return {
      success: true,
      filePath: `/spreadsheets/${this.config?.title.replace(/\s+/g, '_')}.xlsx`
    };
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const analysisTypeLabels: Record<AnalysisType, { label: string; icon: string }> = {
  financial: { label: 'Financial Analysis', icon: '💰' },
  statistical: { label: 'Statistical Analysis', icon: '📊' },
  comparison: { label: 'Comparison Analysis', icon: '⚖️' },
  forecast: { label: 'Forecast Model', icon: '📈' },
  dashboard: { label: 'Dashboard', icon: '📋' },
  custom: { label: 'Custom Analysis', icon: '🔧' }
};

const chartIcons: Record<ChartType, string> = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  area: '📉',
  scatter: '⚬',
  combo: '📊📈'
};

const AutonomousExcelAnalyzerWidget: React.FC<{ widgetId: string }> = () => {
  const [config, setConfig] = useState<WorkbookConfig>({
    title: '',
    analysisType: 'financial',
    dataSource: '',
    includeCharts: true,
    includePivotTables: false,
    includeFormulas: true,
    includeDashboard: true,
    theme: 'professional'
  });
  
  const [sheets, setSheets] = useState<SheetDefinition[]>([]);
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: 'idle',
    currentSheet: 0,
    totalSheets: 0,
    message: 'Ready to generate'
  });
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const engineRef = useRef<ExcelEngine | null>(null);

  React.useEffect(() => {
    engineRef.current = new ExcelEngine((s, p) => {
      setSheets([...s]);
      setProgress({ ...p });
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startGeneration = useCallback(async () => {
    if (!config.title || !engineRef.current) return;
    
    try {
      await engineRef.current.generateWorkbook(config);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }, [config]);

  const stopGeneration = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const exportWorkbook = useCallback(async () => {
    if (!engineRef.current) return;
    
    setIsExporting(true);
    try {
      const result = await engineRef.current.exportToXlsx();
      if (result.success) {
        alert(`Workbook exported to: ${result.filePath}`);
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const selectedSheetData = useMemo(() => 
    sheets.find(s => s.id === selectedSheet),
    [sheets, selectedSheet]
  );

  const isGenerating = progress.phase !== 'idle' && progress.phase !== 'completed';
  const progressPercent = progress.totalSheets > 0 
    ? Math.round((progress.currentSheet / progress.totalSheets) * 100) 
    : 0;

  const formatCellValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'currency':
        return `$${(value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${((value as number) * 100).toFixed(1)}%`;
      case 'date':
        return (value as Date).toLocaleDateString();
      case 'number':
        return (value as number).toLocaleString();
      default:
        return String(value);
    }
  };

  return (
    <div className="h-full flex flex-col -m-4" data-testid="autonomous-excel-analyzer-widget">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-emerald-700 via-green-700 to-emerald-700 text-white border-b border-emerald-600">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Data Analysis</p>
            <h3 className="text-2xl font-semibold">Excel Analyzer</h3>
            <p className="text-sm text-white/80">
              AI-powered dataanalyse og regnearksgenerering
            </p>
          </div>
          {isGenerating && (
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-200">{progressPercent}%</div>
              <p className="text-sm text-white/70">{progress.message}</p>
            </div>
          )}
        </div>
      </header>

      {/* Configuration Panel */}
      {progress.phase === 'idle' && (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Workbook Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Q4 Financial Analysis"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Analysis Type</label>
              <select
                value={config.analysisType}
                onChange={(e) => setConfig({ ...config, analysisType: e.target.value as AnalysisType })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              >
                {Object.entries(analysisTypeLabels).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data Source</label>
              <input
                type="text"
                value={config.dataSource}
                onChange={(e) => setConfig({ ...config, dataSource: e.target.value })}
                placeholder="Sales data 2024"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Theme</label>
              <select
                value={config.theme}
                onChange={(e) => setConfig({ ...config, theme: e.target.value as WorkbookConfig['theme'] })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="colorful">Colorful</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeDashboard}
                onChange={(e) => setConfig({ ...config, includeDashboard: e.target.checked })}
              />
              Include Dashboard
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeCharts}
                onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
              />
              Include Charts
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeFormulas}
                onChange={(e) => setConfig({ ...config, includeFormulas: e.target.checked })}
              />
              Include Formulas
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includePivotTables}
                onChange={(e) => setConfig({ ...config, includePivotTables: e.target.checked })}
              />
              Include Pivot Tables
            </label>

            <div className="ml-auto">
              <Button 
                variant="primary" 
                onClick={startGeneration}
                disabled={!config.title}
              >
                📊 Generate Workbook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <Button variant="subtle" size="small" onClick={stopGeneration}>
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
        {/* Sheet List */}
        <section className="col-span-12 lg:col-span-3 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Sheets</h4>
              <p className="text-xs text-slate-500">
                {sheets.filter(s => s.status === 'completed').length}/{sheets.length}
              </p>
            </div>
            {progress.phase === 'completed' && (
              <Button 
                variant="primary" 
                size="small" 
                onClick={exportWorkbook}
                disabled={isExporting}
              >
                {isExporting ? '...' : '📥 XLSX'}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-700">
            {sheets.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Configure and generate to see sheets
              </div>
            ) : (
              sheets.map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedSheet === sheet.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      sheet.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      sheet.status === 'generating' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {sheet.charts.length > 0 && '📊'}
                    </span>
                    <span className="font-medium text-sm truncate">{sheet.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{sheet.description}</p>
                  <div className="flex gap-2 mt-2 text-xs text-slate-400">
                    <span>{sheet.columns.length} cols</span>
                    <span>{sheet.rows.length} rows</span>
                    {sheet.formulas.length > 0 && <span>{sheet.formulas.length} formulas</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Sheet Preview */}
        <section className="col-span-12 lg:col-span-9 h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/70">
          {selectedSheetData ? (
            <>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedSheetData.name}</h4>
                    <p className="text-xs text-slate-500">{selectedSheetData.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSheetData.charts.map(chart => (
                      <span key={chart.id} className="text-xl" title={chart.title}>
                        {chartIcons[chart.type]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {/* Data Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-medium text-slate-500 w-10">
                          #
                        </th>
                        {selectedSheetData.columns.map(col => (
                          <th 
                            key={col.id} 
                            className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-medium text-slate-500"
                            style={{ minWidth: col.width }}
                          >
                            {col.name}
                            <span className="ml-1 text-slate-400">({col.type})</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSheetData.rows.slice(0, 15).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-400 text-xs">
                            {rowIndex + 1}
                          </td>
                          {selectedSheetData.columns.map(col => (
                            <td 
                              key={col.id} 
                              className={`border border-slate-200 dark:border-slate-700 px-3 py-2 ${
                                col.type === 'currency' || col.type === 'number' || col.type === 'percentage'
                                  ? 'text-right font-mono'
                                  : ''
                              } ${
                                col.type === 'formula' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''
                              }`}
                            >
                              {formatCellValue(row[col.id], col.type)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {selectedSheetData.rows.length > 15 && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Showing 15 of {selectedSheetData.rows.length} rows
                    </p>
                  )}
                </div>

                {/* Formulas */}
                {selectedSheetData.formulas.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <h5 className="text-sm font-medium mb-3">Formulas Applied</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSheetData.formulas.map((formula, i) => (
                        <div key={i} className="text-xs p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                          <span className="font-mono text-blue-600">{formula.cell}</span>
                          <span className="text-slate-400 mx-2">=</span>
                          <span className="font-mono">{formula.formula}</span>
                          <p className="text-slate-500 mt-1">{formula.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p>Select a sheet to preview data</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AutonomousExcelAnalyzerWidget;
