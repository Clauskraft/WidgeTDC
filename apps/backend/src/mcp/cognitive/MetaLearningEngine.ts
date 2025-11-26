/**
 * Meta-Learning Engine
 * Learns how to learn - optimizes learning strategies across tasks
 */

export interface LearningStrategy {
    name: string;
    parameters: Record<string, any>;
    performance: {
        tasksApplied: number;
        avgImprovement: number;
        bestDomain: string;
    };
}

export interface TaskDomain {
    name: string;
    characteristics: string[];
    optimalStrategy: string;
    transferability: Map<string, number>; // How well learning transfers to other domains
}

export class MetaLearningEngine {
    private strategies: Map<string, LearningStrategy> = new Map();
    private domains: Map<string, TaskDomain> = new Map();
    private learningHistory: Array<{
        domain: string;
        strategy: string;
        improvement: number;
        timestamp: Date;
    }> = [];

    constructor() {
        this.initializeDefaultStrategies();
    }

    /**
     * Initialize default learning strategies
     */
    private initializeDefaultStrategies(): void {
        const defaultStrategies: LearningStrategy[] = [
            {
                name: 'gradient_descent',
                parameters: { learningRate: 0.01, momentum: 0.9 },
                performance: { tasksApplied: 0, avgImprovement: 0, bestDomain: '' },
            },
            {
                name: 'few_shot',
                parameters: { examples: 5, temperature: 0.7 },
                performance: { tasksApplied: 0, avgImprovement: 0, bestDomain: '' },
            },
            {
                name: 'reinforcement',
                parameters: { explorationRate: 0.1, discountFactor: 0.95 },
                performance: { tasksApplied: 0, avgImprovement: 0, bestDomain: '' },
            },
            {
                name: 'transfer_learning',
                parameters: { sourceTask: '', fineTuneEpochs: 10 },
                performance: { tasksApplied: 0, avgImprovement: 0, bestDomain: '' },
            },
        ];

        defaultStrategies.forEach(strategy => {
            this.strategies.set(strategy.name, strategy);
        });
    }

    /**
     * Select optimal learning strategy for a task
     */
    selectStrategy(domain: string, taskCharacteristics: string[]): LearningStrategy {
        const domainInfo = this.domains.get(domain);

        if (domainInfo && domainInfo.optimalStrategy) {
            const strategy = this.strategies.get(domainInfo.optimalStrategy);
            if (strategy) return strategy;
        }

        // Find strategy with best performance in similar domains
        const strategies = Array.from(this.strategies.values());
        const scored = strategies.map(strategy => {
            const relevantHistory = this.learningHistory.filter(h => h.strategy === strategy.name);
            const avgImprovement = relevantHistory.length > 0
                ? relevantHistory.reduce((sum, h) => sum + h.improvement, 0) / relevantHistory.length
                : 0;

            return { strategy, score: avgImprovement };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.strategy || strategies[0];
    }

    /**
     * Record learning outcome
     */
    recordLearningOutcome(
        domain: string,
        strategy: string,
        improvement: number
    ): void {
        this.learningHistory.push({
            domain,
            strategy,
            improvement,
            timestamp: new Date(),
        });

        // Update strategy performance
        const strategyObj = this.strategies.get(strategy);
        if (strategyObj) {
            strategyObj.performance.tasksApplied++;
            strategyObj.performance.avgImprovement =
                (strategyObj.performance.avgImprovement * (strategyObj.performance.tasksApplied - 1) + improvement) /
                strategyObj.performance.tasksApplied;
        }

        // Update domain optimal strategy
        this.updateDomainStrategy(domain);
    }

    /**
     * Update optimal strategy for a domain
     */
    private updateDomainStrategy(domain: string): void {
        const domainHistory = this.learningHistory.filter(h => h.domain === domain);
        if (domainHistory.length < 5) return; // Need enough data

        // Group by strategy
        const strategyPerformance = new Map<string, number[]>();
        domainHistory.forEach(h => {
            if (!strategyPerformance.has(h.strategy)) {
                strategyPerformance.set(h.strategy, []);
            }
            strategyPerformance.get(h.strategy)!.push(h.improvement);
        });

        // Find best strategy
        let bestStrategy = '';
        let bestAvg = -Infinity;

        strategyPerformance.forEach((improvements, strategy) => {
            const avg = improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestStrategy = strategy;
            }
        });

        // Update domain
        if (!this.domains.has(domain)) {
            this.domains.set(domain, {
                name: domain,
                characteristics: [],
                optimalStrategy: bestStrategy,
                transferability: new Map(),
            });
        } else {
            this.domains.get(domain)!.optimalStrategy = bestStrategy;
        }
    }

    /**
     * Transfer learning from one domain to another
     */
    async transferLearning(
        sourceDomain: string,
        targetDomain: string
    ): Promise<LearningStrategy | null> {
        const source = this.domains.get(sourceDomain);
        if (!source) return null;

        // Check transferability
        const transferScore = source.transferability.get(targetDomain) || 0;

        if (transferScore > 0.5) {
            // High transferability - use source domain's strategy
            const strategy = this.strategies.get(source.optimalStrategy);
            if (strategy) {
                console.log(`📚 Transferring learning from ${sourceDomain} to ${targetDomain}`);
                return strategy;
            }
        }

        return null;
    }

    /**
     * Optimize learning parameters
     */
    optimizeParameters(strategyName: string): Record<string, any> {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) return {};

        // Simple parameter optimization based on historical performance
        const recentHistory = this.learningHistory
            .filter(h => h.strategy === strategyName)
            .slice(-20);

        if (recentHistory.length < 10) return strategy.parameters;

        // Analyze if we should adjust learning rate (example)
        const avgImprovement = recentHistory.reduce((sum, h) => sum + h.improvement, 0) / recentHistory.length;

        if (avgImprovement < 0.1 && strategy.parameters.learningRate) {
            // Low improvement - increase learning rate
            strategy.parameters.learningRate *= 1.1;
        } else if (avgImprovement > 0.5 && strategy.parameters.learningRate) {
            // High improvement - decrease learning rate for fine-tuning
            strategy.parameters.learningRate *= 0.9;
        }

        return strategy.parameters;
    }

    /**
     * Get meta-learning statistics
     */
    getStatistics(): {
        totalStrategies: number;
        totalDomains: number;
        mostEffectiveStrategy: string;
        avgImprovementRate: number;
    } {
        const strategies = Array.from(this.strategies.values());
        const mostEffective = strategies.sort((a, b) =>
            b.performance.avgImprovement - a.performance.avgImprovement
        )[0];

        const avgImprovement = this.learningHistory.length > 0
            ? this.learningHistory.reduce((sum, h) => sum + h.improvement, 0) / this.learningHistory.length
            : 0;

        return {
            totalStrategies: this.strategies.size,
            totalDomains: this.domains.size,
            mostEffectiveStrategy: mostEffective?.name || 'none',
            avgImprovementRate: avgImprovement,
        };
    }
}

export const metaLearningEngine = new MetaLearningEngine();
