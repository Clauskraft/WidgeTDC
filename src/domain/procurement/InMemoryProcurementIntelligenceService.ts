/**
 * In-Memory Procurement Intelligence Service
 * 
 * Development implementation of ProcurementIntelligenceService
 */

import type {
  ProcurementIntelligenceService,
  TenderOpportunity,
  TenderId,
  TenderQuery,
  Bid,
  BidId,
  BidStatus,
  Supplier,
  SupplierId,
  RiskLevel,
  ProcurementStatistics,
  MarketTrend,
} from './types';

export class InMemoryProcurementIntelligenceService implements ProcurementIntelligenceService {
  private tenders: Map<TenderId, TenderOpportunity> = new Map();
  private bids: Map<BidId, Bid> = new Map();
  private suppliers: Map<SupplierId, Supplier> = new Map();
  private tenderCounter = 0;
  private bidCounter = 0;

  private generateTenderId(): TenderId {
    return `TND${String(++this.tenderCounter).padStart(8, '0')}`;
  }

  private generateBidId(): BidId {
    return `BID${String(++this.bidCounter).padStart(8, '0')}`;
  }

  async getTender(id: TenderId): Promise<TenderOpportunity | undefined> {
    return this.tenders.get(id);
  }

  async searchTenders(query: TenderQuery): Promise<TenderOpportunity[]> {
    let results = Array.from(this.tenders.values());

    // Filter by source
    if (query.source) {
      const sources = Array.isArray(query.source) ? query.source : [query.source];
      results = results.filter(t => sources.includes(t.source));
    }

    // Filter by status
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      results = results.filter(t => statuses.includes(t.status));
    }

    // Filter by country
    if (query.country) {
      const countries = Array.isArray(query.country) ? query.country : [query.country];
      results = results.filter(t => countries.includes(t.authority.country));
    }

    // Filter by CPV codes
    if (query.cpvCodes && query.cpvCodes.length > 0) {
      results = results.filter(t => 
        t.cpvCodes.some(code => query.cpvCodes!.includes(code))
      );
    }

    // Filter by value range
    if (query.minValue !== undefined) {
      results = results.filter(t => t.estimatedValue && t.estimatedValue >= query.minValue!);
    }

    if (query.maxValue !== undefined) {
      results = results.filter(t => t.estimatedValue && t.estimatedValue <= query.maxValue!);
    }

    // Filter by deadline range
    if (query.deadlineRange) {
      const { from, to } = query.deadlineRange;
      results = results.filter(t => {
        const deadline = t.deadline.getTime();
        return deadline >= from.getTime() && deadline <= to.getTime();
      });
    }

    // Filter by relevance score
    if (query.minRelevance !== undefined) {
      results = results.filter(t => t.relevanceScore && t.relevanceScore >= query.minRelevance!);
    }

