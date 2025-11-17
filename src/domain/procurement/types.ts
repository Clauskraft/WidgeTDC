/**
 * Procurement Intelligence Domain Types
 *
 * Enterprise procurement intelligence supporting EU tender monitoring,
 * bid management, supplier assessment, and market analysis.
 */

/**
 * Tender source
 */
export type TenderSource = 'TED' | 'national' | 'industry' | 'private';

/**
 * Tender status
 */
export type TenderStatus = 'open' | 'closing-soon' | 'closed' | 'awarded' | 'cancelled';

/**
 * Procurement procedure type
 */
export type ProcedureType =
  | 'open'
  | 'restricted'
  | 'competitive-dialogue'
  | 'negotiated'
  | 'innovation-partnership';

/**
 * Tender identifier
 */
export type TenderId = string;

/**
 * Supplier identifier
 */
export type SupplierId = string;

/**
 * Tender opportunity
 */
export interface TenderOpportunity {
  /** Unique tender identifier */
  id: TenderId;

  /** Tender title */
  title: string;

  /** Tender description */
  description: string;

  /** Source of the tender */
  source: TenderSource;

  /** Source-specific ID (e.g., TED notice number) */
  sourceId: string;

  /** Contracting authority */
  authority: {
    name: string;
    country: string;
    region?: string;
  };

  /** Tender status */
  status: TenderStatus;

  /** Procedure type */
  procedureType: ProcedureType;

  /** Estimated value (EUR) */
  estimatedValue?: number;

  /** CPV codes (Common Procurement Vocabulary) */
  cpvCodes: string[];

  /** Publication date */
  publishedAt: Date;

  /** Submission deadline */
  deadline: Date;

  /** Contract start date */
  contractStart?: Date;

  /** Contract duration (months) */
  contractDuration?: number;

  /** Document links */
  documents?: Array<{
    title: string;
    url: string;
    type: string;
  }>;

  /** Contact information */
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  /** Relevance score (0-100) */
  relevanceScore?: number;

  /** Tags */
  tags?: string[];
}

/**
 * Bid status
 */
export type BidStatus =
  | 'draft'
  | 'in-preparation'
  | 'review'
  | 'submitted'
  | 'shortlisted'
  | 'awarded'
  | 'rejected'
  | 'withdrawn';

/**
 * Bid identifier
 */
export type BidId = string;

/**
 * Bid information
 */
export interface Bid {
  /** Unique bid identifier */
  id: BidId;

  /** Associated tender */
  tenderId: TenderId;

  /** Bid title */
  title: string;

  /** Bid status */
  status: BidStatus;

  /** Bid value (EUR) */
  value?: number;

  /** Preparation progress (0-100) */
  progress: number;

  /** Team members */
  team?: Array<{
    id: string;
    name: string;
    role: string;
  }>;

  /** Key dates */
  dates: {
    created: Date;
    deadline: Date;
    submitted?: Date;
  };

  /** Documents */
  documents?: Array<{
    title: string;
    status: 'pending' | 'complete';
    url?: string;
  }>;

  /** Win probability (0-100) */
  winProbability?: number;

  /** Notes */
  notes?: string;
}

/**
 * Supplier risk level
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Supplier information
 */
export interface Supplier {
  /** Unique supplier identifier */
  id: SupplierId;

  /** Supplier name */
  name: string;

  /** Country */
  country: string;

  /** Registration number */
  registrationNumber?: string;

  /** Industry sectors */
  sectors: string[];

  /** Risk assessment */
  risk: {
    level: RiskLevel;
    factors: string[];
    lastAssessedAt: Date;
  };

  /** Performance rating (0-5) */
  performanceRating?: number;

  /** Financial health score (0-100) */
  financialScore?: number;

  /** Certifications */
  certifications?: string[];

  /** Past contracts */
  contracts?: Array<{
    title: string;
    value: number;
    completedAt: Date;
    rating: number;
  }>;

  /** Contact information */
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

/**
 * Tender query
 */
export interface TenderQuery {
  /** Text search query */
  query?: string;

  /** Filter by source */
  source?: TenderSource | TenderSource[];

  /** Filter by status */
  status?: TenderStatus | TenderStatus[];

  /** Filter by country */
  country?: string | string[];

