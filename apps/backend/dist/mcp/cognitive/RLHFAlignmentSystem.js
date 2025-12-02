/**
 * RLHF (Reinforcement Learning from Human Feedback) Alignment System
 * Aligns AI behavior with human preferences through feedback
 */
export class RLHFAlignmentSystem {
    constructor() {
        this.feedbackLog = [];
        this.preferences = [];
        this.rewardModel = {
            weights: new Map(),
            bias: 0,
            accuracy: 0,
        };
    }
    /**
     * Collect human feedback
     */
    collectFeedback(feedback) {
        const fullFeedback = {
            ...feedback,
            id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };
        this.feedbackLog.push(fullFeedback);
        // Keep only last 1000 feedbacks
        if (this.feedbackLog.length > 1000) {
            this.feedbackLog.shift();
        }
        return fullFeedback.id;
    }
    /**
     * Collect preference comparison
     */
    collectPreference(comparison) {
        const fullComparison = {
            ...comparison,
            id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };
        this.preferences.push(fullComparison);
        // Retrain reward model periodically
        if (this.preferences.length % 10 === 0) {
            this.trainRewardModel();
        }
        return fullComparison.id;
    }
    /**
     * Train reward model from preferences
     */
    trainRewardModel() {
        if (this.preferences.length < 10)
            return;
        // Simple reward model training
        // In production, this would use proper ML techniques
        const features = new Map();
        this.preferences.forEach(pref => {
            const preferred = pref.preferred === 'A' ? pref.responseA : pref.responseB;
            const notPreferred = pref.preferred === 'A' ? pref.responseB : pref.responseA;
            // Extract simple features (length, politeness markers, etc.)
            const prefLength = preferred.length;
            const notPrefLength = notPreferred.length;
            features.set('length_preference', (features.get('length_preference') || 0) +
                (prefLength > notPrefLength ? 1 : -1));
            // Check for politeness markers
            const politeWords = ['please', 'thank', 'appreciate', 'kindly'];
            const prefPolite = politeWords.some(word => preferred.toLowerCase().includes(word));
            const notPrefPolite = politeWords.some(word => notPreferred.toLowerCase().includes(word));
            if (prefPolite && !notPrefPolite) {
                features.set('politeness', (features.get('politeness') || 0) + 1);
            }
        });
        // Update reward model weights
        features.forEach((value, feature) => {
            this.rewardModel.weights.set(feature, value / this.preferences.length);
        });
        console.log(`🎯 Reward model updated with ${this.preferences.length} preferences`);
    }
    /**
     * Predict reward for a response
     */
    predictReward(response) {
        let reward = this.rewardModel.bias;
        // Apply learned weights
        const length = response.length;
        reward += (this.rewardModel.weights.get('length_preference') || 0) * length / 1000;
        const politeWords = ['please', 'thank', 'appreciate', 'kindly'];
        const isPolite = politeWords.some(word => response.toLowerCase().includes(word));
        if (isPolite) {
            reward += this.rewardModel.weights.get('politeness') || 0;
        }
        return reward;
    }
    /**
     * Optimize response based on learned preferences
     */
    optimizeResponse(candidates) {
        if (candidates.length === 0)
            return '';
        if (candidates.length === 1)
            return candidates[0];
        // Score each candidate
        const scored = candidates.map(candidate => ({
            response: candidate,
            reward: this.predictReward(candidate),
        }));
        // Return highest scoring
        scored.sort((a, b) => b.reward - a.reward);
        return scored[0].response;
    }
    /**
     * Check alignment with safety constraints
     */
    checkSafetyConstraints(response) {
        const violations = [];
        // Check for harmful content patterns
        const harmfulPatterns = [
            /\b(hack|exploit|bypass)\b/i,
            /\b(illegal|unlawful)\b/i,
            /\b(violence|harm|hurt)\b/i,
        ];
        harmfulPatterns.forEach((pattern, index) => {
            if (pattern.test(response)) {
                violations.push(`Potential harmful content detected (pattern ${index + 1})`);
            }
        });
        // Check for dishonest patterns
        if (response.includes('I am certain') && response.includes('probably')) {
            violations.push('Contradictory certainty claims');
        }
        return {
            safe: violations.length === 0,
            violations,
        };
    }
    /**
     * Get feedback statistics
     */
    getFeedbackStatistics(agentId) {
        const relevant = agentId
            ? this.feedbackLog.filter(f => f.agentId === agentId)
            : this.feedbackLog;
        const avgRating = relevant.length > 0
            ? relevant.reduce((sum, f) => sum + f.rating, 0) / relevant.length
            : 0;
        const categoryBreakdown = relevant.reduce((acc, f) => {
            acc[f.category] = (acc[f.category] || 0) + 1;
            return acc;
        }, {});
        // Analyze trend (last 20 vs previous 20)
        const recent = relevant.slice(-20);
        const previous = relevant.slice(-40, -20);
        const recentAvg = recent.length > 0
            ? recent.reduce((sum, f) => sum + f.rating, 0) / recent.length
            : 0;
        const previousAvg = previous.length > 0
            ? previous.reduce((sum, f) => sum + f.rating, 0) / previous.length
            : 0;
        let trend = 'stable';
        if (recentAvg > previousAvg + 0.2)
            trend = 'improving';
        else if (recentAvg < previousAvg - 0.2)
            trend = 'declining';
        return {
            totalFeedback: relevant.length,
            avgRating,
            categoryBreakdown,
            recentTrend: trend,
        };
    }
    /**
     * Apply alignment corrections
     */
    async applyAlignmentCorrections(agentId) {
        const stats = this.getFeedbackStatistics(agentId);
        const corrections = [];
        if (stats.avgRating < 3) {
            corrections.push('Overall performance below acceptable threshold');
        }
        if (stats.categoryBreakdown.harmless && stats.categoryBreakdown.harmless < stats.totalFeedback * 0.8) {
            corrections.push('Increase safety measures');
        }
        if (stats.categoryBreakdown.honest && stats.categoryBreakdown.honest < stats.totalFeedback * 0.8) {
            corrections.push('Improve honesty and transparency');
        }
        if (stats.recentTrend === 'declining') {
            corrections.push('Performance declining - review recent changes');
        }
        return corrections;
    }
}
export const rlhfAlignmentSystem = new RLHFAlignmentSystem();
