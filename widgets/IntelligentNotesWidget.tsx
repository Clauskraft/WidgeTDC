import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';

type NoteSource = 'Microsoft OneNote' | 'Google Keep' | 'Apple Notes' | 'Evernote' | 'Local Files' | 'Email';

type ComplianceStatus = 'clean' | 'review' | 'restricted';

interface NoteRecord {
  id: string;
  source: NoteSource;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
  owner: string;
  compliance: ComplianceStatus;
  retention: '30d' | '90d' | '1y' | 'archive';
  riskScore: number;
  attachments: number;
}

const SOURCE_OPTIONS: NoteSource[] = [
  'Microsoft OneNote',
  'Google Keep',
  'Apple Notes',
  'Evernote',
  'Local Files',
  'Email'
];

const SAMPLE_NOTES: NoteRecord[] = [
  {
    id: 'nt-1',
    source: 'Microsoft OneNote',
    title: 'Q4 Strategy Workshop',
    body: 'Collected workshop notes covering AI procurement roadmap, stakeholder interviews and deliverables for DG CONNECT.',
    tags: ['strategy', 'ai', 'eu'],
    updatedAt: '2025-02-10T09:30:00Z',
    owner: 'A. Rossi',
    compliance: 'clean',
    retention: '1y',
    riskScore: 12,
    attachments: 3,
  },
  {
    id: 'nt-2',
    source: 'Google Keep',
    title: 'Privacy Task Force recap',
    body: 'Summary of Schrems II mitigation controls, DPA template updates and DPIA workflow automation ideas.',
    tags: ['privacy', 'gdpr'],
    updatedAt: '2025-02-09T14:20:00Z',
    owner: 'K. Jensen',
    compliance: 'review',
    retention: '90d',
    riskScore: 58,
    attachments: 1,
  },
  {
    id: 'nt-3',
    source: 'Local Files',
    title: 'Field research scans',
    body: 'Offline PDFs captured from site inspections in Munich and Ghent. Contains photos, transcripts and checklists.',
    tags: ['inspection', 'pdf'],
    updatedAt: '2025-02-07T07:15:00Z',
    owner: 'M. Novak',
    compliance: 'restricted',
    retention: '30d',
    riskScore: 83,
    attachments: 12,
  },
  {
    id: 'nt-4',
    source: 'Email',
    title: 'Bid coaching thread',
    body: 'Email notes exchanged with supplier consortium clarifying KPIs, SOW split and legal guardrails.',
    tags: ['bid', 'procurement'],
    updatedAt: '2025-02-11T18:40:00Z',
    owner: 'L. Ruíz',
    compliance: 'review',
    retention: '1y',
    riskScore: 46,
    attachments: 2,
  },
  {
    id: 'nt-5',
    source: 'Evernote',
    title: 'Incident Post-Mortem',
    body: 'Voice memo transcription summarizing containment timeline, threat intel links and RCA decisions.',
    tags: ['security', 'incident'],
    updatedAt: '2025-02-05T11:05:00Z',
    owner: 'J. Olofsson',
    compliance: 'clean',
    retention: '1y',
    riskScore: 28,
    attachments: 0,
  },
];

