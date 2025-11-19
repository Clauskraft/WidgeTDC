import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';

type Region = 'EU' | 'Nordic' | 'DACH' | 'Benelux';
type TenderStatus = 'Open' | 'Preparing' | 'Submitted';

type Opportunity = {
  id: string;
  title: string;
  portal: string;
  region: Region;
  budget: number;
  deadline: string;
  category: string;
  status: TenderStatus;
  compliance: 'OK' | 'Needs review';
  owner: string;
};

const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'ted-2025-114',
    title: 'EU Digital Health Platform roll-out',
    portal: 'TED',
    region: 'EU',
    budget: 18.4,
    deadline: '2025-03-18',
    category: 'Digital Services',
    status: 'Preparing',
    compliance: 'Needs review',
    owner: 'Luc Schmidt',
  },
  {
    id: 'no-2025-44',
    title: 'Norway Police AI tender',
    portal: 'Doffin',
    region: 'Nordic',
    budget: 9.1,
    deadline: '2025-02-28',
    category: 'AI & Analytics',
    status: 'Open',
    compliance: 'OK',
    owner: 'Sara Berg',
  },
  {
    id: 'de-2025-09',
    title: 'Bundesbank cyber response retainer',
    portal: 'Bund',
    region: 'DACH',
    budget: 12.6,
    deadline: '2025-03-05',
    category: 'Security',
    status: 'Submitted',
    compliance: 'OK',
    owner: 'Daniel Kühn',
  },
  {
    id: 'be-2025-03',
    title: 'Smart Mobility Corridor Leuven',
    portal: 'Publicprocure',
    region: 'Benelux',
    budget: 6.2,
    deadline: '2025-03-08',
    category: 'Infrastructure',
    status: 'Preparing',
    compliance: 'Needs review',
    owner: 'Emma Celis',
  },
];

const categories = Array.from(new Set(OPPORTUNITIES.map(o => o.category)));
const regions: Region[] = ['EU', 'Nordic', 'DACH', 'Benelux'];

const ProcurementIntelligenceWidget: React.FC<{ widgetId: string }> = () => {
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskOnly, setRiskOnly] = useState(false);

  const filteredOpportunities = useMemo(() => {
    return OPPORTUNITIES.filter(opp => {
      const matchesRegion = regionFilter === 'all' || opp.region === regionFilter;
      const matchesCategory = categoryFilter === 'all' || opp.category === categoryFilter;
      const matchesRisk = !riskOnly || opp.compliance === 'Needs review';
      return matchesRegion && matchesCategory && matchesRisk;
    });
  }, [regionFilter, categoryFilter, riskOnly]);

  const pipeline = useMemo(() => {
    const totals = filteredOpportunities.reduce(
      (acc, opp) => {
        acc.totalBudget += opp.budget;
        acc.count += 1;
        if (opp.status === 'Open') acc.open += 1;
        if (opp.status === 'Preparing') acc.preparing += 1;
        if (opp.status === 'Submitted') acc.submitted += 1;
        return acc;
      },
      { totalBudget: 0, count: 0, open: 0, preparing: 0, submitted: 0 }
    );
    return totals;
  }, [filteredOpportunities]);

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-sky-600 text-white">
        <h3 className="text-lg font-semibold">Procurement Intelligence</h3>
        <p className="text-sm text-white/80">Overvåg EU udbud, tidslinjer og compliance klarhed.</p>
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold">€{pipeline.totalBudget.toFixed(1)}M</p>
            <p className="text-xs uppercase">Pipeline værdi</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{pipeline.count}</p>
            <p className="text-xs uppercase">Aktive sager</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{pipeline.preparing}</p>
            <p className="text-xs uppercase">Forberedelse</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{pipeline.submitted}</p>
            <p className="text-xs uppercase">Indsendt</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <section className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Region</label>
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value as Region | 'all')}
              className="ms-focusable w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
            >
              <option value="all">Hele EU</option>
              {regions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="ms-focusable w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
            >
              <option value="all">Alle kategorier</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 self-end">
            <input
              type="checkbox"
              checked={riskOnly}
              onChange={() => setRiskOnly(v => !v)}
              className="ms-focusable"
            />
            Vis kun sager med compliance-review
          </label>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {regions.map(region => {
            const regionBudget = OPPORTUNITIES.filter(opp => opp.region === region).reduce(
              (sum, opp) => sum + opp.budget,
              0
            );
            return (
              <div
                key={region}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900/40"
              >
                <p className="text-sm font-semibold">{region}</p>
                <p className="text-2xl font-bold">€{regionBudget.toFixed(1)}M</p>
                <p className="text-xs text-gray-500">Aggregeret værdi</p>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          {filteredOpportunities.map(opp => (
            <div
              key={opp.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900/60"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{opp.title}</p>
                  <p className="text-xs text-gray-500">
                    {opp.portal} • {opp.region} • Deadline{' '}
                    {new Date(opp.deadline).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    opp.compliance === 'OK'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {opp.compliance}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                <span>Status: {opp.status}</span>
                <span>Budget: €{opp.budget}M</span>
                <span>Kategori: {opp.category}</span>
                <span>Bid lead: {opp.owner}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" size="small">
                  Åbn tidslinje
                </Button>
                <Button variant="subtle" size="small">
                  Del compliance checklist
                </Button>
                <Button variant="subtle" size="small">
                  Forbered dokumentpakke
                </Button>
              </div>
            </div>
          ))}
          {filteredOpportunities.length === 0 && (
            <div className="p-6 border border-dashed border-gray-300 text-center text-sm text-gray-500 rounded-xl">
              Ingen sager matcher dine filtre.
            </div>
          )}
        </section>

        <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Bid readiness checklist</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-200 space-y-1 list-disc pl-5">
            <li>EU-tilpassede kontraktbilag (ENG + lokal version)</li>
            <li>DPIA & data flow diagram klar</li>
            <li>Supply chain due diligence noter uploadet</li>
            <li>Referenceprogram godkendt af CCO</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default ProcurementIntelligenceWidget;
