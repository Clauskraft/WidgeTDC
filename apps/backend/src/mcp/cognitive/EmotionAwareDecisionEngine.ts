// EmotionAwareDecisionEngine – Phase 1 Week 3
// Multi-modal decision making with emotional awareness

import { PalRepository } from '../../services/pal/palRepository.js';
import { unifiedMemorySystem } from './UnifiedMemorySystem.js';
import { McpContext } from '@widget-tdc/mcp-types';
import { QueryIntent } from '../autonomous/DecisionEngine.js';

export interface EmotionalState {
    stress: 'low' | 'medium' | 'high';
    focus: 'shallow' | 'medium' | 'deep';
    energy: 'low' | 'medium' | 'high';
    mood: 'negative' | 'neutral' | 'positive';
}

export interface Action {
    complexity: 'low' | 'medium' | 'high';
    estimatedTime: number; // milliseconds
    depth: 'low' | 'medium' | 'high';
    requiresFocus: boolean;
}

export interface Decision {
    action: Action;
    confidence: number;
    reasoning: string;
    emotionalFit: number;
    dataQuality: number;
    contextRelevance: number;
}

export class EmotionAwareDecisionEngine {
    private palRepo: PalRepository;

    constructor() {
        this.palRepo = new PalRepository();
    }

    /**
     * Make emotion-aware decision based on query, emotional state, and context
     */
    async makeDecision(
        query: string | QueryIntent,
        ctx: McpContext
    ): Promise<Decision> {
        // Get emotional state from PAL
        const emotionalState = await this.getEmotionalState(ctx.userId, ctx.orgId);

        // Normalize query: if QueryIntent, convert to string representation; if string, use as-is
        const queryStr = typeof query === 'string' 
            ? query 
            : `${query.operation || query.type} ${query.domain || ''} ${JSON.stringify(query.params || {})}`.trim();

        // Convert to QueryIntent for methods that need structured data
        const queryIntent: QueryIntent = typeof query === 'string'
            ? {
                type: 'query',
                domain: 'general',
                operation: 'search',
                params: { query: queryStr }
            }
            : query;

        // Evaluate multi-modal scores
        const dataScore = await this.evaluateDataQuality(queryIntent, ctx);
        const emotionScore = this.evaluateEmotionalFit(this.queryToAction(queryIntent), emotionalState);
        const contextScore = await this.evaluateContextRelevance(queryIntent, ctx);

        // Calculate dynamic weights based on emotional state
        const weights = this.calculateDynamicWeights(emotionalState);

        // Fuse scores with weights
        const fusedScore = this.fusionDecision(
            {
                data: dataScore,
                emotion: emotionScore,
                context: contextScore
            },
            weights
        );

        // Determine action complexity based on emotional state
        const action = this.determineOptimalAction(queryIntent, emotionalState);

        return {
            action,
            confidence: fusedScore,
            reasoning: this.generateReasoning(emotionalState, dataScore, emotionScore, contextScore),
            emotionalFit: emotionScore,
            dataQuality: dataScore,
            contextRelevance: contextScore,
            emotionalState
        };
    }