const complianceLabels: Record<ComplianceStatus, { label: string; color: string }> = {
  clean: { label: 'Ingen findings', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
  review: { label: 'Kræver review', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
  restricted: { label: 'Restriktioner', color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
};

const retentionLabel: Record<NoteRecord['retention'], string> = {
  '30d': '30 dage',
  '90d': '90 dage',
  '1y': '1 år',
  'archive': 'Arkiv',
};

const IntelligentNotesWidget: React.FC<{ widgetId: string }> = () => {
  const [query, setQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<NoteSource>>(new Set(SOURCE_OPTIONS));
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [retentionFilter, setRetentionFilter] = useState<NoteRecord['retention'] | 'all'>('all');

  const filteredNotes = useMemo(() => {
    return SAMPLE_NOTES.filter(note => {
      const matchesSource = selectedSources.has(note.source);
      const matchesQuery = `${note.title} ${note.body} ${note.tags.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFlag = !flaggedOnly || note.compliance !== 'clean';
      const matchesRetention = retentionFilter === 'all' || note.retention === retentionFilter;
      return matchesSource && matchesQuery && matchesFlag && matchesRetention;
    });
  }, [query, selectedSources, flaggedOnly, retentionFilter]);

  const summary = useMemo(() => {
    const distribution = SOURCE_OPTIONS.reduce<Record<NoteSource, number>>((acc, source) => {
      acc[source] = SAMPLE_NOTES.filter(note => note.source === source).length;
      return acc;
    }, {} as Record<NoteSource, number>);

    const flagged = SAMPLE_NOTES.filter(note => note.compliance !== 'clean');
    const avgRisk = SAMPLE_NOTES.reduce((sum, note) => sum + note.riskScore, 0) / SAMPLE_NOTES.length;

    return { distribution, flagged: flagged.length, avgRisk: Math.round(avgRisk) };
  }, []);

  const aiInsights = useMemo(() => {
    if (filteredNotes.length === 0) {
      return 'Ingen noter matcher filtrene lige nu.';
    }
    const highestRisk = [...filteredNotes].sort((a, b) => b.riskScore - a.riskScore)[0];
    const thematicTags = new Map<string, number>();
    filteredNotes.forEach(note => {
      note.tags.forEach(tag => {
        thematicTags.set(tag, (thematicTags.get(tag) || 0) + 1);
      });
    });
    const topTags = [...thematicTags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([tag]) => tag);
    return `Fokusområder: ${topTags.join(', ') || 'n/a'}. Højeste risikonote er "${highestRisk.title}" fra ${highestRisk.source} med score ${highestRisk.riskScore}.`;
  }, [filteredNotes]);

  const toggleSource = (source: NoteSource) => {
    setSelectedSources(prev => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col -m-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
        <h3 className="text-lg font-semibold">Intelligent Notes Aggregator</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Saml noter på tværs af OneNote, Keep, Apple Notes, Evernote, lokale filer og mails med automatisk compliance scanning.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-xs">Total noter</p>
            <p className="text-2xl font-semibold">{SAMPLE_NOTES.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-xs">Flaggede</p>
            <p className="text-2xl font-semibold text-amber-600">{summary.flagged}</p>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-xs">Gns. risiko</p>
            <p className="text-2xl font-semibold">{summary.avgRisk}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-auto">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 block mb-1">Søg</label>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Søg på tværs af alle kilder..."
              className="ms-focusable w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Retention</label>
            <select
              value={retentionFilter}
              onChange={e => setRetentionFilter(e.target.value as any)}
              className="ms-focusable px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="all">Alle perioder</option>
              <option value="30d">30 dage</option>
              <option value="90d">90 dage</option>
              <option value="1y">1 år</option>
              <option value="archive">Arkiv</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-200">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={() => setFlaggedOnly(v => !v)}
              className="ms-focusable rounded border-gray-300"
            />
            Kun noter med fund
          </label>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Kilder</p>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map(source => {
              const isActive = selectedSources.has(source);
              return (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`ms-focusable px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {source}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">AI indblik</p>
          <p className="text-sm mt-2 text-gray-800 dark:text-gray-200">{aiInsights}</p>
        </div>

        <div className="space-y-3">
          {filteredNotes.map(note => {
            const compliance = complianceLabels[note.compliance];
            return (
              <div
                key={note.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className="text-xs text-gray-500">
                      {note.source} • Opdateret {new Date(note.updatedAt).toLocaleDateString()} • {note.owner}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${compliance.color}`}>
                    {compliance.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-3 line-clamp-2">{note.body}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                  {note.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200">
                      #{tag}
                    </span>
                  ))}
                  <span className="text-gray-500">Retention: {retentionLabel[note.retention]}</span>
                  <span className="text-gray-500">Risiko: {note.riskScore}</span>
                  <span className="text-gray-500">Bilag: {note.attachments}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" size="small">Åbn kilde</Button>
                  <Button variant="subtle" size="small">Del sikkert</Button>
                  <Button variant="subtle" size="small">Flag til compliance</Button>
                </div>
              </div>
            );
          })}
          {filteredNotes.length === 0 && (
            <div className="p-6 border border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-500">
              Ingen noter matcher dine filtre.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligentNotesWidget;