  /** Filter by CPV codes */
  cpvCodes?: string[];

  /** Minimum estimated value (EUR) */
  minValue?: number;

  /** Maximum estimated value (EUR) */
  maxValue?: number;

  /** Deadline range */
  deadlineRange?: {
    from: Date;
    to: Date;
  };

  /** Minimum relevance score */
  minRelevance?: number;

  /** Sort by */
  sortBy?: 'publishedAt' | 'deadline' | 'estimatedValue' | 'relevanceScore';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Maximum results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Procurement statistics
 */
export interface ProcurementStatistics {
  /** Total active tenders */
  activeTenders: number;

  /** Tenders by source */
  tendersBySource: Record<TenderSource, number>;

  /** Total bids */
  totalBids: number;

  /** Bids by status */
  bidsByStatus: Record<BidStatus, number>;

  /** Win rate (percentage) */
  winRate: number;

  /** Average bid value (EUR) */
  averageBidValue: number;

  /** Total suppliers */
  totalSuppliers: number;

  /** High-risk suppliers */
  highRiskSuppliers: number;
}

/**
 * Market trend
 */
export interface MarketTrend {
  /** Trend category */
  category: string;

  /** Trend description */
  description: string;

  /** Trend direction */
  direction: 'up' | 'down' | 'stable';

  /** Change percentage */
  changePercentage: number;

  /** Period */
  period: string;

  /** Data points */
  dataPoints?: Array<{
    date: Date;
    value: number;
  }>;
}

/**
 * Procurement Intelligence Service interface
 *
 * Manages tender monitoring, bid preparation, supplier assessment,
 * and market intelligence.
 */
export interface ProcurementIntelligenceService {
  /**
   * Get a tender by ID
   * @param id Tender ID
   * @returns Tender or undefined if not found
   */
  getTender(id: TenderId): Promise<TenderOpportunity | undefined>;

  /**
   * Search tenders
   * @param query Search query
   * @returns Array of matching tenders
   */
  searchTenders(query: TenderQuery): Promise<TenderOpportunity[]>;

  /**
   * Get a bid by ID
   * @param id Bid ID
   * @returns Bid or undefined if not found
   */
  getBid(id: BidId): Promise<Bid | undefined>;

  /**
   * List all bids
   * @param filters Optional filters
   * @returns Array of bids
   */
  listBids(filters?: { status?: BidStatus | BidStatus[]; tenderId?: TenderId }): Promise<Bid[]>;

  /**
   * Create a new bid
   * @param bid Bid to create (without ID and timestamps)
   * @returns Created bid
   */
  createBid(bid: Omit<Bid, 'id' | 'dates'>): Promise<Bid>;

  /**
   * Update a bid
   * @param id Bid ID
   * @param updates Partial bid updates
   * @returns Updated bid
   */
  updateBid(id: BidId, updates: Partial<Omit<Bid, 'id'>>): Promise<Bid>;

  /**
   * Get a supplier by ID
   * @param id Supplier ID
   * @returns Supplier or undefined if not found
   */
  getSupplier(id: SupplierId): Promise<Supplier | undefined>;

  /**
   * List suppliers
   * @param filters Optional filters
   * @returns Array of suppliers
   */
  listSuppliers(filters?: {
    country?: string;
    riskLevel?: RiskLevel;
    sector?: string;
  }): Promise<Supplier[]>;

  /**
   * Assess supplier risk
   * @param supplierId Supplier ID
   * @returns Updated supplier with risk assessment
   */
  assessSupplierRisk(supplierId: SupplierId): Promise<Supplier>;

  /**
   * Get procurement statistics
   * @returns Statistics summary
   */
  getStatistics(): Promise<ProcurementStatistics>;

  /**
   * Get market trends
   * @param category Optional category filter
   * @returns Array of market trends
   */
  getMarketTrends(category?: string): Promise<MarketTrend[]>;

  /**
   * Monitor tender sources for new opportunities
   * @returns Number of new tenders found
   */
  monitorTenderSources(): Promise<number>;

  /**
   * Generate bid preparation checklist
   * @param tenderId Tender ID
   * @returns Checklist items
   */
  generateBidChecklist(tenderId: TenderId): Promise<string[]>;
}