    /**
     * Get emotional state from PAL repository
     */
    private async getEmotionalState(userId: string, orgId: string): Promise<EmotionalState> {
        try {
            // Get recent PAL events to infer emotional state
            const recentEvents = this.palRepo.getRecentEvents(userId, orgId, 10);
            
            // Analyze events for stress indicators
            let stressLevel: 'low' | 'medium' | 'high' = 'low';
            let focusLevel: 'shallow' | 'medium' | 'deep' = 'medium';
            let energyLevel: 'low' | 'medium' | 'high' = 'medium';
            let mood: 'negative' | 'neutral' | 'positive' = 'neutral';

            if (Array.isArray(recentEvents)) {
                const stressEvents = recentEvents.filter((e: any) => 
                    e.event_type === 'stress' || e.detected_stress_level
                );
                
                if (stressEvents.length > 0) {
                    const avgStress = stressEvents.reduce((sum: number, e: any) => {
                        const level = e.detected_stress_level || e.stress_level || 0;
                        return sum + level;
                    }, 0) / stressEvents.length;

                    if (avgStress > 7) stressLevel = 'high';
                    else if (avgStress > 4) stressLevel = 'medium';
                }

                // Check focus windows
                const focusWindows = this.palRepo.getFocusWindows(userId, orgId);
                const now = new Date();
                const currentHour = now.getHours();
                const currentDay = now.getDay();

                const inFocusWindow = focusWindows.some((fw: any) => 
                    fw.weekday === currentDay &&
                    currentHour >= fw.start_hour &&
                    currentHour < fw.end_hour
                );

                if (inFocusWindow) {
                    focusLevel = 'deep';
                }
            }

            return {
                stress: stressLevel,
                focus: focusLevel,
                energy: energyLevel,
                mood
            };
        } catch (error) {
            console.warn('Failed to get emotional state, using defaults:', error);
            return {
                stress: 'low',
                focus: 'medium',
                energy: 'medium',
                mood: 'neutral'
            };
        }
    }

    /**
     * Evaluate data quality score
     */
    private async evaluateDataQuality(query: QueryIntent, ctx: McpContext): Promise<number> {
        try {
            // Check system health - healthy systems provide better data
            const health = await unifiedMemorySystem.analyzeSystemHealth();
            const baseScore = health.globalHealth;

            // Adjust based on query complexity
            const complexity = this.estimateQueryComplexity(query);
            const complexityPenalty = complexity === 'high' ? 0.1 : complexity === 'medium' ? 0.05 : 0;

            return Math.max(0, Math.min(1, baseScore - complexityPenalty));
        } catch {
            return 0.8; // Default good score
        }
    }