    // Text search
    if (query.query) {
      const searchLower = query.query.toLowerCase();
      results = results.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortBy = query.sortBy || 'publishedAt';
    const sortDirection = query.sortDirection || 'desc';
    
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'publishedAt':
          comparison = a.publishedAt.getTime() - b.publishedAt.getTime();
          break;
        case 'deadline':
          comparison = a.deadline.getTime() - b.deadline.getTime();
          break;
        case 'estimatedValue':
          comparison = (a.estimatedValue || 0) - (b.estimatedValue || 0);
          break;
        case 'relevanceScore':
          comparison = (a.relevanceScore || 0) - (b.relevanceScore || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  async getBid(id: BidId): Promise<Bid | undefined> {
    return this.bids.get(id);
  }

  async listBids(filters?: { status?: BidStatus | BidStatus[]; tenderId?: TenderId }): Promise<Bid[]> {
    let results = Array.from(this.bids.values());

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      results = results.filter(b => statuses.includes(b.status));
    }

    if (filters?.tenderId) {
      results = results.filter(b => b.tenderId === filters.tenderId);
    }

    return results;
  }

  async createBid(
    bid: Omit<Bid, 'id' | 'dates'> & { deadline?: Date; submitted?: Date }
  ): Promise<Bid> {
    const id = this.generateBidId();
    const now = new Date();
    
    const { deadline, submitted, ...rest } = bid;

    const completeBid: Bid = {
      ...rest,
      id,
      dates: {
        created: now,
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        submitted: submitted,
      },
    };

    this.bids.set(id, completeBid);
    return completeBid;
  }

  async updateBid(id: BidId, updates: Partial<Omit<Bid, 'id'>>): Promise<Bid> {
    const existing = this.bids.get(id);
    if (!existing) {
      throw new Error(`Bid ${id} not found`);
    }

    const updated: Bid = {
      ...existing,
      ...updates,
      id: existing.id,
      dates: {
        ...existing.dates,
        ...(updates.dates || {}),
      },
    };

    this.bids.set(id, updated);
    return updated;
  }

  async getSupplier(id: SupplierId): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async listSuppliers(filters?: { country?: string; riskLevel?: RiskLevel; sector?: string }): Promise<Supplier[]> {
    let results = Array.from(this.suppliers.values());

    if (filters?.country) {
      results = results.filter(s => s.country === filters.country);
    }

    if (filters?.riskLevel) {
      results = results.filter(s => s.risk.level === filters.riskLevel);
    }

    if (filters?.sector) {
      results = results.filter(s => s.sectors.includes(filters.sector));
    }

    return results;
  }

  async assessSupplierRisk(supplierId: SupplierId): Promise<Supplier> {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    // Mock risk assessment
    const riskFactors: string[] = [];
    let riskScore = 0;

    if (!supplier.financialScore || supplier.financialScore < 50) {
      riskFactors.push('Low financial health score');
      riskScore += 30;
    }

    if (!supplier.certifications || supplier.certifications.length === 0) {
      riskFactors.push('No certifications');
      riskScore += 20;
    }

    if (!supplier.performanceRating || supplier.performanceRating < 3) {
      riskFactors.push('Low performance rating');
      riskScore += 25;
    }

    let riskLevel: RiskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';

    const updated: Supplier = {
      ...supplier,
      risk: {
        level: riskLevel,
        factors: riskFactors,
        lastAssessedAt: new Date(),
      },
    };

    this.suppliers.set(supplierId, updated);
    return updated;
  }

  async getStatistics(): Promise<ProcurementStatistics> {
    const tendersBySource: Record<string, number> = {};
    const bidsByStatus: Record<BidStatus, number> = {};
    let totalBidValue = 0;
    let awardedBids = 0;
    let highRiskSuppliers = 0;

    // Count tenders by source
    for (const tender of this.tenders.values()) {
      tendersBySource[tender.source] = (tendersBySource[tender.source] || 0) + 1;
    }

    // Count bids by status and calculate win rate
    for (const bid of this.bids.values()) {
      bidsByStatus[bid.status] = (bidsByStatus[bid.status] || 0) + 1;
      if (bid.value) totalBidValue += bid.value;
      if (bid.status === 'awarded') awardedBids++;
    }

    // Count high-risk suppliers
    for (const supplier of this.suppliers.values()) {
      if (supplier.risk.level === 'high' || supplier.risk.level === 'critical') {
        highRiskSuppliers++;
      }
    }

    const activeTenders = Array.from(this.tenders.values())
      .filter(t => t.status === 'open' || t.status === 'closing-soon')
      .length;

    const totalBids = this.bids.size;
    const winRate = totalBids > 0 ? (awardedBids / totalBids) * 100 : 0;
    const averageBidValue = totalBids > 0 ? totalBidValue / totalBids : 0;

    return {
      activeTenders,
      tendersBySource: tendersBySource as any,
      totalBids,
      bidsByStatus: bidsByStatus as any,
      winRate,
      averageBidValue,
      totalSuppliers: this.suppliers.size,
      highRiskSuppliers,
    };
  }

  async getMarketTrends(category?: string): Promise<MarketTrend[]> {
    // Mock market trends
    const allTrends: MarketTrend[] = [
      {
        category: 'IT Services',
        description: 'Increasing demand for cloud migration services',
        direction: 'up',
        changePercentage: 15.3,
        period: 'Q1 2024',
      },
      {
        category: 'Construction',
        description: 'Infrastructure spending growth',
        direction: 'up',
        changePercentage: 8.7,
        period: 'Q1 2024',
      },
      {
        category: 'Consulting',
        description: 'Stable demand for management consulting',
        direction: 'stable',
        changePercentage: 1.2,
        period: 'Q1 2024',
      },
    ];

    return category 
      ? allTrends.filter(t => t.category === category)
      : allTrends;
  }

  async monitorTenderSources(): Promise<number> {
    // Mock monitoring - in production, this would fetch from TED API, etc.
    return 0; // No new tenders in mock implementation
  }

  async generateBidChecklist(tenderId: TenderId): Promise<string[]> {
    const tender = this.tenders.get(tenderId);
    if (!tender) {
      throw new Error(`Tender ${tenderId} not found`);
    }

    // Generate checklist based on tender
    const checklist = [
      'Review tender documentation',
      'Assess technical requirements',
      'Evaluate financial requirements',
      'Identify team members',
      'Prepare technical proposal',
      'Prepare commercial proposal',
      'Obtain necessary certifications',
      'Prepare references',
      'Review submission requirements',
      'Quality assurance review',
      'Final approval',
      'Submit before deadline',
    ];

    // Add procedure-specific items
    if (tender.procedureType === 'restricted') {
      checklist.splice(1, 0, 'Prepare expression of interest');
    }

    if (tender.procedureType === 'competitive-dialogue') {
      checklist.splice(2, 0, 'Prepare for dialogue phase');
    }

    return checklist;
  }
}
