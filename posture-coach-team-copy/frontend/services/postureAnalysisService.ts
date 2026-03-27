/**
 * Team 1 Posture Analysis Service
 * Handles integration with Team 1's posture analysis output
 */

export interface PostureAnalysisResult {
    session_id: string;
    results: {
        [key: string]: {
            metric: string;
            posture_risk_percent: number;
            status: string;
        };
    };
    recommendation: {
        session_id: string;
        risk_level: 'LOW' | 'MODERATE' | 'HIGH';
        dominant_issue: string;
        recommendation: {
            priority: 'LOW' | 'MEDIUM' | 'HIGH';
            message: string;
            actions: string[];
        };
    };
}

/**
 * Process Team 1's posture analysis output
 */
export function processPostureAnalysis(data: PostureAnalysisResult) {
    const { results, recommendation } = data;

    // Extract metrics
    const metrics = Object.entries(results).map(([key, value]) => ({
        key,
        metric: value.metric,
        riskPercent: value.posture_risk_percent,
        status: value.status,
    }));

    // Determine overall posture score (inverse of risk)
    const avgRisk = metrics.reduce((sum, m) => sum + m.riskPercent, 0) / metrics.length;
    const postureScore = Math.round(100 - avgRisk);

    return {
        sessionId: data.session_id,
        postureScore,
        riskLevel: recommendation.risk_level,
        dominantIssue: recommendation.dominant_issue,
        message: recommendation.recommendation.message,
        actions: recommendation.recommendation.actions,
        metrics,
    };
}

/**
 * Map risk level to display color
 */
export function getRiskColor(riskLevel: string): string {
    switch (riskLevel.toUpperCase()) {
        case 'LOW':
            return '#10b981'; // green
        case 'MODERATE':
            return '#f59e0b'; // yellow
        case 'HIGH':
            return '#ef4444'; // red
        default:
            return '#6b7280'; // gray
    }
}

/**
 * Map dominant issue to body part
 */
export function mapIssueToBodyPart(issue: string): {
    bodyPart: string;
    description: string;
} {
    if (issue.includes('head_forward')) {
        return {
            bodyPart: 'Head',
            description: 'Forward head posture detected',
        };
    }
    if (issue.includes('shoulder')) {
        return {
            bodyPart: 'Shoulder',
            description: 'Shoulder alignment issue',
        };
    }
    if (issue.includes('neck')) {
        return {
            bodyPart: 'Neck',
            description: 'Neck strain detected',
        };
    }
    if (issue.includes('torso') || issue.includes('back')) {
        return {
            bodyPart: 'Torso',
            description: 'Back posture issue',
        };
    }

    return {
        bodyPart: 'General',
        description: 'Posture issue detected',
    };
}