    /**
     * Evaluate emotional fit of action
     */
    private evaluateEmotionalFit(action: Action, emotion: EmotionalState): number {
        let score = 0.5; // Base neutral score

        // Stress-aware routing
        if (emotion.stress === 'high') {
            // Prefer simple, fast actions
            if (action.complexity === 'low' && action.estimatedTime < 1000) {
                score = 1.0;
            } else if (action.complexity === 'high') {
                score = 0.2;
            } else {
                score = 0.6;
            }
        } else if (emotion.stress === 'low') {
            // Can handle more complexity
            if (action.complexity === 'high' && action.depth === 'high') {
                score = 0.9;
            } else {
                score = 0.7;
            }
        }

        // Focus-aware routing
        if (emotion.focus === 'deep') {
            // Allow complex, deep tasks
            if (action.depth === 'high' && action.requiresFocus) {
                score = Math.max(score, 1.0);
            }
        } else if (emotion.focus === 'shallow') {
            // Prefer simpler tasks
            if (action.complexity === 'high') {
                score = Math.min(score, 0.4);
            }
        }

        // Energy-aware routing
        if (emotion.energy === 'low') {
            // Prefer low-effort tasks
            if (action.complexity === 'low' && action.estimatedTime < 500) {
                score = Math.max(score, 0.9);
            } else {
                score = Math.min(score, 0.6);
            }
        }

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Evaluate context relevance
     */
    private async evaluateContextRelevance(query: QueryIntent, ctx: McpContext): Promise<number> {
        try {
            // Check if query matches recent patterns
            const patterns = await unifiedMemorySystem.findHolographicPatterns(ctx);
            
            const queryText = JSON.stringify(query).toLowerCase();
            const relevantPatterns = patterns.filter((p: any) => {
                const patternText = JSON.stringify(p).toLowerCase();
                return queryText.includes(p.keyword?.toLowerCase() || '');
            });

            // More relevant patterns = higher score
            return Math.min(1, 0.5 + (relevantPatterns.length * 0.1));
        } catch {
            return 0.7; // Default good relevance
        }
    }

    /**
     * Calculate dynamic weights based on emotional state
     */
    private calculateDynamicWeights(emotion: EmotionalState): {
        data: number;
        emotion: number;
        context: number;
    } {
        // Base weights
        let dataWeight = 0.4;
        let emotionWeight = 0.3;
        let contextWeight = 0.3;

        // Adjust weights based on stress
        if (emotion.stress === 'high') {
            // Prioritize emotional fit when stressed
            emotionWeight = 0.5;
            dataWeight = 0.3;
            contextWeight = 0.2;
        } else if (emotion.stress === 'low') {
            // Prioritize data quality when relaxed
            dataWeight = 0.5;
            emotionWeight = 0.2;
            contextWeight = 0.3;
        }

        // Normalize
        const total = dataWeight + emotionWeight + contextWeight;
        return {
            data: dataWeight / total,
            emotion: emotionWeight / total,
            context: contextWeight / total
        };
    }

    /**
     * Fuse scores with weights
     */
    private fusionDecision(
        scores: { data: number; emotion: number; context: number },
        weights: { data: number; emotion: number; context: number }
    ): number {
        return (
            scores.data * weights.data +
            scores.emotion * weights.emotion +
            scores.context * weights.context
        );
    }

    /**
     * Determine optimal action based on query and emotional state
     */
    private determineOptimalAction(query: QueryIntent, emotion: EmotionalState): Action {
        // Estimate complexity from query
        const complexity = this.estimateQueryComplexity(query);
        
        // Estimate time (placeholder - would be more sophisticated)
        const estimatedTime = complexity === 'high' ? 2000 : complexity === 'medium' ? 1000 : 500;
        
        // Determine depth requirement
        const depth = complexity === 'high' ? 'high' : complexity === 'medium' ? 'medium' : 'low';
        
        // Adjust based on emotional state
        let finalComplexity = complexity;
        if (emotion.stress === 'high' && complexity === 'high') {
            finalComplexity = 'medium'; // Reduce complexity when stressed
        }

        return {
            complexity: finalComplexity,
            estimatedTime,
            depth,
            requiresFocus: complexity === 'high' || emotion.focus === 'deep'
        };
    }

    /**
     * Estimate query complexity
     */
    private estimateQueryComplexity(query: QueryIntent): 'low' | 'medium' | 'high' {
        const queryStr = JSON.stringify(query).toLowerCase();
        
        // Simple heuristics
        if (queryStr.includes('complex') || queryStr.includes('analyze') || queryStr.includes('deep')) {
            return 'high';
        }
        if (queryStr.includes('search') || queryStr.includes('find') || queryStr.includes('get')) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Convert query to action representation
     */
    private queryToAction(query: QueryIntent): Action {
        const complexity = this.estimateQueryComplexity(query);
        return {
            complexity,
            estimatedTime: complexity === 'high' ? 2000 : complexity === 'medium' ? 1000 : 500,
            depth: complexity === 'high' ? 'high' : complexity === 'medium' ? 'medium' : 'low',
            requiresFocus: complexity === 'high'
        };
    }

    /**
     * Generate human-readable reasoning
     */
    private generateReasoning(
        emotion: EmotionalState,
        dataScore: number,
        emotionScore: number,
        contextScore: number
    ): string {
        const parts: string[] = [];

        if (emotion.stress === 'high') {
            parts.push('User is experiencing high stress - prioritizing simple, fast actions');
        }

        if (emotion.focus === 'deep') {
            parts.push('User is in deep focus mode - allowing complex tasks');
        }

        if (dataScore > 0.8) {
            parts.push('High data quality available');
        }

        if (emotionScore > 0.8) {
            parts.push('Action matches emotional state well');
        }

        if (contextScore > 0.8) {
            parts.push('High context relevance');
        }

        return parts.length > 0 
            ? parts.join('. ') 
            : 'Balanced decision based on available information';
    }
}

export const emotionAwareDecisionEngine = new EmotionAwareDecisionEngine();

